import { useState, type FormEvent } from 'react';
import { useOrgSlug } from '@/lib/stores/auth.store';
import { useFeedbacks } from '@/features/feedback/hooks';
import { useFeedbackStore } from '@/lib/stores/feedback.store';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Star, AlertTriangle, Tag, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Feedback } from '@/features/feedback/types';

const sentimentColors = {
  Positive: 'bg-primary/10 text-primary border-green-500/30',
  Negative: 'bg-red-500/20 text-destructive border-destructive/30',
  Neutral: 'bg-slate-500/20 text-muted-foreground border-slate-500/30',
  Mixed: 'bg-warning/10 text-warning border-yellow-500/30',
};

const urgencyColors = {
  High: 'bg-red-500/20 text-destructive border-destructive/30',
  Medium: 'bg-warning/10 text-warning border-yellow-500/30',
  Low: 'bg-primary/10 text-primary border-green-500/30',
};

const starColors = {
  5: 'text-warning',
  4: 'text-warning',
  3: 'text-warning',
  2: 'text-muted-foreground',
  1: 'text-muted-foreground',
};

export function FeedbackPage() {
  const slug = useOrgSlug();
  const { currentPage, setPage, filters, setFilters } = useFeedbackStore();
  const { data, isLoading, isError } = useFeedbacks(slug);
  const [searchQuery, setSearchQuery] = useState('');

  const allFeedbacks: Feedback[] = data?.feedbacks ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  // Client-side search over the loaded page
  const query = searchQuery.trim().toLowerCase();
  const feedbacks =
    query.length === 0
      ? allFeedbacks
      : allFeedbacks.filter(
          (f) =>
            f.text.toLowerCase().includes(query) ||
            f.category.toLowerCase().includes(query) ||
            f.keywords.some((k) => k.toLowerCase().includes(query)),
        );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
  };

  if (!slug) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
        <p className="text-muted-foreground">Please select an organization to view feedback</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-muted-foreground mt-1">View and manage all customer feedback</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary border border-input rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.sentiment || ''}
              onChange={(e) => handleFilterChange('sentiment', e.target.value)}
              className="px-4 py-2 bg-secondary border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
            >
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Neutral">Neutral</option>
              <option value="Mixed">Mixed</option>
            </select>

            <select
              value={filters.urgency || ''}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
              className="px-4 py-2 bg-secondary border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
            >
              <option value="">All Urgency</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 bg-secondary border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring min-w-[150px]"
            >
              <option value="">All Categories</option>
                {Array.from(new Set(allFeedbacks.map((f) => f.category))).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Feedback List */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading feedback...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-destructive">Failed to load feedback</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No feedback yet</h3>
            <p className="text-muted-foreground">Customer feedback will appear here once submitted</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-800">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="p-4 sm:p-6 hover:bg-secondary/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Rating & Sentiment */}
                    <div className="flex flex-col items-center sm:w-20 gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-4 h-4',
                              star <= feedback.rating ? 'fill-current' : 'text-muted-foreground',
                              starColors[feedback.rating as keyof typeof starColors]
                            )}
                          />
                        ))}
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          sentimentColors[feedback.sentiment as keyof typeof sentimentColors] || 'bg-secondary text-muted-foreground'
                        )}
                      >
                        {feedback.sentiment}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded', urgencyColors[feedback.urgency as keyof typeof urgencyColors] || 'bg-secondary text-muted-foreground')}>
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          {feedback.urgency}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground rounded">
                          <Tag className="w-3 h-3 inline mr-1" />
                          {feedback.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-foreground mb-3 line-clamp-3">{feedback.text}</p>

                      {feedback.keyPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {feedback.keyPoints.slice(0, 3).map((point, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded">
                              {point}
                            </span>
                          ))}
                          {feedback.keyPoints.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-muted-foreground">+{feedback.keyPoints.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center sm:justify-end gap-2">
                      <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
