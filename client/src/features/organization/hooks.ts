import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useUIStore } from '@/lib/stores/ui.store';
import type { Organization, CreateOrgData, UpdateOrgData, AddMemberData } from './types';

/**
 * Hook to fetch organization by slug
 */
export function useOrganization(slug: string) {
  return useQuery<Organization>({
    queryKey: ['organization', slug],
    queryFn: () => apiClient.organizations.getBySlug(slug).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch user's organizations
 */
export function useMyOrganizations() {
  return useQuery<{ organization: Organization; role: string }[]>({
    queryKey: ['my-organizations'],
    queryFn: () => apiClient.organizations.getMyOrgs().then((res) => res.data),
  });
}

/**
 * Hook to create organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (data: CreateOrgData) => apiClient.organizations.create(data).then((res) => res.data),
    onSuccess: (newOrg) => {
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

  return useMutation({
    mutationFn: (data: UpdateOrgData) => apiClient.organizations.update(slug, data).then((res) => res.data),
    onSuccess: (updatedOrg) => {
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

  return useMutation({
    mutationFn: (file: File) => apiClient.organizations.uploadLogo(slug, file).then((res) => res.data),
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
 * Hook to add member to organization
 */
export function useAddMember(slug: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (data: AddMemberData) => apiClient.organizations.addMember(slug, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      addToast({ message: 'Member added successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to add member', type: 'error' });
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
    mutationFn: (userId: string) => apiClient.organizations.removeMember(slug, userId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', slug] });
      addToast({ message: 'Member removed successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to remove member', type: 'error' });
    },
  });
}