import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterForm } from '@aifc/contracts';
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Button, Input, Field } from '@/components/ui';

export function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        addToast({ message: result.error.message || 'Registration failed', type: 'error' });
      } else {
        const session = await authClient.getSession({ fetchOptions: { credentials: 'include' } });
        setSession(session.data);
        addToast({ message: 'Account created successfully!', type: 'success' });
        navigate({ to: '/org-setup' });
      }
    } catch {
      addToast({ message: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Start your 14-day free trial. No credit card required."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`pl-10 pr-4 ${errors.confirmPassword ? 'border-destructive' : ''}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
        </Field>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-1 w-4 h-4 bg-secondary border-input rounded text-primary focus:ring-2 focus:ring-ring/20"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the <span className="text-foreground">Terms of Service</span> and{' '}
            <span className="text-foreground">Privacy Policy</span>
          </label>
        </div>

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
    </AuthShell>
  );
}
