import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterForm } from '@aifc/contracts';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Button, Input, Field, Dialog } from '@/components/ui';
import { cn } from '@/lib/utils';

function selectedPlan(): 'basic' | 'pro' | null {
  const plan = new URLSearchParams(window.location.search).get('plan');
  return plan === 'pro' || plan === 'basic' ? plan : null;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);
  const [plan] = useState(selectedPlan);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') ?? '';
  const passwordChecks = [
    { label: 'At least 8 characters', ok: passwordValue.length >= 8 },
  ];

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        setFormError(result.error.message || 'Registration failed. Please try again.');
      } else {
        const session = await authClient.getSession({ fetchOptions: { credentials: 'include' } });
        setSession(session.data);
        addToast({ message: 'Account created successfully!', type: 'success' });
        navigate({ to: '/org-setup' });
      }
    } catch {
      setFormError('Something went wrong creating your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description={
        plan === 'pro'
          ? 'You picked Pro — start your 14-day free trial. No credit card required.'
          : 'Start your 14-day free trial. No credit card required.'
      }
      step={{ current: 1, total: 2, label: 'Step 1 of 2' }}
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Name */}
        <Field label="Full Name" htmlFor="name" error={errors.name?.message}>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              {...register('name')}
              id="name"
              type="text"
              autoComplete="name"
              className={`pl-10 pr-4 ${errors.name ? 'border-destructive' : ''}`}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>
        </Field>

        {/* Email */}
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              className={`pl-10 pr-4 ${errors.email ? 'border-destructive' : ''}`}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
        </Field>

        {/* Password */}
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`pl-10 pr-12 ${errors.password ? 'border-destructive' : ''}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {passwordValue.length > 0 && (
            <ul className="mt-2 space-y-1" aria-live="polite">
              {passwordChecks.map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    c.ok ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  <Check className="w-3.5 h-3.5" />
                  {c.label}
                </li>
              ))}
            </ul>
          )}
        </Field>

        {/* Confirm Password */}
        <Field
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`pl-10 pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </Field>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            required
            disabled={isLoading}
            className="mt-1 w-4 h-4 bg-secondary border-input rounded text-primary focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="text-foreground underline hover:text-primary"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="text-foreground underline hover:text-primary"
            >
              Privacy Policy
            </button>
          </label>
        </div>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 text-sm bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-3 py-2.5"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" size="lg" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <Dialog
        open={legalDoc !== null}
        onOpenChange={(open) => {
          if (!open) setLegalDoc(null);
        }}
        title={legalDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
      >
        <div className="text-sm text-muted-foreground space-y-3">
          {legalDoc === 'privacy' ? (
            <>
              <p>
                Feedwise collects your account details (name, email) and the customer
                feedback you gather. Customer feedback is anonymous by default.
              </p>
              <p>
                We never sell personal data. You can request export or deletion via{' '}
                <a
                  href="mailto:hello@feedwise.app"
                  className="text-primary hover:underline"
                >
                  hello@feedwise.app
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <p>
                14-day free trial; paid plans bill monthly and can be cancelled anytime
                from the billing portal.
              </p>
              <p>
                You are responsible for content you collect. Abusive use may lead to
                suspension. AI analysis is advisory — verify urgent matters yourself.
              </p>
            </>
          )}
        </div>
      </Dialog>
    </AuthShell>
  );
}
