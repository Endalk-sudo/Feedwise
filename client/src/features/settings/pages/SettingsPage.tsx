import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useOrganization, useUpdateOrganization, useUploadLogo } from '@/features/organization/hooks';
import { useUIStore } from '@/lib/stores/ui.store';
import { Building2, Upload, Save, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff, Zap, ZodError } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const settingsSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  logo: z.string().url().optional().or(z.literal('')),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const { session } = useAuthStore();
  const slug = session?.organization?.slug || '';
  const { data: org, isLoading } = useOrganization(slug);
  const updateOrg = useUpdateOrganization(slug);
  const uploadLogo = useUploadLogo(slug);
  const { addToast } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: org?.name || '',
      logo: org?.logo || '',
    },
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(org?.logo || null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await updateOrg.mutateAsync(data);
      addToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!slug) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
        <p className="text-slate-400">Please select an organization to manage settings</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = org?.currentPlan || 'basic';
  const subscriptionStatus = org?.subscriptionStatus || 'inactive';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your organization settings</p>
      </div>

      {/* Plan Status */}
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', currentPlan === 'pro' ? 'bg-purple-500/20' : 'bg-blue-500/20')}>
              {currentPlan === 'pro' ? (
                <Zap className="w-6 h-6 text-purple-400" />
              ) : (
                <Building2 className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold capitalize">{currentPlan} Plan</h3>
              <p className="text-sm text-slate-400 capitalize">{subscriptionStatus}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="/dashboard/settings"
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-all"
            >
              Manage Subscription
            </a>
          </div>
        </div>
      </div>

      {/* Organization Details */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Details
          </h2>

          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Logo</label>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-2">Upload a logo (PNG, JPG up to 2MB)</p>
                  <input
                    type="text"
                    {...register('logo')}
                    placeholder="Or enter logo URL"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {errors.logo && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.logo.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Organization Name
              </label>
              <input
                {...register('name')}
                id="name"
                type="text"
                className={cn(
                  'w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all',
                  errors.name ? 'border-red-500' : 'border-slate-700'
                )}
                placeholder="Acme Inc."
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Read-only fields */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Slug</label>
                <input type="text" value={org?.slug} readOnly className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Business Type</label>
                <input type="text" value={org?.businessType} readOnly className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-500" />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={updateOrg.isPending}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateOrg.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-slate-400 mb-4">Irreversible actions</p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors">
              Delete Organization
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}