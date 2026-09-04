import { prisma } from '@/lib/prisma.js';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinary.js';

export class SettingsError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

interface MemberContext {
  organizationId: string;
}

/** Load org by slug and require owner/admin membership. */
export async function requireOrgManager(slug: string, userId: string): Promise<MemberContext> {
  const organization = await prisma.organization.findUnique({ where: { slug } });
  if (!organization) {
    throw new SettingsError(404, 'Organization not found');
  }

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
  });

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new SettingsError(403, 'Forbidden');
  }

  return { organizationId: organization.id };
}

/** Settings view for members (includes members list, excludes billing secrets). */
export async function getSettings(slug: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });
  if (!organization) {
    throw new SettingsError(404, 'Organization not found');
  }

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
  });
  if (!member) {
    throw new SettingsError(403, 'Forbidden');
  }

  return organization;
}

/** Whitelisted settings update (owner/admin). */
export async function updateSettings(
  slug: string,
  userId: string,
  data: { name?: string; logo?: string },
) {
  const { organizationId } = await requireOrgManager(slug, userId);
  return prisma.organization.update({ where: { id: organizationId }, data });
}

/** Upload a new logo, deleting the previous one (owner/admin). */
export async function uploadLogo(
  slug: string,
  userId: string,
  // eslint-disable-next-line no-undef
  file: Express.Multer.File,
): Promise<{ logo: string }> {
  const { organizationId } = await requireOrgManager(slug, userId);

  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) {
    throw new SettingsError(404, 'Organization not found');
  }

  if (organization.logo) {
    const publicId = organization.logo.split('/').pop()?.split('.')[0];
    if (publicId) {
      await deleteFromCloudinary(`organizations/${organization.id}/${publicId}`);
    }
  }

  const result = await uploadToCloudinary(file.buffer, `organizations/${organization.id}`);
  await prisma.organization.update({
    where: { id: organization.id },
    data: { logo: result.secure_url },
  });

  return { logo: result.secure_url };
}
