import { useAuthStore, useOrgSlug } from '@/lib/stores/auth.store';
import { useFeedbackStats } from '@/features/feedback/hooks';
import { useMyOrganizations } from '@/features/organization/hooks';
import { MessageSquare, TrendingUp, Bot, AlertTriangle, CheckCircle2, Settings } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const stats = [
  { name: 'Total Feedback', key: 'total', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'This Week', key: 'recentCount', icon: TrendingUp, color: 'text-primary', bg: 'bg-green-500/10' },
  { name: 'Positive', key: 'positive', icon: CheckCircle2, color: 'text-primary', bg: 'bg-green-500/10' },
  { name: 'Needs Attention', key: 'alerts', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
];

export function DashboardHome() {
  const { user, activeOrganization, setActiveOrganization } = useAuthStore();
  const slug = useOrgSlug();
  const { data: myOrgs } = useMyOrganizations();
  const { data: statsData } = useFeedbackStats(slug);

  // Default to the first membership until the user picks an org
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
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No organization yet</h2>
        <p className="text-muted-foreground mb-6">Create your organization to start collecting feedback.</p>
        <Link
          to="/org-setup"
          className="px-6 py-3 btn-brand"
        >
          Set up organization
        </Link>
      </div>
    );
  }

  const positiveCount = statsData?.bySentiment?.find((s) => s.sentiment === 'Positive')?.count || 0;
  const alertsCount = statsData?.byUrgency?.find((u) => u.urgency === 'High')?.count || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your feedback today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/feedback" className="bg-secondary border border-input px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:text-foreground hover:border-input transition-all">
            View All Feedback
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.name}</p>
                <p className="text-3xl font-bold mt-1">
                  {stat.key === 'total' ? statsData?.total || 0 :
                   stat.key === 'recentCount' ? statsData?.recentCount || 0 :
                   stat.key === 'positive' ? positiveCount :
                   alertsCount}
                </p>
              </div>
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard/feedback" className="p-4 bg-secondary/50 border border-input rounded-lg hover:border-blue-500/50 transition-all">
            <MessageSquare className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium">View Feedback</p>
            <p className="text-sm text-muted-foreground mt-1">Browse all customer feedback</p>
          </Link>
          <Link to="/dashboard/analytics" className="p-4 bg-secondary/50 border border-input rounded-lg hover:border-purple-500/50 transition-all">
            <TrendingUp className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium">Analytics</p>
            <p className="text-sm text-muted-foreground mt-1">View trends & insights</p>
          </Link>
          <Link to="/dashboard/ai" className="p-4 bg-secondary/50 border border-input rounded-lg hover:border-primary/50 transition-all">
            <Bot className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium">AI Assistant</p>
            <p className="text-sm text-muted-foreground mt-1">Ask questions about feedback</p>
          </Link>
          <Link to="/dashboard/settings" className="p-4 bg-secondary/50 border border-input rounded-lg hover:border-input transition-all">
            <Settings className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="font-medium">Settings</p>
            <p className="text-sm text-muted-foreground mt-1">Manage your organization</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/dashboard/feedback" className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg hover:border-input transition-all">
            <h3 className="font-medium">Recent Feedback</h3>
            <p className="text-sm text-muted-foreground mt-1">View latest customer submissions</p>
          </Link>
          <Link to="/dashboard/analytics" className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg hover:border-input transition-all">
            <h3 className="font-medium">Sentiment Trends</h3>
            <p className="text-sm text-muted-foreground mt-1">Track sentiment over time</p>
          </Link>
          <Link to="/dashboard/ai" className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg hover:border-input transition-all">
            <h3 className="font-medium">Ask AI</h3>
            <p className="text-sm text-muted-foreground mt-1">Get insights from your data</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

