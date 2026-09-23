import { useOrgSlug } from '@/lib/stores/auth.store';
import {
  useSentimentTrends,
  useCategoryBreakdown,
  useHeatmap,
  useTopIssues,
  useAlerts,
  useRecommendations,
  useRetentionRisk,
  useStaffPerformance,
} from '@/features/feedback/hooks';
import type {
  SentimentTrend,
  CategoryBreakdown,
  HeatmapData,
  TopIssue,
  Alert,
  Recommendation,
} from '@/features/feedback/types';
import {
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Zap,
  Download,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
  Button,
  SkeletonChart,
  Skeleton,
} from '@/components/ui';
import { sentimentVariant, urgencyVariant } from '@/lib/status-variants';
import { formatRelativeTime, extractApiErrorMessage } from '@/lib/utils';
import { useNlqQuery } from '@/features/feedback/hooks';
import { useState, type FormEvent } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

const SENTIMENTS = ['Positive', 'Negative', 'Neutral', 'Mixed'] as const;

const sentimentFill: Record<(typeof SENTIMENTS)[number], string> = {
  Positive: 'var(--chart-1)',
  Negative: 'var(--chart-2)',
  Neutral: 'var(--chart-3)',
  Mixed: 'var(--chart-4)',
};

const barPalette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-1)',
];

const tooltipStyle = {
  backgroundColor: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--foreground)',
};

function Section({
  icon: Icon,
  iconClassName,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-[17px] font-semibold tracking-tight flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Icon className={`w-4 h-4 ${iconClassName ?? 'text-primary'}`} />
          </span>
          {title}
        </h2>
        {action}
      </div>
      <Card padding="md">{children}</Card>
    </section>
  );
}

function SentimentTrendsChart({
  trends,
  isLoading,
  isError,
  error,
  refetch,
}: {
  trends: SentimentTrend[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => void;
}) {
  if (isLoading) return <SkeletonChart />;
  if (isError) {
    return (
      <Card padding="lg" className="border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">Failed to load sentiment trends</p>
              <p className="text-sm text-muted-foreground">
                {extractApiErrorMessage(error, 'Please try again.')}
              </p>
            </div>
          </div>
          {refetch && (
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }
  const data = (trends ?? []).slice(-30).map((t) => ({
    ...t,
    label: t.date.slice(5), // MM-DD
  }));
  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No trend data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        {SENTIMENTS.map((s) => (
          <Area
            key={s}
            type="monotone"
            dataKey={s}
            stackId="1"
            stroke={sentimentFill[s]}
            fill={sentimentFill[s]}
            fillOpacity={0.35}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryBreakdownChart({
  categories,
  isLoading,
  isError,
  error,
  refetch,
}: {
  categories: CategoryBreakdown[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => void;
}) {
  if (isLoading) return <SkeletonChart />;
  if (isError) {
    return (
      <Card padding="lg" className="border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">Failed to load category breakdown</p>
              <p className="text-sm text-muted-foreground">
                {extractApiErrorMessage(error, 'Please try again.')}
              </p>
            </div>
          </div>
          {refetch && (
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }
  const data = (categories ?? []).slice(0, 10);
  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No category data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fill: 'var(--foreground)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={barPalette[i % barPalette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function HeatmapTable({
  heatmap,
  isLoading,
  isError,
  error,
  refetch,
}: {
  heatmap: HeatmapData[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => void;
}) {
  if (isLoading)
    return (
      <div className="overflow-x-auto">
        <Skeleton />
      </div>
    );
  if (isError) {
    return (
      <Card padding="lg" className="border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">Failed to load heatmap</p>
              <p className="text-sm text-muted-foreground">
                {extractApiErrorMessage(error, 'Please try again.')}
              </p>
            </div>
          </div>
          {refetch && (
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }
  const cats = Array.from(new Set((heatmap ?? []).map((h) => h.category)));
  if (cats.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No heatmap data yet</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left p-2">Category</th>
            {SENTIMENTS.map((s) => (
              <th key={s} className="p-2">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cats.map((cat) => (
            <tr key={cat} className="border-b border-border/50">
              <td className="p-2 font-medium text-foreground">{cat}</td>
              {SENTIMENTS.map((sentiment) => {
                const count =
                  heatmap?.find((h) => h.category === cat && h.sentiment === sentiment)?.count ?? 0;
                return (
                  <td key={sentiment} className="p-2 text-center">
                    {count > 0 ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${sentimentFill[sentiment]}20`,
                          color: sentimentFill[sentiment],
                        }}
                      >
                        {count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopIssuesList({
  issues,
  isLoading,
  isError,
  error,
  refetch,
}: {
  issues: TopIssue[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => void;
}) {
  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  if (isError) {
    return (
      <Card padding="lg" className="border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">Failed to load top issues</p>
              <p className="text-sm text-muted-foreground">
                {extractApiErrorMessage(error, 'Please try again.')}
              </p>
            </div>
          </div>
          {refetch && (
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }
  if (!issues?.length)
    return <p className="text-muted-foreground text-center py-8">No recurring issues found</p>;
  return (
    <div className="space-y-4">
      {issues.slice(0, 5).map((issue, i) => (
        <div key={i} className="p-4 bg-muted/60 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm line-clamp-2">{issue.text}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge size="sm" variant="neutral">
                  {issue.category}
                </Badge>
                <Badge size="sm" variant={urgencyVariant[issue.urgency] ?? 'neutral'}>
                  {issue.urgency}
                </Badge>
                <Badge size="sm" variant={sentimentVariant[issue.sentiment] ?? 'neutral'}>
                  {issue.sentiment}
                </Badge>
              </div>
            </div>
            <span className="text-lg font-bold text-muted-foreground whitespace-nowrap">
              {issue.count}x
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsList({
  alerts,
  isLoading,
  isError,
  error,
  refetch,
}: {
  alerts: Alert[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => void;
}) {
  if (isLoading)
    return (
      <div className="space-y-3">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  if (isError) {
    return (
      <Card padding="lg" className="border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">Failed to load alerts</p>
              <p className="text-sm text-muted-foreground">
                {extractApiErrorMessage(error, 'Please try again.')}
              </p>
            </div>
          </div>
          {refetch && (
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }
  if (!alerts?.length) return <p className="text-muted-foreground text-center py-8">No alerts</p>;
  return (
    <div className="space-y-3">
      {alerts.slice(0, 10).map((alert) => {
        const urgencyBadge = alert.urgency
          ? (urgencyVariant[alert.urgency as string] ?? 'neutral')
          : 'neutral';
        const sentimentBadge = alert.sentiment
          ? (sentimentVariant[alert.sentiment as string] ?? 'neutral')
          : 'neutral';
        return (
          <div
            key={alert.id}
            className="p-3 bg-muted/60 rounded-lg border-l-4"
            style={{
              borderLeftColor:
                urgencyBadge === 'destructive'
                  ? 'var(--destructive)'
                  : urgencyBadge === 'warning'
                    ? 'var(--warning)'
                    : 'var(--primary)',
            }}
          >
            <p className="text-foreground text-sm line-clamp-1">{alert.text}</p>
            <div className="flex gap-2 mt-2">
              <Badge size="sm" variant={urgencyBadge}>
                {alert.urgency}
              </Badge>
              <Badge size="sm" variant={sentimentBadge}>
                {alert.sentiment}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatRelativeTime(alert.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecommendationsList({
  recommendations,
  isLoading,
  isError,
  error,
  refetch,
}: {
  recommendations: Recommendation[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => void;
}) {
  if (isLoading)
    return (
      <div className="grid gap-4">
        <SkeletonChart />
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  if (isError) {
    return (
      <Card padding="lg" className="border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium">Failed to load recommendations</p>
              <p className="text-sm text-muted-foreground">
                {extractApiErrorMessage(error, 'Please try again.')}
              </p>
            </div>
          </div>
          {refetch && (
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }
  if (!recommendations?.length) {
    return (
      <Card className="bg-muted/50">
        <p className="text-muted-foreground text-center py-8">
          No AI recommendations yet — check back after more feedback comes in.
        </p>
      </Card>
    );
  }
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          AI Growth Recommendations
        </h2>
      </div>
      <div className="grid gap-4">
        {recommendations.map((rec, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{rec.title}</h3>
                <p className="text-muted-foreground mb-3">{rec.reason}</p>
                <p className="text-primary text-sm font-medium">Action: {rec.action}</p>
                {(rec.feedbackIds?.length ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Linked feedback: {rec.feedbackIds!.length} open row
                    {rec.feedbackIds!.length === 1 ? '' : 's'} —{' '}
                    <a className="text-primary underline" href="/dashboard/feedback">
                      open the queue →
                    </a>
                  </p>
                )}
                {rec.draftReply && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    <span className="font-medium text-foreground">Draft reply: </span>
                    {rec.draftReply}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge
                  size="md"
                  variant={
                    rec.priority >= 7 ? 'destructive' : rec.priority >= 4 ? 'warning' : 'info'
                  }
                >
                  Priority: {rec.priority}/10
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function RetentionRiskCard({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useRetentionRisk(slug);
  if (isLoading) return <SkeletonChart />;
  if (isError || !data) return null;
  return (
    <Section icon={AlertTriangle} iconClassName="text-destructive" title="Retention risk (30 days)">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="destructive">High: {data.counts.High}</Badge>
        <Badge variant="warning">Medium: {data.counts.Medium}</Badge>
        <Badge variant="neutral">Low: {data.counts.Low}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          avg satisfaction {data.avgSatisfaction != null ? data.avgSatisfaction.toFixed(1) : 'n/a'}
          /5 · {data.fixableCount} fixable
        </span>
      </div>
      {data.highRiskOpen.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm">
          No high-risk open feedback — nice.
        </p>
      ) : (
        <div className="space-y-2">
          {data.highRiskOpen.slice(0, 5).map((f) => (
            <div key={f.id} className="p-3 bg-muted/60 rounded-lg">
              <p className="text-sm line-clamp-1">{f.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {f.category} · satisfaction {f.satisfactionEstimate ?? 'n/a'}/5 · {f.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function StaffPerformanceCard({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useStaffPerformance(slug);
  if (isLoading) return <SkeletonChart />;
  if (isError || !data) return null;
  return (
    <Section icon={BarChart3} title="Team performance">
      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <Badge variant="success">Resolved: {data.orgTotals.resolved}</Badge>
        <Badge variant="warning">Open: {data.orgTotals.open}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          avg resolution{' '}
          {data.orgTotals.avgResolutionHours != null
            ? `${data.orgTotals.avgResolutionHours.toFixed(1)}h`
            : 'n/a'}
        </span>
      </div>
      <div className="space-y-2">
        {data.members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 text-sm">
            <span className="font-medium truncate">{m.name || m.email}</span>
            <Badge size="sm" variant="neutral">
              {m.role}
            </Badge>
          </div>
        ))}
      </div>
    </Section>
  );
}

/**
 * Phase 7 (E1): natural-language analytics bar — "Show negative staff feedback
 * this week". Server keyword-router returns structured cards + a Gemini
 * summary; the summary renders inline with the cards beneath it.
 */
function NlqAskBar({ slug }: { slug: string }) {
  const nlq = useNlqQuery(slug);
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const message = query.trim();
    if (!message || nlq.isPending) return;
    setAsked(message);
    nlq.mutate(message);
  };

  return (
    <section aria-label="Ask your data">
      <h2 className="text-[17px] font-semibold tracking-tight flex items-center gap-2.5 mb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
        </span>
        Ask your data
      </h2>
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "What are customers most frustrated about this week?"'
            aria-label="Ask a question about your feedback"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 min-h-11 text-[15px] shadow-xs outline-none hover:border-ring/40 focus:ring-4 focus:ring-ring/15 focus:border-ring transition-all"
            disabled={nlq.isPending}
          />
          <Button
            type="submit"
            size="md"
            disabled={!query.trim() || nlq.isPending}
            className="sm:w-auto w-full"
          >
            {nlq.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Ask
          </Button>
        </form>

        {nlq.isError && (
          <p className="text-sm text-destructive mt-3">
            Couldn&apos;t answer that.{' '}
            {nlq.error instanceof Error ? nlq.error.message : 'Try again.'}
          </p>
        )}

        {nlq.data && (
          <div className="mt-4 space-y-3">
            <div className="bg-muted/60 rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Question: {asked}</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{nlq.data.summary}</p>
            </div>
            {nlq.data.cards.map((card, i) => (
              <div key={i} className="border border-border rounded-lg px-4 py-3">
                <p className="text-sm font-medium mb-2">{card.title}</p>
                {card.rows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No rows matched.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <tbody>
                        {card.rows.slice(0, 6).map((row, j) => (
                          <tr key={j} className="border-b border-border/50 last:border-0">
                            {Object.entries(row)
                              .slice(0, 5)
                              .map(([k, v]) => (
                                <td key={k} className="py-1.5 pr-4 whitespace-nowrap">
                                  <span className="text-muted-foreground">{k}: </span>
                                  <span className="font-medium">
                                    {String(v ?? '—').slice(0, 60)}
                                  </span>
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

export function AnalyticsPage() {
  const slug = useOrgSlug();

  const {
    data: trends,
    isLoading: trendsLoading,
    isError: trendsError,
    error: trendsErr,
    refetch: refetchTrends,
  } = useSentimentTrends(slug);
  const {
    data: categories,
    isLoading: catLoading,
    isError: catError,
    error: catErr,
    refetch: refetchCategories,
  } = useCategoryBreakdown(slug);
  const {
    data: heatmap,
    isLoading: heatmapLoading,
    isError: heatmapError,
    error: heatmapErr,
    refetch: refetchHeatmap,
  } = useHeatmap(slug);
  const {
    data: issues,
    isLoading: issuesLoading,
    isError: issuesError,
    error: issuesErr,
    refetch: refetchIssues,
  } = useTopIssues(slug);
  const {
    data: alerts,
    isLoading: alertsLoading,
    isError: alertsError,
    error: alertsErr,
    refetch: refetchAlerts,
  } = useAlerts(slug);
  const {
    data: recommendations,
    isLoading: recLoading,
    isError: recError,
    error: recErr,
    refetch: refetchRecs,
  } = useRecommendations(slug);

  if (!slug) {
    return (
      <EmptyState
        title="No organization selected"
        description="Please select an organization to view analytics"
      />
    );
  }

  const anyLoading =
    trendsLoading || catLoading || heatmapLoading || issuesLoading || alertsLoading || recLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep insights into your customer feedback"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={anyLoading}
            onClick={() => window.open(`/api/analytics/${slug}/export?format=csv`, '_blank')}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      <NlqAskBar slug={slug} />

      <Section
        icon={TrendingUp}
        title="Sentiment Trends (30 days)"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchTrends()}
            disabled={trendsLoading}
          >
            Refresh
          </Button>
        }
      >
        <SentimentTrendsChart
          trends={trends}
          isLoading={trendsLoading}
          isError={trendsError}
          error={trendsErr}
          refetch={refetchTrends}
        />
      </Section>

      {/* Category Breakdown & Heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section
          icon={BarChart3}
          title="Category Breakdown"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchCategories()}
              disabled={catLoading}
            >
              Refresh
            </Button>
          }
        >
          <CategoryBreakdownChart
            categories={categories}
            isLoading={catLoading}
            isError={catError}
            error={catErr}
            refetch={refetchCategories}
          />
        </Section>

        <Section
          icon={Zap}
          iconClassName="text-warning"
          title="Sentiment by Category"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchHeatmap()}
              disabled={heatmapLoading}
            >
              Refresh
            </Button>
          }
        >
          <HeatmapTable
            heatmap={heatmap}
            isLoading={heatmapLoading}
            isError={heatmapError}
            error={heatmapErr}
            refetch={refetchHeatmap}
          />
        </Section>
      </div>

      {/* Top Issues & Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section
          icon={AlertTriangle}
          iconClassName="text-warning"
          title="Top Recurring Issues"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchIssues()}
              disabled={issuesLoading}
            >
              Refresh
            </Button>
          }
        >
          <TopIssuesList
            issues={issues}
            isLoading={issuesLoading}
            isError={issuesError}
            error={issuesErr}
            refetch={refetchIssues}
          />
        </Section>

        <Section
          icon={Zap}
          iconClassName="text-destructive"
          title="Priority Alerts"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchAlerts()}
              disabled={alertsLoading}
            >
              Refresh
            </Button>
          }
        >
          <AlertsList
            alerts={alerts}
            isLoading={alertsLoading}
            isError={alertsError}
            error={alertsErr}
            refetch={refetchAlerts}
          />
        </Section>
      </div>

      <RecommendationsList
        recommendations={recommendations}
        isLoading={recLoading}
        isError={recError}
        error={recErr}
        refetch={refetchRecs}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <RetentionRiskCard slug={slug} />
        <StaffPerformanceCard slug={slug} />
      </div>
    </div>
  );
}
