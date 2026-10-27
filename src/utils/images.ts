/**
 * Photo helpers for user uploads (scrapbook pages, timeline milestones).
 *
 * Images are stored inline as JPEG data URLs on the item they belong to, so they persist and
 * sync exactly like the rest of that item's data. Cloud sync has a 2 MB per-key limit, which is
 * why every photo is compressed to roughly <= 150 KB and each collection is capped at
 * MAX_PHOTOS_PER_COLLECTION photos (30 x 150 KB stays well under the limit with the text data).
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const TARGET_PHOTO_BYTES = 150 * 1024;
export const MAX_PHOTOS_PER_COLLECTION = 30;

export class ImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageError';
  }
}

const PICKER_ID = 'lovemate-image-picker';

/**
 * Opens the OS file picker through a hidden <input type="file" accept="image/*">.
 * Resolves with the chosen file, or null when the user cancels.
 * The input stays in the DOM (reused between calls) so automation can target it too.
 */
export function pickImage(): Promise<File | null> {
  return new Promise((resolve) => {
    let input = document.getElementById(PICKER_ID) as HTMLInputElement | null;
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.id = PICKER_ID;
      input.setAttribute('aria-hidden', 'true');
      input.tabIndex = -1;
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.opacity = '0';
      document.body.appendChild(input);
    }
    const el = input;
    el.value = '';

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      el.removeEventListener('change', onChange);
      window.removeEventListener('focus', onFocus);
      resolve(file);
    };
    const onChange = () => finish(el.files && el.files[0] ? el.files[0] : null);
    // When the dialog closes without a selection no "change" fires; the window regains focus instead.
    // Give the change event a moment to arrive first.
    const onFocus = () => setTimeout(() => finish(el.files && el.files[0] ? el.files[0] : null), 400);

    el.addEventListener('change', onChange);
    window.addEventListener('focus', onFocus);
    el.click();
  });
}

interface CompressOptions {
  maxEdge?: number;
  quality?: number;
  /** Shrink quality/size until the output is at or below this many bytes. */
  targetBytes?: number;
}

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/** Approximate byte size of a stored data URL (0 for plain http(s) URLs). */
export function photoBytes(url: string | undefined | null): number {
  if (!url || !url.startsWith('data:')) return 0;
  return dataUrlBytes(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      // Browsers that support it apply EXIF orientation here, so phone photos come out upright.
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
    } catch {
      /* fall back to <img> decoding below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new ImageError("We couldn't read that image. Try a JPG or PNG."));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, cleanup: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * Downscale + re-encode an image file as a JPEG data URL using a canvas.
 * Rejects with an ImageError (friendly message) for non-images or files over 15 MB.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<string> {
  const { maxEdge = 1024, quality = 0.8, targetBytes = TARGET_PHOTO_BYTES } = options;

  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name)) {
    throw new ImageError('Please choose a photo (JPG, PNG, WebP or HEIC).');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError(`That photo is ${formatBytes(file.size)}. Please pick one under 15 MB.`);
  }

  const decoded = await decodeImage(file);
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('Your browser could not process this photo.');

    let edge = maxEdge;
    let q = quality;
    let out = '';
    // Step quality down first, then the dimensions, until the data URL fits the target.
    for (let attempt = 0; attempt < 8; attempt++) {
      const scale = Math.min(1, edge / Math.max(decoded.width, decoded.height));
      canvas.width = Math.max(1, Math.round(decoded.width * scale));
      canvas.height = Math.max(1, Math.round(decoded.height * scale));
      ctx.fillStyle = '#ffffff'; // flatten transparency to white instead of black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      out = canvas.toDataURL('image/jpeg', q);
      if (dataUrlBytes(out) <= targetBytes) break;
      if (q > 0.55) q = Math.max(0.55, q - 0.1);
      else edge = Math.round(edge * 0.8);
    }
    if (!out.startsWith('data:image/jpeg')) throw new ImageError('Your browser could not process this photo.');
    return out;
  } finally {
    decoded.cleanup();
  }
}

/** Pick a photo and compress it in one step. Resolves null when the user cancels. */
export async function pickAndCompressImage(options?: CompressOptions): Promise<string | null> {
  const file = await pickImage();
  if (!file) return null;
  return compressImage(file, options);
}

export function friendlyImageError(e: unknown): string {
  if (e instanceof ImageError) return e.message;
  return "We couldn't add that photo. Please try another one.";
}
