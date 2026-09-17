import { useState, type FormEvent } from 'react';
import { useOrgSlug } from '@/lib/stores/auth.store';
import { useFeedbacks, useUpdateFeedbackStatus, useDraftReply, useVerifyFeedback } from '@/features/feedback/hooks';
import { useFeedbackStore } from '@/lib/stores/feedback.store';
import { useUIStore } from '@/lib/stores/ui.store';
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
  Calendar,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Select,
  Textarea,
  EmptyState,
  SkeletonStatCard,
} from '@/components/ui';
import type { Feedback, FeedbackStatus } from '@/features/feedback/types';
import {
  sentimentVariant,
  urgencyVariant,
  retentionRiskVariant,
  satisfactionVariant,
} from '@/lib/status-variants';

const statusConfig: Record<
  FeedbackStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  open: { label: 'Open', icon: Circle, className: 'text-muted-foreground' },
  in_progress: { label: 'In progress', icon: Clock, className: 'text-warning' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'text-success' },
  ignored: { label: 'Ignored', icon: XCircle, className: 'text-muted-foreground' },
};

type SortField = 'createdAt' | 'urgency' | 'sentiment' | 'satisfactionEstimate';
type SortDir = 'asc' | 'desc';

export function FeedbackPage() {
  const slug = useOrgSlug();
  const { currentPage, setPage, filters, setFilters } = useFeedbackStore();
  const { data, isLoading, isError, refetch } = useFeedbacks(slug);
  const updateStatus = useUpdateFeedbackStatus(slug || '');
  const { addToast } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const allFeedbacks: Feedback[] = data?.feedbacks ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  // Reset page when filters/search change
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined });
    setPage(1);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters });
    setPage(1);
  };

  const query = searchQuery.trim().toLowerCase();
  let feedbacks = query.length === 0
    ? allFeedbacks
    : allFeedbacks.filter(
        (f) =>
          f.text.toLowerCase().includes(query) ||
          f.category.toLowerCase().includes(query) ||
          f.keywords.some((k) => k.toLowerCase().includes(query)) ||
          (f.suggestedAction || '').toLowerCase().includes(query),
      );

  // Client-side sort
  feedbacks = [...feedbacks].sort((a, b) => {
    let av: unknown = a[sortField];
    let bv: unknown = b[sortField];
    if (av === undefined || av === null) av = '';
    if (bv === undefined || bv === null) bv = '';
    let cmp = 0;
    if (typeof av === 'string' && typeof bv === 'string') {
      const aLower = av.toLowerCase();
      const bLower = bv.toLowerCase();
      cmp = aLower < bLower ? -1 : aLower > bLower ? 1 : 0;
    } else if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const setStatus = (id: string, status: FeedbackStatus, note?: string) => {
    if (!slug) return;
    updateStatus.mutate(
      { id, status, internalNote: note?.trim() },
      {
        onSuccess: () => {
          if (status === 'ignored') {
            addToast({
              message: 'Feedback ignored — click to undo.',
              type: 'info',
              duration: 5000,
            });
          } else if (status === 'resolved') {
            addToast({ message: 'Marked as resolved', type: 'success' });
          }
        },
      }
    );
    setExpandedId(null);
    // Clear note draft for this item
    setNoteDrafts((prev: Record<string, string>) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSaveNote = (id: string) => {
    if (!slug) return;
    const note = noteDrafts[id]?.trim();
    if (note) {
      updateStatus.mutate(
        { id, internalNote: note },
        { onSuccess: () => addToast({ message: 'Note saved', type: 'success' }) }
      );
    }
    setExpandedId(null);
    setNoteDrafts((prev: Record<string, string>) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Initialize note draft from existing internalNote if not already set
      const fb = allFeedbacks.find((f) => f.id === id);
      const note = fb?.internalNote;
      if (fb && !noteDrafts[id] && note) {
        setNoteDrafts((prev: Record<string, string>) => ({ ...prev, [id]: note }));
      }
    }
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

  const trulyEmpty = total === 0;
  const filteredEmpty = feedbacks.length === 0 && allFeedbacks.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Review, act, and close the loop with customers"
        actions={
          <Select
            value={`${sortField}:${sortDir}`}
            onChange={(e) => {
              const [f, d] = e.target.value.split(':');
              setSortField(f as SortField);
              setSortDir(d as SortDir);
            }}
            className="w-48"
            aria-label="Sort feedback"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="urgency:desc">Urgency: High → Low</option>
            <option value="urgency:asc">Urgency: Low → High</option>
            <option value="sentiment:desc">Sentiment: Z → A</option>
            <option value="sentiment:asc">Sentiment: A → Z</option>
            <option value="satisfactionEstimate:desc">Satisfaction: High → Low</option>
            <option value="satisfactionEstimate:asc">Satisfaction: Low → High</option>
          </Select>
        }
      />

      {/* Filters */}
      <Card padding="sm" className="space-y-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback, themes, actions…"
            aria-label="Search feedback"
            className="w-full pl-10 pr-3 py-2.5 min-h-11 bg-background border border-input rounded-xl text-[15px] placeholder:text-muted-foreground/80 shadow-xs hover:border-ring/40 focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring transition-all"
          />
        </form>
        <div className="flex flex-col sm:flex-row gap-2.5">
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
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <Card padding="lg" className="border-destructive/30 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium">Failed to load feedback</p>
                  <p className="text-sm text-muted-foreground">Please try again.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </Card>
        ) : trulyEmpty ? (
          <EmptyState
            compact
            icon={MessageSquare}
            title="No feedback yet"
            description="Share your public link or QR code. Once customers respond, you'll see AI actions here."
          />
        ) : filteredEmpty ? (
          <EmptyState
            compact
            icon={MessageSquare}
            title="No matching feedback"
            description="Try adjusting your filters or search terms."
            action={
              <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                Clear all filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="divide-y divide-border">
              {feedbacks.map((feedback) => {
                const status = (feedback.status || 'open') as FeedbackStatus;
                const StatusIcon = statusConfig[status].icon;
                const isExpanded = expandedId === feedback.id;
                const noteDraft = noteDrafts[feedback.id] || '';
                const isPending = updateStatus.variables?.id === feedback.id && updateStatus.isPending;

                return (
                  <article key={feedback.id} className="p-5 sm:p-6 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col gap-3.5">
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
                              urgencyVariant[
                                feedback.urgency as keyof typeof urgencyVariant
                              ] ?? 'neutral'
                            }
                          >
                            {feedback.urgency === 'High' && <AlertTriangle className="w-3 h-3" />}
                            {feedback.urgency}
                          </Badge>
                        )}
                        <Badge>{feedback.category}</Badge>
                        {typeof feedback.satisfactionEstimate === 'number' && (
                          <Badge variant={satisfactionVariant(feedback.satisfactionEstimate)}>
                            {feedback.satisfactionEstimate}/5
                          </Badge>
                        )}
                        {feedback.fixableProblem && (
                          <Badge variant="warning">
                            <Wrench className="w-3 h-3" />
                            Fixable
                          </Badge>
                        )}
                        {feedback.retentionRisk && feedback.retentionRisk !== 'Low' && (
                          <Badge variant={retentionRiskVariant[feedback.retentionRisk] ?? 'warning'}>
                            {feedback.retentionRisk === 'High' && <AlertTriangle className="w-3 h-3" />}
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
                          <Calendar className="w-3 h-3 inline" />
                          {formatRelativeTime(feedback.createdAt)}
                        </span>
                      </div>

                      <p className="text-[15px] text-foreground leading-relaxed text-pretty">{feedback.text}</p>

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
                        <div className="flex items-start gap-2.5 text-[13px] leading-relaxed bg-primary/5 border border-primary/20 rounded-xl px-3.5 py-3">
                          <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span>
                            <span className="font-medium text-foreground">Suggested action: </span>
                            <span className="text-muted-foreground">{feedback.suggestedAction}</span>
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

                      {feedback.rootCause && feedback.rootCause !== 'Unknown' && (
                        <p className="text-xs text-muted-foreground">
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
                            disabled={isPending}
                          >
                            Resolved
                          </Button>
                        )}
                        {status !== 'in_progress' && status !== 'resolved' && (
                          <Button
                            size="xs"
                            variant="warning"
                            onClick={() => setStatus(feedback.id, 'in_progress')}
                            disabled={isPending}
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
                            disabled={isPending}
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
                            disabled={isPending}
                          >
                            Reopen
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-muted-foreground ml-auto"
                          onClick={() => handleToggleExpand(feedback.id)}
                          disabled={isPending}
                        >
                          {isExpanded ? 'Hide note' : 'Internal note'}
                        </Button>
                        <DraftReplyButton slug={slug || ''} feedbackId={feedback.id} onUse={(draft) =>
                          updateStatus.mutate(
                            { id: feedback.id, ownerReply: draft, status: 'resolved' },
                            { onSuccess: () => addToast({ message: 'Reply sent & resolved', type: 'success' }) },
                          )
                        } />
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 pt-1 border-t border-border">
                          <Textarea
                            value={noteDraft}
                            onChange={(e) =>
                              setNoteDrafts((prev) => ({ ...prev, [feedback.id]: e.target.value }))
                            }
                            rows={2}
                            placeholder="Internal note (not visible to customers)"
                            className="bg-background text-sm resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="xs"
                              onClick={() => handleSaveNote(feedback.id)}
                              disabled={isPending}
                            >
                              Save note
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setExpandedId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {feedback.ownerReply && (
                        <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
                          <span className="font-medium text-foreground">Reply: </span>
                          {feedback.ownerReply}
                        </p>
                      )}
                      {feedback.verified ? (
                        <Badge size="sm" variant="success">✓ Verified</Badge>
                      ) : (
                        <VerifyButton slug={slug || ''} feedbackId={feedback.id} />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-border/70 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <p className="text-sm text-muted-foreground tabular-nums">
                  Page {currentPage} of {totalPages} · {total} total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

/** Phase 4 (D1/F6): AI draft-reply preview → Accept (resolve) or copy. */
function DraftReplyButton({
  slug,
  feedbackId,
  onUse,
}: {
  slug: string;
  feedbackId: string;
  onUse: (draft: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useDraftReply(slug, open ? feedbackId : null);
  return (
    <>
      <Button size="xs" variant="outline" onClick={() => (open ? setOpen(false) : (setOpen(true), refetch()))}>
        <MessageSquare className="w-3 h-3" />
        AI draft
      </Button>
      {open && (
        <div className="w-full text-xs bg-muted/60 border border-border rounded-lg px-3 py-2 space-y-2">
          {isLoading ? (
            <p className="text-muted-foreground">Drafting reply…</p>
          ) : isError || !data?.draft ? (
            <p className="text-destructive">Couldn&apos;t draft a reply. Try again.</p>
          ) : (
            <>
              <p className="text-foreground leading-relaxed">{data.draft}</p>
              <div className="flex gap-2">
                <Button size="xs" variant="success" onClick={() => { onUse(data.draft); setOpen(false); }}>
                  <CheckCircle2 className="w-3 h-3" />
                  Use & resolve
                </Button>
                <Button size="xs" variant="ghost" onClick={() => navigator.clipboard?.writeText(data.draft)}>
                  Copy
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/** Phase 6 (D3): manual verification toggle (trust badge). */
function VerifyButton({ slug, feedbackId }: { slug: string; feedbackId: string }) {
  const verify = useVerifyFeedback(slug);
  return (
    <Button
      size="xs"
      variant="ghost"
      className="text-muted-foreground"
      disabled={verify.isPending}
      onClick={() => verify.mutate({ id: feedbackId, verified: true })}
    >
      Mark verified
    </Button>
  );
}