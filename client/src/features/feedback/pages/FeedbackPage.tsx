import { useState, type FormEvent } from 'react';
import { useOrgSlug } from '@/lib/stores/auth.store';
import { useFeedbacks, useUpdateFeedbackStatus } from '@/features/feedback/hooks';
import { useFeedbackStore } from '@/lib/stores/feedback.store';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Select,
  Textarea,
  EmptyState,
  LoadingState,
  type BadgeProps,
} from '@/components/ui';
import type { Feedback, FeedbackStatus } from '@/features/feedback/types';

const sentimentVariant: Record<string, BadgeProps['variant']> = {
  Positive: 'success',
  Negative: 'destructive',
  Neutral: 'neutral',
  Mixed: 'warning',
};

const urgencyVariant: Record<string, BadgeProps['variant']> = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'success',
};

const statusConfig: Record<
  FeedbackStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  open: { label: 'Open', icon: Circle, className: 'text-muted-foreground' },
  in_progress: { label: 'In progress', icon: Clock, className: 'text-warning' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'text-success' },
  ignored: { label: 'Ignored', icon: XCircle, className: 'text-muted-foreground' },
};

export function FeedbackPage() {
  const slug = useOrgSlug();
  const { currentPage, setPage, filters, setFilters } = useFeedbackStore();
  const { data, isLoading, isError } = useFeedbacks(slug);
  const updateStatus = useUpdateFeedbackStatus(slug || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const allFeedbacks: Feedback[] = data?.feedbacks ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const query = searchQuery.trim().toLowerCase();
  const feedbacks =
    query.length === 0
      ? allFeedbacks
      : allFeedbacks.filter(
          (f) =>
            f.text.toLowerCase().includes(query) ||
            f.category.toLowerCase().includes(query) ||
            f.keywords.some((k) => k.toLowerCase().includes(query)) ||
            (f.suggestedAction || '').toLowerCase().includes(query),
        );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
  };

  const setStatus = (id: string, status: FeedbackStatus) => {
    if (!slug) return;
    updateStatus.mutate({
      id,
      status,
      internalNote: noteDraft.trim() || undefined,
    });
    setNoteDraft('');
    setExpandedId(null);
  };

  if (!slug) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No organization selected"
        description="Select an organization to view feedback"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Feedback" description="Review, act, and close the loop with customers" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback, themes, actions…"
            className="w-full pl-9 pr-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
          />
        </form>
        <Select
          value={filters.sentiment || ''}
          onChange={(e) => handleFilterChange('sentiment', e.target.value)}
          className="bg-background sm:w-auto"
          aria-label="Filter by sentiment"
        >
          <option value="">All sentiments</option>
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
          <option value="Neutral">Neutral</option>
          <option value="Mixed">Mixed</option>
        </Select>
        <Select
          value={filters.urgency || ''}
          onChange={(e) => handleFilterChange('urgency', e.target.value)}
          className="bg-background sm:w-auto"
          aria-label="Filter by urgency"
        >
          <option value="">All urgency</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>
        <Select
          value={(filters as { status?: string }).status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="bg-background sm:w-auto"
          aria-label="Filter by status"
        >
          <option value="">All status</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </Select>
      </div>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading feedback…" />
        ) : isError ? (
          <div className="p-12 text-center text-destructive text-sm">Failed to load feedback</div>
        ) : feedbacks.length === 0 ? (
          <EmptyState
            compact
            icon={MessageSquare}
            title="No feedback yet"
            description="Share your public link or QR code. Once customers respond, you’ll see AI actions here."
          />
        ) : (
          <>
            <div className="divide-y divide-border">
              {feedbacks.map((feedback) => {
                const status = (feedback.status || 'open') as FeedbackStatus;
                const StatusIcon = statusConfig[status].icon;
                const isExpanded = expandedId === feedback.id;

                return (
                  <div key={feedback.id} className="p-4 sm:p-5 hover:bg-muted transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {feedback.sentiment && (
                          <Badge
                            variant={
                              sentimentVariant[
                                feedback.sentiment as keyof typeof sentimentVariant
                              ] ?? 'neutral'
                            }
                          >
                            {feedback.sentiment}
                          </Badge>
                        )}
                        {feedback.urgency && (
                          <Badge
                            variant={
                              urgencyVariant[feedback.urgency as keyof typeof urgencyVariant] ??
                              'neutral'
                            }
                          >
                            {feedback.urgency === 'High' && <AlertTriangle className="w-3 h-3" />}
                            {feedback.urgency}
                          </Badge>
                        )}
                        <Badge>{feedback.category}</Badge>
                        {typeof feedback.satisfactionEstimate === 'number' && (
                          <Badge
                            variant={
                              feedback.satisfactionEstimate <= 2
                                ? 'destructive'
                                : feedback.satisfactionEstimate === 3
                                  ? 'warning'
                                  : 'success'
                            }
                          >
                            Satisfaction {feedback.satisfactionEstimate}/5
                          </Badge>
                        )}
                        {feedback.fixableProblem && (
                          <Badge variant="warning">
                            <Wrench className="w-3 h-3" />
                            Fixable
                          </Badge>
                        )}
                        {feedback.retentionRisk && feedback.retentionRisk !== 'Low' && (
                          <Badge
                            variant={feedback.retentionRisk === 'High' ? 'destructive' : 'warning'}
                          >
                            {feedback.retentionRisk === 'High' && (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {feedback.retentionRisk} risk
                          </Badge>
                        )}
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-medium rounded-full inline-flex items-center gap-1',
                            statusConfig[status].className,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[status].label}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-sm text-foreground leading-relaxed">{feedback.text}</p>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={cn(
                              'w-3.5 h-3.5',
                              n <= feedback.rating
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground/30',
                            )}
                          />
                        ))}
                        {typeof feedback.confidence === 'number' && (
                          <span className="text-[10px] text-muted-foreground ml-2">
                            AI confidence {Math.round(feedback.confidence * 100)}%
                            {feedback.correctedByHuman ? ' · corrected' : ''}
                          </span>
                        )}
                      </div>

                      {feedback.suggestedAction && (
                        <div className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
                          <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span>
                            <span className="font-medium text-foreground">Suggested action: </span>
                            <span className="text-muted-foreground">
                              {feedback.suggestedAction}
                            </span>
                          </span>
                        </div>
                      )}

                      {feedback.fixableProblem &&
                        feedback.concreteIssue &&
                        feedback.concreteIssue !== 'None' && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Fixable issue: </span>
                            {feedback.concreteIssue}
                          </p>
                        )}

                      {feedback.rootCause && feedback.rootCause !== 'Unknown' && (                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Root cause: </span>
                          {feedback.rootCause}
                        </p>
                      )}

                      {/* Close-the-loop actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {status !== 'resolved' && (
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() => setStatus(feedback.id, 'resolved')}
                            disabled={updateStatus.isPending}
                          >
                            Mark resolved
                          </Button>
                        )}
                        {status !== 'in_progress' && status !== 'resolved' && (
                          <Button
                            size="xs"
                            variant="warning"
                            onClick={() => setStatus(feedback.id, 'in_progress')}
                            disabled={updateStatus.isPending}
                          >
                            In progress
                          </Button>
                        )}
                        {status !== 'ignored' && status !== 'resolved' && (
                          <Button
                            size="xs"
                            variant="secondary"
                            className="text-muted-foreground"
                            onClick={() => setStatus(feedback.id, 'ignored')}
                            disabled={updateStatus.isPending}
                          >
                            Ignore
                          </Button>
                        )}
                        {status !== 'open' && (
                          <Button
                            size="xs"
                            variant="outline"
                            className="text-muted-foreground"
                            onClick={() => setStatus(feedback.id, 'open')}
                            disabled={updateStatus.isPending}
                          >
                            Reopen
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-muted-foreground ml-auto"
                          onClick={() => {
                            setExpandedId(isExpanded ? null : feedback.id);
                            setNoteDraft(feedback.internalNote || '');
                          }}
                        >
                          {isExpanded ? 'Hide note' : 'Internal note'}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 pt-1">
                          <Textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            rows={2}
                            placeholder="Internal note (not visible to customers)"
                            className="bg-background text-sm resize-none"
                          />
                          <Button
                            size="xs"
                            onClick={() => {
                              updateStatus.mutate({
                                id: feedback.id,
                                internalNote: noteDraft,
                              });
                              setExpandedId(null);
                            }}
                            disabled={updateStatus.isPending}
                          >
                            Save note
                          </Button>
                        </div>
                      )}

                      {feedback.ownerReply && (
                        <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
                          <span className="font-medium text-foreground">Reply: </span>
                          {feedback.ownerReply}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
