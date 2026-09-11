import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

/** Unwrap the standard server envelope: { success: true, data: T }. */
function unwrapData<T>(request: Promise<{ data: { data: T } }>): Promise<T> {
  return request.then((res) => res.data.data);
}
import { useUIStore } from '@/lib/stores/ui.store';
import type { Organization, CreateOrgData, UpdateOrgData, AddMemberData } from './types';

/**
 * Hook to fetch organization by slug
 */
export function useOrganization(slug: string) {
  return useQuery<Organization>({
    queryKey: ['organization', slug],
    queryFn: () => unwrapData(apiClient.organizations.getBySlug(slug)),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch user's organizations
 */
export function useMyOrganizations() {
  return useQuery<{ organization: Organization; role: string }[]>({
    queryKey: ['my-organizations'],
    queryFn: () => unwrapData(apiClient.organizations.getMyOrgs()),
  });
}

/**
 * Hook to create organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation<Organization, Error, CreateOrgData>({
    mutationFn: (data: CreateOrgData) => unwrapData(apiClient.organizations.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
      addToast({ message: 'Organization created successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to create organization', type: 'error' });
    },
  });
}

/**
 * Hook to update organization
 */
export function useUpdateOrganization(slug: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation<Organization, Error, UpdateOrgData>({
    mutationFn: (data: UpdateOrgData) => unwrapData(apiClient.organizations.update(slug, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
      addToast({ message: 'Organization updated successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to update organization', type: 'error' });
    },
  });
}

/**
 * Hook to upload organization logo
 */
export function useUploadLogo(slug: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation<{ logo: string }, Error, File>({
    mutationFn: (file: File) => unwrapData(apiClient.organizations.uploadLogo(slug, file)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      addToast({ message: 'Logo uploaded successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to upload logo', type: 'error' });
    },
  });
}

/**
 * Hook to add member to organization.
 * Note: the server only adds already-registered users by email
 * (404 when the email has no account yet).
 */
export function useAddMember(slug: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (data: AddMemberData) => unwrapData(apiClient.organizations.addMember(slug, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      addToast({ message: 'Member added successfully!', type: 'success' });
    },
    onError: (error) => {
      const serverMessage = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      addToast({
        message: serverMessage || (error instanceof Error ? error.message : 'Failed to add member'),
        type: 'error',
      });
    },
  });
}

/**
 * Hook to remove member from organization
 */
export function useRemoveMember(slug: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (userId: string) => unwrapData(apiClient.organizations.removeMember(slug, userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      addToast({ message: 'Member removed successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to remove member', type: 'error' });
    },
  });
}

/**
 * Hook to change a member's role (owner only, server-enforced).
 */
export function useUpdateMemberRole(slug: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      unwrapData(apiClient.organizations.updateMemberRole(slug, userId, { role })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      addToast({ message: 'Member role updated!', type: 'success' });
    },
    onError: (error) => {
      const serverMessage = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      addToast({
        message:
          serverMessage || (error instanceof Error ? error.message : 'Failed to update role'),
        type: 'error',
      });
    },
  });
}