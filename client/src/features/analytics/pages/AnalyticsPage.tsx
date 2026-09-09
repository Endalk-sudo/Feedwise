import { useOrgSlug } from '@/lib/stores/auth.store';
import {
  useSentimentTrends,
  useCategoryBreakdown,
  useHeatmap,
  useTopIssues,
  useAlerts,
  useRecommendations,
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
import { PageHeader, Card, Badge, EmptyState, type BadgeProps } from '@/components/ui';

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

const sentimentVariant: Record<string, BadgeProps['variant']> = {
  Positive: 'info',
  Negative: 'destructive',
  Neutral: 'muted',
  Mixed: 'warning',
};

const urgencyVariant: Record<string, BadgeProps['variant']> = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'info',
};

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
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconClassName ?? 'text-primary'}`} />
        {title}
      </h2>
      <Card>{children}</Card>
    </section>
  );
}

function SentimentTrendsChart({ trends }: { trends: SentimentTrend[] | undefined }) {
  const data = (trends ?? []).slice(-30).map((t) => ({
    ...t,
    label: t.date.slice(5),
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

function CategoryBreakdownChart({ categories }: { categories: CategoryBreakdown[] | undefined }) {
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

function HeatmapTable({ heatmap }: { heatmap: HeatmapData[] | undefined }) {
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

function TopIssuesList({ issues }: { issues: TopIssue[] | undefined }) {
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
                <Badge size="sm" variant="muted">
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

function AlertsList({ alerts }: { alerts: Alert[] | undefined }) {
  if (!alerts?.length) return <p className="text-muted-foreground text-center py-8">No alerts</p>;
  return (
    <div className="space-y-3">
      {alerts.slice(0, 10).map((alert) => (
        <div
          key={alert.id}
          className="p-3 bg-muted/60 rounded-lg border-l-4 border-destructive"
        >
          <p className="text-foreground text-sm line-clamp-1">{alert.text}</p>
          <div className="flex gap-2 mt-2">
            <Badge size="sm" variant="destructive">
              {alert.urgency}
            </Badge>
            <Badge size="sm" variant={sentimentVariant[alert.sentiment ?? ''] ?? 'neutral'}>
              {alert.sentiment}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(alert.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsList({
  recommendations,
}: {
  recommendations: Recommendation[] | undefined;
}) {
  if (!recommendations?.length) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-warning" />
        AI Growth Recommendations
      </h2>
      <div className="grid gap-4">
        {recommendations.map((rec, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{rec.title}</h3>
                <p className="text-muted-foreground mb-3">{rec.reason}</p>
                <p className="text-primary text-sm font-medium">Action: {rec.action}</p>
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

export function AnalyticsPage() {
  const slug = useOrgSlug();

  const { data: trends } = useSentimentTrends(slug);
  const { data: categories } = useCategoryBreakdown(slug);
  const { data: heatmap } = useHeatmap(slug);
  const { data: issues } = useTopIssues(slug);
  const { data: alerts } = useAlerts(slug);
  const { data: recommendations } = useRecommendations(slug);

  if (!slug) {
    return (
      <EmptyState
        title="No organization selected"
        description="Please select an organization to view analytics"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Deep insights into your customer feedback" />

      <Section icon={TrendingUp} title="Sentiment Trends (30 days)">
        <SentimentTrendsChart trends={trends} />
      </Section>

      {/* Category Breakdown & Heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section icon={BarChart3} title="Category Breakdown">
          <CategoryBreakdownChart categories={categories} />
        </Section>

        <Section icon={Zap} iconClassName="text-warning" title="Sentiment by Category">
          <HeatmapTable heatmap={heatmap} />
        </Section>
      </div>

      {/* Top Issues & Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section icon={AlertTriangle} iconClassName="text-warning" title="Top Recurring Issues">
          <TopIssuesList issues={issues} />
        </Section>

        <Section icon={Zap} iconClassName="text-destructive" title="Priority Alerts">
          <AlertsList alerts={alerts} />
        </Section>
      </div>

      <RecommendationsList recommendations={recommendations} />
    </div>
  );
}
