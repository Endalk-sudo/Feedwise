import { useAuthStore } from '@/lib/stores/auth.store';
import { useOrganization } from '@/features/organization/hooks';
import { useFeedbackStats } from '@/features/feedback/hooks';
import { MessageSquare, TrendingUp, Bot, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const stats = [
  { name: 'Total Feedback', key: 'total', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'This Week', key: 'recentCount', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  { name: 'Positive', key: 'positive', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  { name: 'Needs Attention', key: 'alerts', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
];

export function DashboardHome() {
  const { session } = useAuthStore();
  const { data: org } = useOrganization(session?.organization?.slug || '');
  const { data: statsData } = useFeedbackStats(session?.organization?.slug || '');

  const positiveCount = statsData?.bySentiment?.find((s) => s.sentiment === 'Positive')?.count || 0;
  const alertsCount = statsData?.byUrgency?.find((u) => u.urgency === 'High')?.count || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}! 👋</h1>
          <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your feedback today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/feedback" className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-all">
            View All Feedback
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">{stat.name}</p>
                <p className="text-3xl font-bold mt-1">
                  {stat.key === 'total' ? statsData?.total || 0 :
                   stat.key === 'recentCount' ? statsData?.recentCount || 0 :
                   stat.key === 'positive' ? positiveCount :
                   alertsCount}
                </p>
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard/feedback" className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all">
            <MessageSquare className="w-6 h-6 text-blue-400 mb-2" />
            <p className="font-medium">View Feedback</p>
            <p className="text-sm text-slate-500 mt-1">Browse all customer feedback</p>
          </Link>
          <Link to="/dashboard/analytics" className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-all">
            <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
            <p className="font-medium">Analytics</p>
            <p className="text-sm text-slate-500 mt-1">View trends & insights</p>
          </Link>
          <Link to="/dashboard/ai" className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-pink-500/50 transition-all">
            <Bot className="w-6 h-6 text-pink-400 mb-2" />
            <p className="font-medium">AI Assistant</p>
            <p className="text-sm text-slate-500 mt-1">Ask questions about feedback</p>
          </Link>
          <Link to="/dashboard/settings" className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-all">
            <Settings className="w-6 h-6 text-slate-400 mb-2" />
            <p className="font-medium">Settings</p>
            <p className="text-sm text-slate-500 mt-1">Manage your organization</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/dashboard/feedback" className="p-4 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
            <h3 className="font-medium">Recent Feedback</h3>
            <p className="text-sm text-slate-500 mt-1">View latest customer submissions</p>
          </Link>
          <Link to="/dashboard/analytics" className="p-4 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
            <h3 className="font-medium">Sentiment Trends</h3>
            <p className="text-sm text-slate-500 mt-1">Track sentiment over time</p>
          </Link>
          <Link to="/dashboard/ai" className="p-4 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
            <h3 className="font-medium">Ask AI</h3>
            <p className="text-sm text-slate-500 mt-1">Get insights from your data</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';