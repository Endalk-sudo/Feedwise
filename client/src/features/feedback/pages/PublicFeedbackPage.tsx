import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitFeedbackFormSchema, type SubmitFeedbackForm } from '@aifc/contracts';
import { MessageSquare, Loader2, CheckCircle2, Building2, Shield, Send, AlertCircle } from 'lucide-react';


export function PublicFeedbackPage() {
  const { slug } = useParams({ from: '/feedback/$slug' });
  const [org, setOrg] = useState<{ name: string; logo: string | null; slug: string; categories: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubmitFeedbackForm>({
    resolver: zodResolver(submitFeedbackFormSchema),
    defaultValues: { text: '' },
  });

  // Fetch organization data
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/organization/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setOrg(data.data);
        } else {
          setSubmitError('Organization not found');
        }
      } catch {
        setSubmitError('Failed to load organization');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrg();
  }, [slug]);

  const onSubmit = async (data: SubmitFeedbackForm) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/feedback/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: data.text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Organization not found</h1>
          <p className="text-muted-foreground">The feedback page you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank you for your feedback!</h1>
          <p className="text-muted-foreground mb-8">Your feedback has been submitted and will be analyzed by our AI.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-3 btn-brand hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {org.logo ? (
              <img src={org.logo} alt={org.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              <p className="text-muted-foreground">We value your feedback</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Anonymous
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              AI Analyzed
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-foreground mb-2">
              Your Feedback
            </label>
            <textarea
              {...register('text')}
              id="text"
              rows={6}
              className={`w-full px-4 py-3 bg-secondary border rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all resize-none ${
                errors.text ? 'border-destructive' : 'border-input'
              }`}
              placeholder="Tell us about your experience... (minimum 15 characters)"
              disabled={isSubmitting}
            />
            {errors.text && (
              <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.text.message}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground text-right">
              {errors.text ? '' : 'Minimum 15 characters'}
            </p>
          </div>

          {submitError && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 btn-brand hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Anonymous feedback — no account needed
          </p>
        </form>

        {/* Features */}
        <div className="mt-8 grid gap-4 text-center">
          <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
            <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-medium">AI Analysis</h3>
            <p className="text-sm text-muted-foreground mt-1">Your feedback is instantly analyzed for sentiment, category, and urgency</p>
          </div>
          <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-medium">Anonymous & Secure</h3>
            <p className="text-sm text-muted-foreground mt-1">Your identity is never shared. Feedback is encrypted and securely stored.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
