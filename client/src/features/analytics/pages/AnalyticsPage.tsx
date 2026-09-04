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
  Positive: '#22c55e',
  Negative: '#ef4444',
  Neutral: '#64748b',
  Mixed: '#eab308',
};

const barPalette = ['#38bdf8', '#a855f7', '#f472b6', '#22c55e', '#eab308', '#f97316'];

const sentimentBadge: Record<string, string> = {
  Positive: 'bg-green-500/20 text-green-400 border-green-500/30',
  Negative: 'bg-red-500/20 text-red-400 border-red-500/30',
  Neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Mixed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const urgencyBadge: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  color: '#e2e8f0',
};

function SentimentTrendsChart({ trends }: { trends: SentimentTrend[] | undefined }) {
  const data = (trends ?? []).slice(-30).map((t) => ({
    ...t,
    label: t.date.slice(5),
  }));
  if (data.length === 0) {
    return <p className="text-slate-500 text-center py-8">No trend data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
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
    return <p className="text-slate-500 text-center py-8">No category data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
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
    return <p className="text-slate-500 text-center py-8">No heatmap data yet</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 border-b border-slate-800">
            <th className="text-left p-2">Category</th>
            {SENTIMENTS.map((s) => (
              <th key={s} className="p-2">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cats.map((cat) => (
            <tr key={cat} className="border-b border-slate-800/50">
              <td className="p-2 font-medium text-slate-300">{cat}</td>
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
                      <span className="text-slate-500">—</span>
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
  if (!issues?.length) return <p className="text-slate-500 text-center py-8">No recurring issues found</p>;
  return (
    <div className="space-y-4">
      {issues.slice(0, 5).map((issue, i) => (
        <div key={i} className="p-4 bg-slate-800/50 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-sm line-clamp-2">{issue.text}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">{issue.category}</span>
                <span className={cn('px-2 py-0.5 text-xs rounded', urgencyBadge[issue.urgency] ?? '')}>
                  {issue.urgency}
                </span>
                <span className={cn('px-2 py-0.5 text-xs rounded', sentimentBadge[issue.sentiment] ?? '')}>
                  {issue.sentiment}
                </span>
              </div>
            </div>
            <span className="text-lg font-bold text-slate-500 whitespace-nowrap">{issue.count}x</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsList({ alerts }: { alerts: Alert[] | undefined }) {
  if (!alerts?.length) return <p className="text-slate-500 text-center py-8">No alerts</p>;
  return (
    <div className="space-y-3">
      {alerts.slice(0, 10).map((alert) => (
        <div key={alert.id} className="p-3 bg-slate-800/50 rounded-xl border-l-4 border-red-500">
          <p className="text-slate-300 text-sm line-clamp-1">{alert.text}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">{alert.urgency}</span>
            <span className={cn('px-2 py-0.5 text-xs rounded', sentimentBadge[alert.sentiment ?? ''] ?? '')}>
              {alert.sentiment}
            </span>
            <span className="text-xs text-slate-500 ml-auto">
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
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        AI Growth Recommendations
      </h2>
      <div className="grid gap-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{rec.title}</h3>
                <p className="text-slate-400 mb-3">{rec.reason}</p>
                <p className="text-blue-400 text-sm font-medium">Action: {rec.action}</p>
              </div>
              <div className="text-right">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap', rec.priority >= 7 ? 'bg-red-500/20 text-red-400' : rec.priority >= 4 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400')}>
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
        <p className="text-slate-400">Please select an organization to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-slate-400 mt-1">Deep insights into your customer feedback</p>
      </div>

      {/* Sentiment Trends */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Sentiment Trends (30 days)
        </h2>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
          <SentimentTrendsChart trends={trends} />
        </div>
      </section>

      {/* Category Breakdown & Heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Category Breakdown
          </h2>
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <CategoryBreakdownChart categories={categories} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-400" />
            Sentiment by Category
          </h2>
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <HeatmapTable heatmap={heatmap} />
          </div>
        </section>
      </div>

      {/* Top Issues & Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Top Recurring Issues
          </h2>
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <TopIssuesList issues={issues} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-400" />
            Priority Alerts
          </h2>
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <AlertsList alerts={alerts} />
          </div>
        </section>
      </div>

      <RecommendationsList recommendations={recommendations} />
    </div>
  );
}
