import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginForm } from '@aifc/contracts';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Button, Input, Field } from '@/components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        addToast({ message: result.error.message || 'Invalid credentials', type: 'error' });
      } else {
        const session = await authClient.getSession({ fetchOptions: { credentials: 'include' } });
        setSession(session.data);
        addToast({ message: 'Welcome back!', type: 'success' });
        navigate({ to: '/dashboard' });
      }
    } catch {
      addToast({ message: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your account to continue"
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link to="/auth/register" className="text-primary hover:text-primary/80 font-medium">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              autoComplete="current-password"
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

        {/* Submit Button */}
        <Button type="submit" size="lg" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
