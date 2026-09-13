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
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-primary" />
        Collect feedback
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Share this link or print the QR code — customers can respond without an app or account.
      </p>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-3 min-w-0">
          <label htmlFor="feedback-link" className="block text-sm font-medium text-foreground">
            Public feedback link
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="feedback-link"
              type="text"
              readOnly
              value={feedbackUrl}
              onFocus={(e) => e.target.select()}
              className="text-muted-foreground"
            />
            <div className="flex gap-2 shrink-0">
              <Button type="button" variant="secondary" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <a
                href={feedbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open public feedback page in a new tab"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-input bg-background rounded-lg text-foreground hover:bg-muted transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center gap-3 shrink-0">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code linking to the ${slug} feedback page`}
              className="w-36 h-36 rounded-lg border border-border bg-white p-1"
            />
          ) : (
            <div className="w-36 h-36 rounded-lg border border-dashed border-input flex flex-col items-center justify-center gap-2 text-center p-3">
              <QrCode className="w-8 h-8 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                No QR code yet
                {canManage ? ' — generate one below.' : '.'}
              </p>
            </div>
          )}
          <div className="flex sm:justify-center gap-2">
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${slug}-qr.png`}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 px-3 py-1.5 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
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
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
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
