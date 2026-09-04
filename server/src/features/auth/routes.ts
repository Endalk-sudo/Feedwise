import { Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

const router = Router();

// Better Auth handles all auth routes automatically at /api/auth/*
// This router is for any custom auth-related endpoints

// Get current session (alternative to Better Auth's built-in endpoint)
router.get('/me', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get session' });
  }
});

// Check if user has organization
router.get('/has-org', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Check if user has organization (via organizationMember)
    const member = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    res.json({
      success: true,
      data: {
        hasOrganization: !!member,
        organization: member?.organization || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check organization' });
  }
});

export { router as authRoutes };