import React, { useEffect, useState } from 'react';
import { Copy, Download, ImageDown, Share2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import { downloadBlob } from '../../utils/download';
import { buildCaption, renderShareCard, shareRenderedCard, ShareCardSpec } from '../../share/shareCard';
import { Button, ButtonSize, ButtonVariant } from './UIPrimitives';

interface ShareCardButtonProps {
  spec: ShareCardSpec;
  /** Base file name without extension, e.g. "lovemate-love-score". */
  fileName: string;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * "Share as image" button. Opens a small preview of the rendered 4:5 card with
 * Share (native sheet on phones) / Download / Copy caption actions.
 */
export const ShareCardButton: React.FC<ShareCardButtonProps> = ({
  spec,
  fileName,
  label = 'Share as image',
  variant = 'secondary',
  size = 'sm',
  className = '',
}) => {
  const { showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [busy, setBusy] = useState(false);

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const caption = buildCaption(spec);
  const safeFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

  // Render whenever the preview opens; revoke the object URL when it closes or the spec changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let url: string | null = null;
    setRendering(true);
    setBlob(null);
    setPreviewUrl(null);
    renderShareCard(spec)
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) showToast("Couldn't create the card. Please try again.", 'info');
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(spec)]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleShare = async () => {
    if (!blob || busy) return;
    setBusy(true);
    const status = await shareRenderedCard(blob, spec, { fileName: safeFileName, caption, showToast });
    setBusy(false);
    if (status === 'shared') {
      showToast('Shared. Spread the love!', 'love');
      setOpen(false);
    } else if (status === 'downloaded') {
      setOpen(false);
    }
  };

  const handleDownload = () => {
    if (!blob) return;
    downloadBlob(blob, safeFileName);
    showToast('Card saved to your downloads.', 'success');
  };

  const handleCopyCaption = async () => {
    const ok = await copyText(caption);
    showToast(ok ? 'Caption copied.' : "Couldn't copy. Please copy manually.", ok ? 'success' : 'info');
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        icon={<ImageDown className="w-3.5 h-3.5" />}
        data-testid="share-card-button"
      >
        {label}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Share card preview"
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-zinc-200 overflow-hidden relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close preview"
              className="absolute top-3 right-3 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-5 pt-5 pb-3 text-center border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">Your share card</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">1080 × 1350 · fits Instagram and WhatsApp Status</p>
            </div>

            <div className="p-4 bg-zinc-100/70 flex items-center justify-center overflow-y-auto">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Share card preview"
                  data-testid="share-card-preview"
                  className="w-full max-w-[280px] aspect-[4/5] rounded-2xl shadow-lg border border-rose-100 object-cover"
                />
              ) : (
                <div className="w-full max-w-[280px] aspect-[4/5] rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-xs text-zinc-500">
                  {rendering ? 'Drawing your card…' : 'Preview unavailable'}
                </div>
              )}
            </div>

            <div className="p-4 grid grid-cols-3 gap-2 border-t border-zinc-100">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleShare}
                disabled={!blob}
                loading={busy}
                icon={<Share2 className="w-3.5 h-3.5" />}
                data-testid="share-card-share"
              >
                {canNativeShare ? 'Share' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                disabled={!blob}
                icon={<Download className="w-3.5 h-3.5" />}
                data-testid="share-card-download"
              >
                Download
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleCopyCaption} icon={<Copy className="w-3.5 h-3.5" />}>
                Caption
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
