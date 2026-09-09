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
  buttonVariants,
} from '@/components/ui';

export function DashboardHome() {
  const { user, activeOrganization, setActiveOrganization } = useAuthStore();
  const slug = useOrgSlug();
  const { data: myOrgs } = useMyOrganizations();
  const { data: statsData, isLoading } = useFeedbackStats(slug);

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

  const cards = [
    {
      name: 'Total feedback',
      value: statsData?.total ?? '—',
      icon: MessageSquare,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      name: 'This week',
      value: statsData?.recentCount ?? '—',
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      name: 'Acted on',
      value: statsData ? `${actedOnRate}%` : '—',
      icon: CheckCircle2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      name: 'High urgency open',
      value: highOpen,
      icon: AlertTriangle,
      color: highOpen > 0 ? 'text-warning' : 'text-muted-foreground',
      bg: highOpen > 0 ? 'bg-warning/10' : 'bg-secondary/50',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description={
          activeOrganization?.name
            ? `Here’s what needs attention at ${activeOrganization.name}.`
            : 'Your feedback overview.'
        }
        actions={
          statsData && statsData.total === 0 ? (
            <Link
              to="/dashboard/settings"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Share your QR / link <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : undefined
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <Card key={card.name} padding="sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.bg)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums">{isLoading ? '…' : card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.name}</p>
          </Card>
        ))}
      </div>

      {/* Top actions this week — the product heart */}
      <Card padding="none" className="overflow-hidden">
        <CardHeader>
          <CardTitle>
            <Lightbulb className="w-5 h-5 text-primary" />
            Top things to fix this week
          </CardTitle>
          <Link
            to="/dashboard/feedback"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            All feedback <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading insights…</div>
        ) : topActions.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="font-medium text-sm">Nothing urgent right now</p>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
              {statsData?.total
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
                        <Badge variant={item.urgency === 'High' ? 'warning' : 'neutral'}>
                          {item.urgency}
                        </Badge>
                      )}
                      {item.category && <Badge>{item.category}</Badge>}
                      {item.sentiment && <Badge>{item.sentiment}</Badge>}
                    </div>
                    {item.suggestedAction && (
                      <p className="text-xs text-primary/90 flex items-start gap-1.5 mt-1">
                        <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          <span className="font-medium">Suggested: </span>
                          {item.suggestedAction}
                        </span>
                      </p>
                    )}
                  </div>
                  <Link
                    to="/dashboard/feedback"
                    className="text-xs text-muted-foreground hover:text-primary shrink-0"
                  >
                    Review
                  </Link>
                </div>
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

      {/* Positive summary for empty-ish states */}
      {statsData && statsData.total > 0 && positiveCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {positiveCount} positive response{positiveCount === 1 ? '' : 's'} so far — keep the
          momentum going.
        </p>
      )}
    </div>
  );
}
