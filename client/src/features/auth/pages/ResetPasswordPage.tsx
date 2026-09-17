import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useUIStore } from '@/lib/stores/ui.store';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Button, Input, Field } from '@/components/ui';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type ResetForm = z.infer<typeof resetSchema>;

function tokenFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('token');
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [token] = useState(tokenFromUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      setFormError('This reset link is invalid. Request a new one below.');
      return;
    }
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (result.error) {
        setFormError(result.error.message || 'Could not reset your password. Try again.');
      } else {
        addToast({ message: 'Password updated — please sign in.', type: 'success' });
        navigate({ to: '/auth/login' });
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      description="Make it at least 8 characters."
      footer={
        <p>
          <Link
            to="/auth/forgot-password"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Request a new link
          </Link>
        </p>
      }
    >
      {!token && (
        <div
          role="alert"
          className="flex items-start gap-2 text-sm bg-warning/10 border border-warning/30 text-warning rounded-lg px-3 py-2.5 mb-6"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>This page needs a valid reset link — check your email for the full URL.</span>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
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
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </Field>
        <Field
          label="Confirm new password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <Input
            {...register('confirmPassword')}
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={errors.confirmPassword ? 'border-destructive' : undefined}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </Field>
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 text-sm bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-3 py-2.5"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <Button type="submit" size="lg" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating...
            </>
          ) : (
            'Update password'
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
