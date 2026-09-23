export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  businessType: string;
  businessDescription: string;
  qrDataUrl: string | null;
  categories: string[];
  settings: Record<string, unknown> | null;
  subscriptionStatus: string;
  currentPlan: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
  userRole?: string | null;
  members?: OrganizationMember[];
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface CreateOrgData {
  name: string;
  slug: string;
  businessType: string;
  businessDescription: string;
}

export interface UpdateOrgData {
  name?: string;
  logo?: string;
  /** Org-level email opt-out (digest/referral sends check settings.emailDigest). */
  emailDigest?: boolean;
}

export interface AddMemberData {
  email: string;
  role?: string;
}
