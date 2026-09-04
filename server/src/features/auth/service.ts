import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import type { Organization } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface OrganizationStatus {
  hasOrganization: boolean;
  organization: Organization | null;
}

/** Resolve the Better Auth session user from request headers. Null when unauthenticated. */
export async function getSessionUser(headers: Record<string, string | string[] | undefined>) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
  return session;
}

/** First organization membership for a user (used for onboarding redirects). */
export async function getOrganizationStatus(userId: string): Promise<OrganizationStatus> {
  const member = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });

  return {
    hasOrganization: !!member,
    organization: member?.organization ?? null,
  };
}
