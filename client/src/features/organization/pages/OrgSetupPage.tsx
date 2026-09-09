import { useState, type ChangeEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orgSetupFormSchema, type OrgSetupForm } from '@aifc/contracts';
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCreateOrganization } from '@/features/organization/hooks';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import {
  CenteredLayout,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Field,
  FieldError,
  Logo,
  Spinner,
} from '@/components/ui';

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
    resolver: zodResolver(orgSetupFormSchema),
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
    <CenteredLayout width="md">
      <Card padding="lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo icon={Building2} size="xl" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Set up your organization</h1>
          <p className="text-muted-foreground">
            Tell us about your business so we can customize your feedback experience
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <Field label="Organization Name" htmlFor="name" error={errors.name?.message}>
            <Input
              {...register('name', { onChange: handleNameChange })}
              id="name"
              type="text"
              className={errors.name ? 'border-destructive' : undefined}
              placeholder="Acme Inc."
              disabled={createOrg.isPending}
            />
          </Field>

          {/* Slug */}
          <Field
            label={
              <>
                URL Slug{' '}
                <span className="text-muted-foreground">(feedback.yourapp.com/your-slug)</span>
              </>
            }
            htmlFor="slug"
            error={errors.slug?.message}
          >
            <div className="relative">
              <Input
                {...register('slug')}
                id="slug"
                type="text"
                onBlur={handleSlugBlur}
                className={`pr-10 ${
                  errors.slug
                    ? 'border-destructive'
                    : isCheckingSlug
                      ? 'border-primary'
                      : slugAvailable === true
                        ? 'border-success'
                        : slugAvailable === false
                          ? 'border-destructive'
                          : ''
                }`}
                placeholder="acme-inc"
                disabled={createOrg.isPending || isCheckingSlug}
              />
              {isCheckingSlug && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner size="sm" />
                </div>
              )}
              {slugAvailable === true && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              {slugAvailable === false && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            {slugError && <FieldError message={slugError} />}
          </Field>

          {/* Business Type */}
          <Field label="Business Type" htmlFor="businessType" error={errors.businessType?.message}>
            <Select
              {...register('businessType')}
              id="businessType"
              className={errors.businessType ? 'border-destructive' : undefined}
              disabled={createOrg.isPending}
            >
              <option value="">Select your business type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          {/* Business Description */}
          <Field
            label="Business Description"
            htmlFor="businessDescription"
            error={errors.businessDescription?.message}
          >
            <Textarea
              {...register('businessDescription')}
              id="businessDescription"
              rows={4}
              className={`resize-none ${errors.businessDescription ? 'border-destructive' : ''}`}
              placeholder="Describe your business, products, and target audience. This helps our AI generate relevant feedback categories."
              disabled={createOrg.isPending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This helps our AI generate relevant feedback categories for your business.
            </p>
          </Field>

          {/* Submit Button */}
          <Button type="submit" size="lg" disabled={createOrg.isPending} className="w-full">
            {createOrg.isPending ? (
              <>
                <Spinner size="md" className="text-primary-foreground" />
                Creating organization...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </form>
      </Card>
    </CenteredLayout>
  );
}
