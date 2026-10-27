import React, { useState } from 'react';
import { Camera, ImageMinus, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { friendlyImageError, pickAndCompressImage } from '../../utils/images';
import { Button } from './UIPrimitives';

interface PhotoAttachmentProps {
  /** Current photo (data URL or http URL). */
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  /** Called with the photo when the thumbnail is tapped (open a lightbox). */
  onOpen?: (src: string) => void;
  /** When false the "add" button is disabled with the given reason (photo cap reached). */
  canAdd?: boolean;
  disabledReason?: string;
  alt?: string;
  /** compact: thumbnail + icon buttons. card: large dropzone-like button when empty. */
  layout?: 'compact' | 'card';
  /** Hide the small thumbnail (when the photo is already shown large nearby). */
  showThumb?: boolean;
  className?: string;
}

/**
 * Pick -> compress -> store a photo on an item. Shows a thumbnail, replace and remove buttons.
 * Images are JPEG data URLs under ~150 KB (see src/utils/images.ts).
 */
export const PhotoAttachment: React.FC<PhotoAttachmentProps> = ({
  value,
  onChange,
  onOpen,
  canAdd = true,
  disabledReason,
  alt = 'Photo',
  layout = 'compact',
  showThumb = true,
  className = '',
}) => {
  const { showToast } = useApp();
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    if (busy) return;
    if (!value && !canAdd) {
      showToast(disabledReason || 'Photo limit reached.', 'info');
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await pickAndCompressImage({ maxEdge: 1024, quality: 0.8 });
      if (dataUrl) onChange(dataUrl);
    } catch (e) {
      showToast(friendlyImageError(e), 'info');
    } finally {
      setBusy(false);
    }
  };

  if (!value) {
    if (layout === 'card') {
      return (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          data-testid="photo-add"
          className={`w-full rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 hover:border-rose-300 hover:bg-rose-50/40 transition-colors p-5 flex flex-col items-center justify-center gap-1.5 text-center ${className}`}
        >
          <span className="w-9 h-9 rounded-xl bg-white border border-zinc-200 text-rose-500 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-zinc-800">{busy ? 'Preparing photo…' : 'Add a photo'}</span>
          <span className="text-[11px] text-zinc-500">JPG, PNG or HEIC · stays private</span>
        </button>
      );
    }
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={pick}
        loading={busy}
        icon={<Camera className="w-3.5 h-3.5" />}
        className={className}
        data-testid="photo-add"
        title={!canAdd ? disabledReason : undefined}
      >
        Add photo
      </Button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showThumb && (
        <button
          type="button"
          onClick={() => onOpen?.(value)}
          className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
          aria-label="View photo"
          data-testid="photo-thumb"
        >
          <img src={value} alt={alt} className="w-full h-full object-cover" />
        </button>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          title="Replace photo"
          aria-label="Replace photo"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Remove photo"
          aria-label="Remove photo"
          data-testid="photo-remove"
        >
          <ImageMinus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
