import { useState, type FormEvent } from 'react';
import { Users, UserPlus, Trash2, Crown, Shield, User } from 'lucide-react';
import { useOrgSlug } from '@/lib/stores/auth.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import {
  useOrganization,
  useAddMember,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/features/organization/hooks';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Select,
  EmptyState,
  LoadingState,
  type BadgeProps,
} from '@/components/ui';

const roleVariant: Record<string, BadgeProps['variant']> = {
  owner: 'info',
  admin: 'warning',
  member: 'neutral',
};

const roleIcon: Record<string, typeof User> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

export function MembersPage() {
  const slug = useOrgSlug();
  const { user } = useAuthStore();
  const currentUserId = (user as { id?: string } | null)?.id;
  const { data: organization, isLoading, isError } = useOrganization(slug || '');
  const addMember = useAddMember(slug || '');
  const removeMember = useRemoveMember(slug || '');
  const updateRole = useUpdateMemberRole(slug || '');

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  if (!slug) {
    return (
      <EmptyState
        icon={Users}
        title="No organization selected"
        description="Select an organization to manage its team"
      />
    );
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    addMember.mutate(
      { email: trimmed, role },
      { onSuccess: () => { setEmail(''); setRole('member'); } },
    );
  };

  const members = organization?.members ?? [];
  // Server truth: members list is only returned for org members; add/remove
  // are owner|admin-gated and role changes owner-gated (403 otherwise).
  const userRole = organization?.userRole;
  const canManage = userRole === 'owner' || userRole === 'admin';
  const canChangeRoles = userRole === 'owner';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Invite staff by email — they must already have an account"
      />

      {canManage && (
        <Card>
          <h2 className="text-[15px] font-semibold tracking-tight mb-1">Invite a teammate</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            They need a FeedWise account first — then add them here by email.
          </p>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                aria-label="Teammate email"
              />
            </div>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-background sm:w-40"
              aria-label="Role"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
            <Button type="submit" disabled={addMember.isPending} className="sm:w-auto">
              <UserPlus className="w-4 h-4" />
              {addMember.isPending ? 'Adding…' : 'Add member'}
            </Button>
          </form>
          <p className="text-[13px] leading-relaxed text-muted-foreground mt-4 pt-4 border-t border-border/60">
            Members see the dashboard and can act on feedback. Admins can also manage
            members; only owners can change roles.
          </p>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading team…" />
        ) : isError ? (
          <div className="p-12 text-center text-destructive text-sm">Failed to load team</div>
        ) : members.length === 0 ? (
          <EmptyState
            compact
            icon={Users}
            title="No team members yet"
            description="Add your first teammate above to share the feedback workload."
          />
        ) : (
          <ul className="divide-y divide-border">
            {members.map((member) => {
              const RoleIcon = roleIcon[member.role] ?? User;
              const isSelf = currentUserId === member.userId;
              return (
                <li
                  key={member.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground shrink-0 shadow-xs">
                      {(member.user.name?.charAt(0) || member.user.email.charAt(0)).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.name || member.user.email}
                        {isSelf && (
                          <span className="text-muted-foreground font-normal"> (you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={roleVariant[member.role] ?? 'neutral'}>
                      <RoleIcon className="w-3 h-3" />
                      {member.role}
                    </Badge>
                    {canChangeRoles && !isSelf && member.role !== 'owner' && (
                      <Select
                        value={member.role}
                        onChange={(e) =>
                          updateRole.mutate({ userId: member.userId, role: e.target.value })
                        }
                        disabled={updateRole.isPending}
                        className="bg-background w-32"
                        aria-label={`Change role for ${member.user.email}`}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </Select>
                    )}
                    {canManage && !isSelf && member.role !== 'owner' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => removeMember.mutate(member.userId)}
                        disabled={removeMember.isPending}
                        aria-label={`Remove ${member.user.email}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
