import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitFeedbackFormSchema, type SubmitFeedbackForm } from '@aifc/contracts';
import {
  MessageSquare,
  Loader2,
  CheckCircle2,
  Building2,
  Shield,
  Send,
  AlertCircle,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CenteredLayout, Button, Logo, EmptyState, LoadingState } from '@/components/ui';

const CONTEXT_OPTIONS = [
  'First visit',
  'Returning',
  'Dine-in',
  'Takeaway',
  'Delivery',
  'Online',
  'In-person',
];

export function PublicFeedbackPage() {
  const { slug } = useParams({ from: '/feedback/$slug' });
  const [org, setOrg] = useState<{
    name: string;
    logo: string | null;
    slug: string;
    categories: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SubmitFeedbackForm>({
    resolver: zodResolver(submitFeedbackFormSchema),
    defaultValues: { text: '' },
  });

  const textValue = watch('text') || '';

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || ''}/api/organization/${slug}`,
        );
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 4 ? [...prev, tag] : prev,
    );
  };

  const onSubmit = async (data: SubmitFeedbackForm) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/feedback/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text: data.text,
          rating,
          contextTags: selectedTags.length ? selectedTags : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
      reset();
      setRating(undefined);
      setSelectedTags([]);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <CenteredLayout width="sm">
        <LoadingState message="Loading…" />
      </CenteredLayout>
    );
  }

  if (!org) {
    return (
      <CenteredLayout width="sm">
        <EmptyState
          icon={MessageSquare}
          title="Page not found"
          description="This feedback link is invalid or the organization no longer exists."
        />
      </CenteredLayout>
    );
  }

  if (submitted) {
    return (
      <CenteredLayout width="sm">
        <div className="text-center animate-slide-in">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank you!</h1>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Your feedback helps {org.name} improve. It will be reviewed shortly.
          </p>
          <Button onClick={() => setSubmitted(false)}>Submit another</Button>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout width="sm">
      {/* Brand header */}
      <div className="text-center mb-7">
        {org.logo ? (
          <img
            src={org.logo}
            alt={org.name}
            className="w-14 h-14 rounded-xl object-cover mx-auto mb-3 border border-border"
          />
        ) : (
          <div className="flex justify-center mb-3">
            <Logo icon={Building2} size="lg" />
          </div>
        )}
        <h1 className="text-xl font-bold tracking-tight">{org.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">How was your experience?</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
      >
        {/* Star rating — optional but prominent */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Overall rating <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="flex gap-1.5" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(rating === value ? undefined : value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
              >
                <Star
                  className={cn(
                    'w-8 h-8 transition-colors',
                    (hoverRating || rating || 0) >= value
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/40',
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Context tags */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Context <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_OPTIONS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    active
                      ? 'bg-primary/15 border-primary/40 text-foreground'
                        : 'bg-muted/60 border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback text — only required field */}
        <div>
          <label htmlFor="feedback-text" className="text-sm font-medium text-foreground mb-2 block">
            Your feedback
          </label>
          <textarea
            id="feedback-text"
            {...register('text')}
            rows={4}
            className={cn(
              'w-full px-3.5 py-3 bg-background border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all resize-none',
              errors.text ? 'border-destructive' : 'border-input',
            )}
            placeholder="What went well? What could be better?"
            disabled={isSubmitting}
            autoFocus
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            {errors.text ? (
              <p className="text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.text.message}
              </p>
            ) : (
              <span className="text-muted-foreground">Be specific — it helps us improve</span>
            )}
            <span className="text-muted-foreground tabular-nums">{textValue.length}/5000</span>
          </div>
        </div>

        {submitError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {submitError}
          </div>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send feedback
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Anonymous · No account needed
        </p>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">Powered by FeedWise</p>
    </CenteredLayout>
  );
}
