import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware, optionalAuthMiddleware } from '@/middleware/auth.js';
import { organizationService } from './service.js';
import {
  createOrgSchema,
  updateOrgSchema,
  orgParamsSchema,
  addMemberSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
} from './schemas.js';
import { prisma } from '@/lib/prisma.js';

const router = Router();

// Create organization (protected)
router.post('/', authMiddleware, validate(createOrgSchema), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const organization = await organizationService.create(userId, req.body);
    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

// Get user's organizations (protected)
router.get('/my-orgs', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const organizations = await organizationService.getUserOrganizations(userId);
    res.json({ success: true, data: organizations });
  } catch (error) {
    next(error);
  }
});

// Get organization by slug (public for feedback page; member info when authed)
router.get('/:slug', optionalAuthMiddleware, validate(orgParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const organization = await organizationService.getBySlug(slug);

    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // For public access, only return basic info
    const isAuthed = !!(req as any).user;
    const user = (req as any).user;

    let isMember = false;
    let userRole: string | null = null;

    if (isAuthed && user) {
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          },
        },
      });
      isMember = !!member;
      userRole = member?.role || null;
    }

    const publicData = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      businessType: organization.businessType,
      businessDescription: organization.businessDescription,
      qrDataUrl: organization.qrDataUrl,
      categories: organization.categories,
      settings: organization.settings,
      subscriptionStatus: organization.subscriptionStatus,
      currentPlan: organization.currentPlan,
      isMember,
      userRole,
      // Only include members if user is a member
      members: isMember ? organization.members : undefined,
    };

    res.json({ success: true, data: publicData });
  } catch (error) {
    next(error);
  }
});

// Regenerate QR code (protected, owner/admin only) — re-encodes the
// feedback URL from the current CLIENT_URL so moved deployments get a
// working code without recreating the organization.
router.post(
  '/:slug/qr/regenerate',
  authMiddleware,
  validate(orgParamsSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const userId = (req as any).user.id;

      const organization = await organizationService.getBySlug(slug);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: organization.id,
          },
        },
      });

      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res
          .status(403)
          .json({ success: false, message: 'Forbidden - Insufficient permissions' });
      }

      const updated = await organizationService.regenerateQrCode(slug);
      res.json({ success: true, data: { qrDataUrl: updated.qrDataUrl } });
    } catch (error) {
      next(error);
    }
  },
);

// Update organization (protected, owner/admin only)
router.put('/:slug', authMiddleware, validate(updateOrgSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const userId = (req as any).user.id;

    const organization = await organizationService.getBySlug(slug);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Check if user is owner or admin
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id,
        },
      },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res
        .status(403)
        .json({ success: false, message: 'Forbidden - Insufficient permissions' });
    }

    const updated = await organizationService.update(organization.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Add member (protected, owner/admin only)
router.post('/:slug/members', authMiddleware, validate(addMemberSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const { email, role = 'member' } = req.body;
    const userId = (req as any).user.id;

    const organization = await organizationService.getBySlug(slug);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Check permissions
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id,
        },
      },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res
        .status(403)
        .json({ success: false, message: 'Forbidden - Insufficient permissions' });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newMember = await organizationService.addMember(organization.id, userToAdd.id, role);
    res.status(201).json({ success: true, data: newMember });
  } catch (error) {
    next(error);
  }
});

// Remove member (protected, owner only)
router.delete(
  '/:slug/members/:userId',
  authMiddleware,
  validate(removeMemberSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const targetUserId = req.params.userId as string;
      const userId = (req as any).user.id;

      const organization = await organizationService.getBySlug(slug);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      // Check if requester is owner
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: organization.id,
          },
        },
      });

      if (!member || member.role !== 'owner') {
        return res.status(403).json({ success: false, message: 'Forbidden - Owner only' });
      }

      // Can't remove self
      if (targetUserId === userId) {
        return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
      }

      await organizationService.removeMember(organization.id, targetUserId);
      res.json({ success: true, message: 'Member removed' });
    } catch (error) {
      next(error);
    }
  },
);

// Update member role (protected, owner only)
router.put(
  '/:slug/members/:userId',
  authMiddleware,
  validate(updateMemberRoleSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const targetUserId = req.params.userId as string;
      const { role } = req.body;
      const userId = (req as any).user.id;

      const organization = await organizationService.getBySlug(slug);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: organization.id,
          },
        },
      });

      if (!member || member.role !== 'owner') {
        return res.status(403).json({ success: false, message: 'Forbidden - Owner only' });
      }

      // Owners keep their role
      if (targetUserId === userId) {
        return res.status(400).json({ success: false, message: 'Cannot change your own role' });
      }

      const updated = await organizationService.updateMemberRole(
        organization.id,
        targetUserId,
        role,
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);

export { router as organizationRoutes };
