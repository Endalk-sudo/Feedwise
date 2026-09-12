import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Button, Input, Field } from '@/components/ui';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: '/auth/reset-password',
      });
      if (result.error) {
        setFormError(result.error.message || 'Could not send the reset email. Try again.');
      } else {
        setSent(true);
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your account email and we'll send you a reset link."
      footer={
        <p>
          Remembered it?{' '}
          <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div
          role="status"
          className="flex items-start gap-2 text-sm bg-success/10 border border-success/30 text-success rounded-lg px-3 py-2.5"
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            If an account exists for that email, a reset link is on its way. Check your
            inbox (and spam folder).
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
                Sending link...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
