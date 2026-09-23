import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orgSetupFormSchema, type OrgSetupForm } from '@aifc/contracts';
import { Building2, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useCreateOrganization } from '@/features/organization/hooks';
import { apiClient } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
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

const BUSINESS_TYPE_GROUPS: { label: string; options: string[] }[] = [
  {
    label: 'Food & Hospitality',
    options: ['Restaurant', 'Food & Beverage', 'Travel', 'Entertainment', 'Sports'],
  },
  { label: 'Retail & Commerce', options: ['Retail', 'E-commerce', 'Fashion', 'Automotive'] },
  {
    label: 'Services',
    options: [
      'Healthcare',
      'Education',
      'Finance',
      'Legal',
      'Marketing',
      'Consulting',
      'Real Estate',
      'Logistics',
      'Media',
    ],
  },
  {
    label: 'Industry & Tech',
    options: [
      'SaaS',
      'Manufacturing',
      'Telecommunications',
      'Construction',
      'Energy',
      'Agriculture',
    ],
  },
  { label: 'Other', options: ['Non-profit', 'Government', 'Other'] },
];

const DESCRIPTION_MAX = 500;

export function OrgSetupPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const setActiveOrganization = useAuthStore((state) => state.setActiveOrganization);
  const logout = useAuthStore((state) => state.logout);
  const createOrg = useCreateOrganization();
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  // Once the user edits the slug by hand, stop auto-generating it from the name.
  const slugTouched = useRef(false);
  const checkSeq = useRef(0);

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

  // Auto-generate slug from name — until the user edits the slug manually
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value, { shouldValidate: true });

    if (slugTouched.current) return;
    // Generate slug
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setValue('slug', slug, { shouldValidate: true });
    setSlugAvailable(null);
    setSlugError(null);
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    slugTouched.current = true;
    setValue('slug', e.target.value, { shouldValidate: true });
    // Manual edits invalidate any previous availability verdict
    setSlugAvailable(null);
    setSlugError(null);
  };

  const slugValue = watch('slug');

  // Debounced availability check — races resolved via sequence numbers
  useEffect(() => {
    if (!slugValue || slugValue.length < 2) {
      setSlugAvailable(null);
      setSlugError(null);
      setIsCheckingSlug(false);
      return;
    }
    const seq = ++checkSeq.current;
    setIsCheckingSlug(true);
    const timer = setTimeout(async () => {
      try {
        await apiClient.organizations.getBySlug(slugValue);
        if (checkSeq.current !== seq) return;
        setSlugAvailable(false);
        setSlugError('This slug is already taken');
      } catch (error) {
        if (checkSeq.current !== seq) return;
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status === 404
        ) {
          setSlugAvailable(true);
          setSlugError(null);
        } else {
          // Unknown error: don't block, server validates on submit
          setSlugAvailable(null);
          setSlugError(null);
        }
      } finally {
        if (checkSeq.current === seq) setIsCheckingSlug(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slugValue]);

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

  const handleSignOut = async () => {
    await authClient.signOut();
    logout();
    navigate({ to: '/' });
  };

  const descriptionValue = watch('businessDescription') ?? '';
  const slugBlocked = slugAvailable === false || isCheckingSlug;

  return (
    <CenteredLayout width="md">
      <Card padding="lg" className="rounded-3xl shadow-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo icon={Building2} size="xl" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Step 2 of 2
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance mb-2">
            Set up your organization
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md mx-auto">
            Tell us about your business so feedback categories and insights fit from day one.
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
                onChange={handleSlugChange}
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
              {BUSINESS_TYPE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </optgroup>
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
              maxLength={DESCRIPTION_MAX}
              className={`resize-none ${errors.businessDescription ? 'border-destructive' : ''}`}
              placeholder="Describe your business, products, and target audience. This helps our AI generate relevant feedback categories."
              disabled={createOrg.isPending}
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                This helps our AI generate relevant feedback categories for your business.
              </p>
              <p className="text-xs text-muted-foreground tabular-nums shrink-0" aria-live="polite">
                {descriptionValue.length}/{DESCRIPTION_MAX}
              </p>
            </div>
          </Field>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={createOrg.isPending || slugBlocked}
            className="w-full"
          >
            {createOrg.isPending ? (
              <>
                <Spinner size="md" className="text-primary-foreground" />
                Creating organization...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
          {slugError && (
            <p className="text-xs text-center text-muted-foreground -mt-3">
              Pick a different slug to continue.
            </p>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Joining a team? Ask your workspace owner to invite your account email first — then
            you&apos;ll land in their workspace after sign in.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => navigate({ to: '/dashboard' })}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Skip for now
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </Card>
    </CenteredLayout>
  );
}
