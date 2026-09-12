import { useAuthStore, useOrgSlug } from '@/lib/stores/auth.store';
import { useFeedbackStats } from '@/features/feedback/hooks';
import { useMyOrganizations } from '@/features/organization/hooks';
import {
  MessageSquare,
  TrendingUp,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Lightbulb,
  ArrowRight,
  Target,
  QrCode,
  Share2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  EmptyState,
  Button,
  SkeletonStatCard,
  Skeleton,
  buttonVariants,
} from '@/components/ui';

export function DashboardHome() {
  const { user, activeOrganization, setActiveOrganization } = useAuthStore();
  const slug = useOrgSlug();
  const { data: myOrgs } = useMyOrganizations();
  const { data: statsData, isLoading, isError, refetch } = useFeedbackStats(slug);

  useEffect(() => {
    if (!activeOrganization && myOrgs && myOrgs.length > 0) {
      const first = myOrgs[0];
      if (first) {
        setActiveOrganization({
          id: first.organization.id,
          slug: first.organization.slug,
          name: first.organization.name,
          currentPlan: first.organization.currentPlan,
        });
      }
    }
  }, [activeOrganization, myOrgs, setActiveOrganization]);

  if (!slug) {
    return (
      <EmptyState
        icon={Target}
        title="Set up your organization"
        description="Create an org, get a QR code, and start turning customer feedback into actions."
        action={
          <Link to="/org-setup" className={cn(buttonVariants({ size: 'lg' }), 'text-sm')}>
            Get started
          </Link>
        }
      />
    );
  }

  const positiveCount =
    statsData?.bySentiment?.find((s: { sentiment: string }) => s.sentiment === 'Positive')?.count ||
    0;
  const highOpen = statsData?.highUrgencyOpen ?? 0;
  const actedOnRate = statsData?.actedOnRate ?? 0;
  const topActions = (statsData?.topActions ?? []) as Array<{
    id: string;
    text: string;
    category: string;
    sentiment: string | null;
    urgency: string | null;
    suggestedAction: string | null;
    rootCause: string | null;
    status: string;
    confidence: number | null;
  }>;

  const buildFeedbackUrl = (filters: Record<string, string>) => {
    const params = new URLSearchParams(filters).toString();
    return `/dashboard/feedback?${params}`;
  };

  const cards = [
    {
      name: 'Total feedback',
      value: statsData?.total ?? '—',
      icon: MessageSquare,
      color: 'text-primary',
      bg: 'bg-primary/10',
      filterUrl: buildFeedbackUrl({}),
      isClickable: true,
    },
    {
      name: 'This week',
      value: statsData?.recentCount ?? '—',
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
      filterUrl: buildFeedbackUrl({}),
      isClickable: true,
    },
    {
      name: 'Acted on',
      value: statsData ? `${actedOnRate}%` : '—',
      icon: CheckCircle2,
      color: 'text-primary',
      bg: 'bg-primary/10',
      filterUrl: buildFeedbackUrl({ status: 'resolved' }),
      isClickable: Boolean(statsData && (statsData.resolvedCount ?? 0) > 0),
    },
    {
      name: 'High urgency open',
      value: highOpen,
      icon: AlertTriangle,
      color: highOpen > 0 ? 'text-warning' : 'text-muted-foreground',
      bg: highOpen > 0 ? 'bg-warning/10' : 'bg-secondary/50',
      filterUrl: buildFeedbackUrl({ urgency: 'High', status: 'open' }),
      isClickable: highOpen > 0,
    },
  ];

  const totalFeedbacks = statsData?.total ?? 0;
  const hasAny = totalFeedbacks > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description={
          activeOrganization?.name
            ? `Here's what needs attention at ${activeOrganization.name}.`
            : 'Your feedback overview.'
        }
        actions={
          <>
            {/* Always-visible QR/share panel */}
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/settings"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 px-3 py-1.5 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                QR & link
              </Link>
              <Link
                to="/dashboard/feedback"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                All feedback
              </Link>
            </div>
          </>
        }
      />

      {/* Error state with retry */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/5" padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium">Failed to load dashboard data</p>
                <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </Card>
      )}

      {!isError && (
        <>
          {/* Metric cards — clickable with filters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => (
              <Link
                key={card.name}
                to={card.filterUrl}
                className={cn(
                  'relative',
                  card.isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                )}
              >
                <Card padding="sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.bg)}>
                      <card.icon className={cn('w-5 h-5', card.color)} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">
                    {isLoading ? <Skeleton className="h-8 w-20" /> : card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.name}</p>
                  {card.isClickable && (
                    <ExternalLink className="absolute top-2 right-2 w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Card>
              </Link>
            ))}
          </div>

          {/* Top actions this week — the product heart */}
          <Card padding="none" className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Top things to fix this week
                </div>
                <Link
                  to="/dashboard/feedback"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  All feedback <ArrowRight className="w-3 h-3" />
                </Link>
              </CardTitle>
            </CardHeader>

            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <SkeletonStatCard key={i} />
                ))}
              </div>
            ) : topActions.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                <p className="font-medium text-sm">Nothing urgent right now</p>
                <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
                  {hasAny
                    ? 'No high-urgency or negative open items this week. Keep collecting feedback.'
                    : 'Share your public feedback link or QR code. After a few responses, AI suggestions will appear here.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {topActions.map((item, idx) => (
                  <li key={item.id} className="px-5 py-4 hover:bg-muted transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-muted-foreground tabular-nums mt-0.5 w-4">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm text-foreground line-clamp-2">{item.text}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.urgency && (
                            <Badge
                              variant={
                                item.urgency === 'High'
                                  ? 'destructive'
                                  : item.urgency === 'Medium'
                                    ? 'warning'
                                    : 'success'
                              }
                            >
                              {item.urgency}
                            </Badge>
                          )}
                          {item.category && <Badge variant="neutral">{item.category}</Badge>}
                          {item.sentiment && (
                            <Badge
                              variant={
                                item.sentiment === 'Positive'
                                  ? 'success'
                                  : item.sentiment === 'Negative'
                                    ? 'destructive'
                                    : item.sentiment === 'Mixed'
                                      ? 'warning'
                                      : 'neutral'
                              }
                            >
                              {item.sentiment}
                            </Badge>
                          )}
</div>
                      </div>
                    </div>
                    <Link
                      to="/dashboard/feedback"
                      search={{ id: item.id }}
                      className="text-xs text-muted-foreground hover:text-primary shrink-0"
                    >
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                to: '/dashboard/feedback',
                icon: MessageSquare,
                title: 'Feedback',
                desc: 'Resolve & reply',
              },
              {
                to: '/dashboard/analytics',
                icon: TrendingUp,
                title: 'Analytics',
                desc: 'Trends & themes',
              },
              {
                to: '/dashboard/ai',
                icon: Bot,
                title: 'AI assistant',
                desc: 'Ask your data',
              },
              {
                to: '/dashboard/settings',
                icon: Settings,
                title: 'Settings',
                desc: 'QR, branding, plan',
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="p-4 bg-card border border-border rounded-xl hover:border-primary/40 transition-all group"
              >
                <item.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-105 transition-transform" />
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>

          {/* Positive summary */}
          {hasAny && positiveCount > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {positiveCount} positive response{positiveCount === 1 ? '' : 's'} so far — keep the
              momentum going.
            </p>
          )}
        </>
      )}
    </div>
  );
}