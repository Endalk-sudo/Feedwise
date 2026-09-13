import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma.js';
import { env } from '../../lib/env.js';
import { generateCategoriesForBusiness } from '../ai/service.js';

export const organizationService = {
  async create(userId: string, data: {
    name: string;
    slug: string;
    businessType: string;
    businessDescription: string;
  }) {
    // Check if slug is already taken
    const existing = await prisma.organization.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new Error('This slug is already taken');
    }

    // Generate AI categories based on business type
    const categories = await generateCategoriesForBusiness(data.businessType, data.businessDescription);

    // Create organization with owner as member
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        businessType: data.businessType,
        businessDescription: data.businessDescription,
        categories,
        qrDataUrl: '', // Will be generated after creation
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: true,
      },
    });

    // Generate QR code URL
    const feedbackUrl = `${env.CLIENT_URL}/feedback/${organization.slug}`;
    const qrDataUrl = await QRCode.toDataURL(feedbackUrl);

    // Update organization with QR code
    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: { qrDataUrl },
      include: { members: true },
    });

    return updatedOrg;
  },

  async getBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
  },

  async getById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
  },

  /**
   * Rebuild the QR code for an org from the current CLIENT_URL.
   * Needed when the public domain changed after creation (the QR encodes
   * `${CLIENT_URL}/feedback/<slug>` at generation time) or when qrDataUrl
   * is empty for older organizations.
   */
  async regenerateQrCode(slug: string) {
    const organization = await prisma.organization.findUnique({ where: { slug } });
    if (!organization) {
      throw new Error('Organization not found');
    }
    const feedbackUrl = `${env.CLIENT_URL}/feedback/${organization.slug}`;
    const qrDataUrl = await QRCode.toDataURL(feedbackUrl);
    return prisma.organization.update({
      where: { id: organization.id },
      data: { qrDataUrl },
    });
  },

  async update(
    id: string,
    data: { name?: string; logo?: string; emailDigest?: boolean },
  ) {
    const { emailDigest, ...fields } = data;
    // emailDigest is not a column: merge it into the settings JSON opt-out
    // consumed by getOrgRecipientEmails (mail.ts).
    if (emailDigest !== undefined) {
      const current = await prisma.organization.findUnique({
        where: { id },
        select: { settings: true },
      });
      const settings = { ...((current?.settings ?? {}) as Record<string, unknown>), emailDigest };
      return prisma.organization.update({ where: { id }, data: { ...fields, settings } });
    }
    return prisma.organization.update({
      where: { id },
      data: fields,
    });
  },

  async getUserOrganizations(userId: string) {
    return prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });
  },

  async addMember(organizationId: string, userId: string, role: string = 'member') {
    return prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
    });
  },

  async removeMember(organizationId: string, userId: string) {
    return prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  },

  async updateMemberRole(organizationId: string, userId: string, role: string) {
    return prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      data: { role },
    });
  },
};