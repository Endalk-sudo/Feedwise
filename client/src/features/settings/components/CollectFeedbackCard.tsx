import { useState } from 'react';
import { Check, Copy, Download, ExternalLink, QrCode, RefreshCw } from 'lucide-react';
import { useRegenerateQrCode } from '@/features/organization/hooks';
import { useUIStore } from '@/lib/stores/ui.store';
import { Button, Card, Input } from '@/components/ui';

interface CollectFeedbackCardProps {
  slug: string;
  qrDataUrl: string | null;
  /** Owner/admin only — the regenerate endpoint enforces this server-side too. */
  canManage: boolean;
}

/**
 * Public collection point for an organization: shareable feedback link
 * plus the QR code (with download + regenerate). Lives at the top of
 * Settings, where the dashboard "QR & link" button already points.
 */
export function CollectFeedbackCard({ slug, qrDataUrl, canManage }: CollectFeedbackCardProps) {
  const { addToast } = useUIStore();
  const regenerate = useRegenerateQrCode(slug);
  const [copied, setCopied] = useState(false);

  // Built from the current origin so it stays correct even if the
  // deployment domain changed since the organization was created.
  const feedbackUrl = `${window.location.origin}/feedback/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedbackUrl);
    } catch {
      // Fallback for non-secure contexts / older browsers
      const el = document.createElement('textarea');
      el.value = feedbackUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    addToast({ message: 'Feedback link copied!', type: 'success' });
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <h2 className="text-[17px] font-semibold tracking-tight mb-1.5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <QrCode className="w-4 h-4 text-primary" />
        </span>
        Collect feedback
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xl">
        Share this link or print the QR code — customers can respond without an app or account.
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-3 min-w-0">
          <label htmlFor="feedback-link" className="block text-sm font-medium text-foreground">
            Public feedback link
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              id="feedback-link"
              type="text"
              readOnly
              value={feedbackUrl}
              onFocus={(e) => e.target.select()}
              className="text-muted-foreground tabular-nums"
            />
            <div className="flex gap-2 shrink-0">
              <Button type="button" variant="secondary" onClick={handleCopy} className="min-h-11">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <a
                href={feedbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open public feedback page in a new tab"
                className="inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold border border-input bg-card rounded-xl text-foreground shadow-xs hover:bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Put it on receipts, tables, packaging, or your website footer.
          </p>
        </div>

        <div className="flex md:flex-col items-center gap-3 shrink-0 md:w-44">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code linking to the ${slug} feedback page`}
              className="w-36 h-36 md:w-40 md:h-40 rounded-2xl border border-border/70 bg-white p-2 shadow-xs"
            />
          ) : (
            <div className="w-36 h-36 rounded-2xl border border-dashed border-input flex flex-col items-center justify-center gap-2 text-center p-3">
              <QrCode className="w-8 h-8 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                No QR code yet
                {canManage ? ' — generate one below.' : '.'}
              </p>
            </div>
          )}
          <div className="flex md:justify-center gap-2">
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${slug}-qr.png`}
                className="inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 px-3 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                PNG
              </a>
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => regenerate.mutate()}
                disabled={regenerate.isPending}
                className="inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 bg-muted/60 border border-border/60 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`}
                />
                {regenerate.isPending ? 'Working…' : qrDataUrl ? 'Regenerate' : 'Generate'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
