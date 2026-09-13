import { useEffect, useState, type ChangeEvent } from 'react';
import { useOrgSlug } from '@/lib/stores/auth.store';
import {
  useOrganization,
  useUpdateOrganization,
  useUploadLogo,
} from '@/features/organization/hooks';
import { apiClient } from '@/lib/api';
import { useUIStore } from '@/lib/stores/ui.store';
import { Building2, Upload, Save, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSettingsFormSchema, type SettingsForm } from '@aifc/contracts';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Field,
  FieldError,
  EmptyState,
  LoadingState,
} from '@/components/ui';
import { CollectFeedbackCard } from '../components/CollectFeedbackCard';

export function SettingsPage() {
  const slug = useOrgSlug();
  const { data: org, isLoading } = useOrganization(slug);
  const updateOrg = useUpdateOrganization(slug);
  const uploadLogo = useUploadLogo(slug);
  const { addToast } = useUIStore();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<SettingsForm>({
    resolver: zodResolver(updateSettingsFormSchema),
    defaultValues: {
      name: '',
      logo: '',
    },
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [emailDigest, setEmailDigest] = useState(false);

  // Populate the form once the org loads
  useEffect(() => {
    if (org) {
      reset({ name: org.name, logo: org.logo ?? '' });
      setLogoPreview(org.logo);
      // Default digest ON when no explicit opt-out is stored yet.
      const settings = (org.settings ?? {}) as { emailDigest?: boolean };
      setEmailDigest(settings.emailDigest !== false);
    }
  }, [org, reset]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await updateOrg.mutateAsync({ ...data, emailDigest });
      addToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch {
      // Error handled by mutation
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const res = await apiClient.payments.createPortal();
      const url = (res.data as { data?: { url?: string } }).data?.url;
      if (url) {
        window.location.href = url;
      } else {
        addToast({ message: 'No billing portal available yet', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to open billing portal', type: 'error' });
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Please select an image file', type: 'error' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast({ message: 'File size must be less than 2MB', type: 'error' });
      return;
    }

    try {
      const result = await uploadLogo.mutateAsync(file);
      setLogoPreview(result.logo);
      setValue('logo', result.logo);
      addToast({ message: 'Logo uploaded successfully!', type: 'success' });
    } catch {
      // Error handled by mutation
    }
  };

  if (!slug) {
    return (
      <EmptyState
        title="No organization selected"
        description="Please select an organization to manage settings"
      />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading settings…" className="h-64" />;
  }

  const currentPlan = org?.currentPlan || 'basic';
  const subscriptionStatus = org?.subscriptionStatus || 'inactive';

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your organization settings" />

      {/* Public collection point — the dashboard "QR & link" button lands here */}
      {org && (
        <CollectFeedbackCard
          slug={org.slug}
          qrDataUrl={org.qrDataUrl}
          canManage={org.userRole === 'owner' || org.userRole === 'admin'}
        />
      )}

      {/* Plan Status */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              {currentPlan === 'pro' ? (
                <Zap className="w-6 h-6 text-primary" />
              ) : (
                <Building2 className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold capitalize">{currentPlan} Plan</h3>
              <p className="text-sm text-muted-foreground capitalize">{subscriptionStatus}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleManageSubscription} disabled={isPortalLoading}>
            {isPortalLoading ? 'Opening…' : 'Manage Subscription'}
          </Button>
        </div>
      </Card>

      {/* Organization Details */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Organization Details
          </h2>

          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Logo</label>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary border border-input flex-shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Upload className="w-4 h-4 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a logo (PNG, JPG up to 2MB)
                  </p>
                  <Input type="text" {...register('logo')} placeholder="Or enter logo URL" />
                  {errors.logo && <FieldError message={errors.logo.message} />}
                </div>
              </div>
            </div>

            {/* Name */}
            <Field label="Organization Name" htmlFor="name" error={errors.name?.message}>
              <Input
                {...register('name')}
                id="name"
                type="text"
                className={errors.name ? 'border-destructive' : undefined}
                placeholder="Acme Inc."
              />
            </Field>

            {/* Read-only fields */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Slug</label>
                <Input
                  type="text"
                  value={org?.slug ?? ''}
                  readOnly
                  className="text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Business Type</label>
                <Input
                  type="text"
                  value={org?.businessType ?? ''}
                  readOnly
                  className="text-muted-foreground"
                />
              </div>
            </div>

            {/* Email preferences */}
            <div className="pt-4 border-t border-border">
              <Field label="Email Notifications" htmlFor="emailDigest">
                <label
                  htmlFor="emailDigest"
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <input
                    id="emailDigest"
                    type="checkbox"
                    className="w-4 h-4 accent-primary"
                    checked={emailDigest}
                    onChange={(e) => setEmailDigest(e.target.checked)}
                  />
                  <span className="text-sm text-foreground">
                    Daily feedback digest + urgent alerts by email
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Applies to this organization. Unsubscribe links in emails point here.
                </p>
              </Field>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 mt-6 border-t border-border">
            <Button
              type="submit"
              size="lg"
              disabled={updateOrg.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="w-5 h-5" />
              {updateOrg.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
