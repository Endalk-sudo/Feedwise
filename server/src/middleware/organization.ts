import { prisma } from '@/lib/prisma.js';
import type { Organization, OrganizationMember } from '@prisma/client';

export interface OrganizationContext {
  organization: Organization | null;
  member: OrganizationMember | null;
}

/**
 * Shared slug → organization + membership lookup.
 * Replaces the org/member boilerplate copy-pasted across feature routes.
 */
export async function resolveOrganizationMember(
  slug: string,
  userId: string,
): Promise<OrganizationContext> {
  const organization = await prisma.organization.findUnique({ where: { slug } });
  if (!organization) {
    return { organization: null, member: null };
  }

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
  });

  return { organization, member };
}
