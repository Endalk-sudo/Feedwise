import { useOrgSlug } from '@/lib/stores/auth.store';
import { useSentimentTrends, useCategoryBreakdown, useHeatmap, useTopIssues, useAlerts, useRecommendations } from '@/features/feedback/hooks';
import type { SentimentTrend, CategoryBreakdown, HeatmapData, TopIssue, Alert, Recommendation } from '@/features/feedback/types';
import { TrendingUp, BarChart3, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

const sentimentBadge: Record<string, string> = {
  Positive: 'bg-primary/10 text-primary border-primary/30',
  Negative: 'bg-destructive/10 text-destructive border-destructive/30',
  Neutral: 'bg-muted/10 text-muted-foreground border-muted/30',
  Mixed: 'bg-warning/10 text-warning border-warning/30',
};

const urgencyBadge: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/30',
  Medium: 'bg-warning/10 text-warning border-warning/30',
  Low: 'bg-primary/10 text-primary border-primary/30',
};

const tooltipStyle = {
  backgroundColor: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--foreground)',
};

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
        <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        {SENTIMENTS.map((s) => (
          <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={sentimentFill[s]} fill={sentimentFill[s]} fillOpacity={0.35} />
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
        <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'var(--foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
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
              <th key={s} className="p-2">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cats.map((cat) => (
            <tr key={cat} className="border-b border-border/50">
              <td className="p-2 font-medium text-foreground">{cat}</td>
              {SENTIMENTS.map((sentiment) => {
                const count = heatmap?.find((h) => h.category === cat && h.sentiment === sentiment)?.count ?? 0;
                return (
                  <td key={sentiment} className="p-2 text-center">
                    {count > 0 ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: `${sentimentFill[sentiment]}20`, color: sentimentFill[sentiment] }}
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
  if (!issues?.length) return <p className="text-muted-foreground text-center py-8">No recurring issues found</p>;
  return (
    <div className="space-y-4">
      {issues.slice(0, 5).map((issue, i) => (
        <div key={i} className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm line-clamp-2">{issue.text}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">{issue.category}</span>
                <span className={cn('px-2 py-0.5 text-xs rounded', urgencyBadge[issue.urgency] ?? '')}>
                  {issue.urgency}
                </span>
                <span className={cn('px-2 py-0.5 text-xs rounded', sentimentBadge[issue.sentiment] ?? '')}>
                  {issue.sentiment}
                </span>
              </div>
            </div>
            <span className="text-lg font-bold text-muted-foreground whitespace-nowrap">{issue.count}x</span>
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
        <div key={alert.id} className="p-3 bg-secondary/50 rounded-lg border-l-4 border-destructive">
          <p className="text-foreground text-sm line-clamp-1">{alert.text}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 text-xs rounded bg-destructive/10 text-destructive">{alert.urgency}</span>
            <span className={cn('px-2 py-0.5 text-xs rounded', sentimentBadge[alert.sentiment ?? ''] ?? '')}>
              {alert.sentiment}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(alert.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsList({ recommendations }: { recommendations: Recommendation[] | undefined }) {
  if (!recommendations?.length) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-warning" />
        AI Growth Recommendations
      </h2>
      <div className="grid gap-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{rec.title}</h3>
                <p className="text-muted-foreground mb-3">{rec.reason}</p>
                <p className="text-primary text-sm font-medium">Action: {rec.action}</p>
              </div>
              <div className="text-right">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap', rec.priority >= 7 ? 'bg-destructive/10 text-destructive' : rec.priority >= 4 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                  Priority: {rec.priority}/10
                </span>
              </div>
            </div>
          </div>
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
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
        <p className="text-muted-foreground">Please select an organization to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep insights into your customer feedback</p>
      </div>

      {/* Sentiment Trends */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Sentiment Trends (30 days)
        </h2>
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
          <SentimentTrendsChart trends={trends} />
        </div>
      </section>

      {/* Category Breakdown & Heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Category Breakdown
          </h2>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
            <CategoryBreakdownChart categories={categories} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-500" />
            Sentiment by Category
          </h2>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
            <HeatmapTable heatmap={heatmap} />
          </div>
        </section>
      </div>

      {/* Top Issues & Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Top Recurring Issues
          </h2>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
            <TopIssuesList issues={issues} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-destructive" />
            Priority Alerts
          </h2>
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
            <AlertsList alerts={alerts} />
          </div>
        </section>
      </div>

      <RecommendationsList recommendations={recommendations} />
    </div>
  );
}
