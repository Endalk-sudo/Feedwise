import { useAuthStore } from '@/lib/stores/auth.store';
import { useSentimentTrends, useCategoryBreakdown, useHeatmap, useTopIssues, useAlerts, useRecommendations } from '@/features/feedback/hooks';
import { TrendingUp, BarChart3, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const chartColors = [
  'hsl(199, 89%, 48%)',
  'hsl(0, 84%, 60%)',
  'hsl(217, 91%, 60%)',
  'hsl(45, 93%, 47%)',
];

const sentimentColors = {
  Positive: 'bg-green-500/20 text-green-400 border-green-500/30',
  Negative: 'bg-red-500/20 text-red-400 border-red-500/30',
  Neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Mixed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const urgencyColors = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function SentimentTrendsChart({ trends }: { trends: any[] | undefined }) {
  return (
    <div className="h-full flex items-end justify-around gap-2">
      {trends?.slice(-14).map((trend) => (
        <div key={trend.date} className="flex-1 flex flex-col items-center justify-end gap-1">
          <div className="w-full flex flex-col gap-1">
            {['Positive', 'Negative', 'Neutral', 'Mixed'].map((sentiment) => {
              const value = trend[sentiment as keyof typeof trend] || 0;
              const total = (trend.Positive || 0) + (trend.Negative || 0) + (trend.Neutral || 0) + (trend.Mixed || 0);
              const height = total > 0 ? (value / total) * 100 : 0;
              const colorIndex = ['Positive', 'Negative', 'Neutral', 'Mixed'].indexOf(sentiment);
              return (
                <div
                  key={sentiment}
                  className="rounded-t"
                  style={{
                    height: `${height}%`,
                    backgroundColor: chartColors[colorIndex],
                    minHeight: height > 0 ? '2px' : '0',
                  }}
                />
              );
            })}
          </div>
          <span className="text-xs text-slate-500">{trend.date.split('-').slice(1).join('-')}</span>
        </div>
      ))}
    </div>
  );
}

function SentimentLegend() {
  return (
    <div className="flex gap-4 mt-4 text-sm text-slate-400">
      {['Positive', 'Negative', 'Neutral', 'Mixed'].map((sentiment, i) => (
        <span key={sentiment} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: chartColors[i] }} />
          {sentiment}
        </span>
      ),)}
    </div>
  );
}

function CategoryBreakdownChart({ categories }: { categories: any[] | undefined }) {
  const maxCount = categories?.[0]?.count || 1;
  return (
    <div className="space-y-3">
      {categories?.slice(0, 10).map((cat, i) => {
        const width = (cat.count / maxCount) * 100;
        return (
          <div key={cat.name} className="group">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300 truncate pr-2">{cat.name}</span>
              <span className="text-slate-500 whitespace-nowrap">{cat.count}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${width}%`,
                  backgroundColor: chartColors[i % chartColors.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeatmapTable({ heatmap }: { heatmap: any[] | undefined }) {
  const cats = Array.from(new Set(heatmap?.map((h) => h.category) || []));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 border-b border-slate-800">
            <th className="text-left p-2">Category</th>
            <th className="p-2">Positive</th>
            <th className="p-2">Negative</th>
            <th className="p-2">Neutral</th>
            <th className="p-2">Mixed</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((cat) => {
            const catData = heatmap?.filter((h) => h.category === cat) || [];
            return (
              <tr key={cat} className="border-b border-slate-800/50">
                <td className="p-2 font-medium text-slate-300">{cat}</td>
                {['Positive', 'Negative', 'Neutral', 'Mixed'].map((sentiment) => {
                  const item = catData.find((h) => h.sentiment === sentiment);
                  const count = item?.count || 0;
                  const sentimentIndex = ['Positive', 'Negative', 'Neutral', 'Mixed'].indexOf(sentiment);
                  const cellContent = count > 0 ? (
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${chartColors[sentimentIndex]}20`,
                        color: chartColors[sentimentIndex],
                      }}
                    >
                      {count}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  );
                  return (
                    <td key={sentiment} className="p-2 text-center">
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopIssuesList({ issues }: { issues: any[] | undefined }) {
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
                <span className={cn('px-2 py-0.5 text-xs rounded', urgencyColors[issue.urgency as keyof typeof urgencyColors])}>
                  {issue.urgency}
                </span>
                <span className={cn('px-2 py-0.5 text-xs rounded', sentimentColors[issue.sentiment as keyof typeof sentimentColors])}>
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

function AlertsList({ alerts }: { alerts: any[] | undefined }) {
  if (!alerts?.length) return <p className="text-slate-500 text-center py-8">No alerts</p>;
  return (
    <div className="space-y-3">
      {alerts.slice(0, 10).map((alert, i) => (
        <div key={i} className="p-3 bg-slate-800/50 rounded-xl border-l-4 border-red-500">
          <p className="text-slate-300 text-sm line-clamp-1">{alert.text}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">{alert.urgency}</span>
            <span className={cn('px-2 py-0.5 text-xs rounded', sentimentColors[alert.sentiment as keyof typeof sentimentColors])}>
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

function RecommendationsList({ recommendations }: { recommendations: any[] | undefined }) {
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
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', rec.priority >= 7 ? 'bg-red-500/20 text-red-400' : rec.priority >= 4 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400')}>
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
  const { session } = useAuthStore();
  const slug = session?.user?.organization?.slug || '';

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
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 h-80">
          <SentimentTrendsChart trends={trends} />
          <SentimentLegend />
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