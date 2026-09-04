import { useState, type ChangeEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCreateOrganization } from '@/features/organization/hooks';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';

const BUSINESS_TYPES = [
  'SaaS',
  'E-commerce',
  'Restaurant',
  'Healthcare',
  'Education',
  'Finance',
  'Real Estate',
  'Retail',
  'Manufacturing',
  'Logistics',
  'Media',
  'Entertainment',
  'Travel',
  'Automotive',
  'Legal',
  'Marketing',
  'Consulting',
  'Non-profit',
  'Government',
  'Agriculture',
  'Energy',
  'Telecommunications',
  'Construction',
  'Food & Beverage',
  'Fashion',
  'Sports',
  'Other',
];

const orgSetupSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric and hyphenated'),
  businessType: z.string().min(1, 'Business type is required'),
  businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
});

type OrgSetupForm = z.infer<typeof orgSetupSchema>;

export function OrgSetupPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const setActiveOrganization = useAuthStore((state) => state.setActiveOrganization);
  const createOrg = useCreateOrganization();
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrgSetupForm>({
    resolver: zodResolver(orgSetupSchema),
    defaultValues: {
      name: '',
      slug: '',
      businessType: '',
      businessDescription: '',
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value, { shouldValidate: true });

    // Generate slug
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setValue('slug', slug, { shouldValidate: true });
    setSlugAvailable(null);
    setSlugError(null);
  };

  // Check slug availability against the real API (200 = taken, 404 = free)
  const handleSlugBlur = async () => {
    const slug = watch('slug');
    if (!slug || slug.length < 2) return;

    setIsCheckingSlug(true);
    setSlugAvailable(null);
    setSlugError(null);

    try {
      await apiClient.organizations.getBySlug(slug);
      setSlugAvailable(false);
      setSlugError('This slug is already taken');
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        setSlugAvailable(true);
      } else {
        // Unknown error: don't block, server validates on submit
        setSlugAvailable(null);
      }
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const onSubmit = async (data: OrgSetupForm) => {
    try {
      const org = await createOrg.mutateAsync(data);
      setActiveOrganization({
        id: org.id,
        slug: org.slug,
        name: org.name,
        currentPlan: org.currentPlan,
      });
      addToast({ message: 'Organization created successfully!', type: 'success' });
      navigate({ to: '/dashboard' });
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Set up your organization</h1>
            <p className="text-slate-400">Tell us about your business so we can customize your feedback experience</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Organization Name
              </label>
              <input
                {...register('name', { onChange: handleNameChange })}
                id="name"
                type="text"
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder="Acme Inc."
                disabled={createOrg.isPending}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-300 mb-2">
                URL Slug <span className="text-slate-500">(feedback.yourapp.com/your-slug)</span>
              </label>
              <div className="relative">
                <input
                  {...register('slug')}
                  id="slug"
                  type="text"
                  onBlur={handleSlugBlur}
                  className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.slug ? 'border-red-500' :
                    isCheckingSlug ? 'border-blue-500' :
                    slugAvailable === true ? 'border-green-500' :
                    slugAvailable === false ? 'border-red-500' :
                    'border-slate-700'
                  }`}
                  placeholder="acme-inc"
                  disabled={createOrg.isPending || isCheckingSlug}
                />
                {isCheckingSlug && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {slugAvailable === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                {slugAvailable === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
              {errors.slug && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.slug.message}
                </p>
              )}
              {slugError && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {slugError}
                </p>
              )}
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-slate-300 mb-2">
                Business Type
              </label>
              <select
                {...register('businessType')}
                id="businessType"
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.businessType ? 'border-red-500' : 'border-slate-700'
                }`}
                disabled={createOrg.isPending}
              >
                <option value="">Select your business type</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.businessType && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.businessType.message}
                </p>
              )}
            </div>

            {/* Business Description */}
            <div>
              <label htmlFor="businessDescription" className="block text-sm font-medium text-slate-300 mb-2">
                Business Description
              </label>
              <textarea
                {...register('businessDescription')}
                id="businessDescription"
                rows={4}
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none ${
                  errors.businessDescription ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder="Describe your business, products, and target audience. This helps our AI generate relevant feedback categories."
                disabled={createOrg.isPending}
              />
              {errors.businessDescription && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.businessDescription.message}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                This helps our AI generate relevant feedback categories for your business.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createOrg.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createOrg.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating organization...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}