/**
 * Branded share-as-image cards, rendered with the Canvas 2D API only (no dependencies).
 *
 * Output is a 1080x1350 PNG (4:5), which fits Instagram feed posts and WhatsApp Status without
 * cropping. Cards only ever carry names, scores and short public lines: never message text or
 * birth times. Callers decide what goes on the card; keep it to what you'd put on a poster.
 */
import { copyText } from '../utils/clipboard';
import { downloadBlob } from '../utils/download';

export interface ShareCardSpec {
  /** Small label in the top-right pill, e.g. "Love calculator". */
  eyebrow?: string;
  /** The big statement, wrapped onto at most 3 lines. */
  headline: string;
  /** Hero number or badge shown in the rose circle, e.g. "87%" or "28/36". */
  hero?: string;
  /** Tiny uppercase caption under the hero, e.g. "match". */
  heroLabel?: string;
  /** 2-4 supporting lines. Extra lines are dropped. */
  lines?: string[];
  /** Optional pair of names shown as "A  ♥  B". */
  names?: [string, string];
  /** Small italic line near the bottom (disclaimers, cultural notes). */
  footnote?: string;
  /** Text copied to the clipboard / passed to the share sheet. Defaults to a summary of the card. */
  caption?: string;
}

export type ShareCardStatus = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export interface ShareCardOptions {
  fileName: string;
  caption?: string;
  /** Feedback hook; usually AppContext's showToast. */
  showToast?: (message: string, type?: 'success' | 'info' | 'love') => void;
}

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

// Emoji-safe stack: brand font first, then the platform emoji fonts so ♥ / 🔥 / 💍 never render as tofu.
const FONT =
  '"Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const SERIF = '"Playfair Display", Georgia, "Times New Roman", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif';

const INK = '#18181b';
const INK_SOFT = '#52525b';
const INK_MUTED = '#a1a1aa';
const ROSE = '#e11d48';
const ROSE_DEEP = '#be123c';

const font = (weight: number | string, size: number, family = FONT) => `${weight} ${size}px ${family}`;

/** "lovemate.app" style host for the footer: the current origin without protocol or trailing slash. */
export function siteHost(): string {
  if (typeof window === 'undefined') return 'lovemate';
  return window.location.origin.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Short plain-text caption used for the share sheet and clipboard fallback. */
export function buildCaption(spec: ShareCardSpec): string {
  if (spec.caption) return spec.caption;
  const parts: string[] = [];
  if (spec.names) parts.push(`${spec.names[0]} ♥ ${spec.names[1]}`);
  parts.push(spec.hero ? `${spec.hero} — ${spec.headline}` : spec.headline);
  for (const l of (spec.lines ?? []).slice(0, 4)) parts.push(l);
  parts.push(`via LoveMate · ${siteHost()}`);
  return parts.join('\n');
}

/* ----------------------------- text helpers ----------------------------- */

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Greedy word wrap; words wider than the column are split by character so nothing can overflow. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  const pushWord = (word: string) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      return;
    }
    if (line) lines.push(line);
    line = '';
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
      return;
    }
    let chunk = '';
    for (const ch of Array.from(word)) {
      if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = '';
      }
      chunk += ch;
    }
    line = chunk;
  };
  for (const word of clean(text).split(' ')) pushWord(word);
  if (line) lines.push(line);
  return lines;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const chars = Array.from(text);
  while (chars.length > 1 && ctx.measureText(chars.join('') + '…').width > maxWidth) chars.pop();
  return chars.join('').trimEnd() + '…';
}

interface Fitted {
  size: number;
  lines: string[];
}

/** Shrinks the font size until the text fits within maxLines; truncates the last line as a last resort. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { maxWidth: number; maxLines: number; maxSize: number; minSize: number; weight: number | string; family?: string }
): Fitted {
  const family = opts.family ?? FONT;
  let size = opts.maxSize;
  let lines: string[] = [];
  while (size >= opts.minSize) {
    ctx.font = font(opts.weight, size, family);
    lines = wrapText(ctx, text, opts.maxWidth);
    if (lines.length <= opts.maxLines) return { size, lines };
    size -= 2;
  }
  size = opts.minSize;
  ctx.font = font(opts.weight, size, family);
  lines = wrapText(ctx, text, opts.maxWidth).slice(0, opts.maxLines);
  const last = lines.length - 1;
  lines[last] = ellipsize(ctx, lines[last] + ' …', opts.maxWidth);
  return { size, lines };
}

/* ----------------------------- drawing helpers ----------------------------- */

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.95);
  ctx.bezierCurveTo(-s * 1.35, s * 0.05, -s * 0.95, -s * 1.05, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.95, -s * 1.05, s * 1.35, s * 0.05, 0, s * 0.95);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  drawHeart(ctx, x + 22 * scale, y - 2 * scale, 40 * scale, ROSE);
  ctx.fillStyle = INK;
  ctx.font = font(800, 40 * scale);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('LoveMate', x + 56 * scale, y);
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, rightX: number, cy: number) {
  ctx.font = font(700, 22);
  const label = text.toUpperCase();
  const w = ctx.measureText(label).width + 48;
  const h = 48;
  roundedRect(ctx, rightX - w, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = '#ffe4e6';
  ctx.fill();
  ctx.fillStyle = ROSE_DEEP;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rightX - w / 2, cy + 1);
}

async function ensureFonts() {
  try {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) return;
    await Promise.race([
      Promise.all([
        fonts.load('800 40px "Plus Jakarta Sans"'),
        fonts.load('700 64px "Plus Jakarta Sans"'),
        fonts.load('500 34px "Plus Jakarta Sans"'),
        fonts.load('italic 400 26px "Playfair Display"'),
      ]),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    /* system fonts are fine */
  }
}

/* ----------------------------- renderer ----------------------------- */

/** Draws the card to an offscreen canvas and returns it as a PNG blob. */
export async function renderShareCard(spec: ShareCardSpec): Promise<Blob> {
  await ensureFonts();

  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');

  // Background: soft rose gradient with two blurred blobs.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fff1f2');
  bg.addColorStop(0.55, '#ffe4e6');
  bg.addColorStop(1, '#fce7f3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const blob = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(140, 180, 420, 'rgba(251,113,133,0.35)');
  blob(960, 1180, 480, 'rgba(244,114,182,0.30)');
  blob(900, 260, 300, 'rgba(253,164,175,0.28)');

  // Inner card.
  const cardX = 72;
  const cardY = 96;
  const cardW = W - cardX * 2;
  const cardH = H - cardY * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(190, 18, 60, 0.16)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.fillStyle = 'rgba(255,255,255,0.93)';
  ctx.fill();
  ctx.restore();

  const pad = 72;
  const left = cardX + pad;
  const right = cardX + cardW - pad;
  const contentW = right - left;
  const centerX = W / 2;

  // Header: wordmark + eyebrow pill.
  const headerY = cardY + 96;
  drawWordmark(ctx, left, headerY);
  if (spec.eyebrow) drawPill(ctx, clean(spec.eyebrow).slice(0, 28), right, headerY);

  // Footer: divider, small wordmark, site host.
  const footerY = cardY + cardH - 78;
  ctx.strokeStyle = '#fecdd3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, footerY - 52);
  ctx.lineTo(right, footerY - 52);
  ctx.stroke();
  drawHeart(ctx, left + 14, footerY - 1, 26, ROSE);
  ctx.fillStyle = INK_SOFT;
  ctx.font = font(700, 26);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('lovemate', left + 38, footerY);
  ctx.fillStyle = INK_MUTED;
  ctx.font = font(500, 24);
  ctx.textAlign = 'right';
  ctx.fillText(ellipsize(ctx, siteHost(), contentW - 220), right, footerY);

  // ---- Measure the flexible middle block, then center it between header and footer. ----
  const areaTop = headerY + 70;
  const areaBottom = footerY - 92;
  const lines = (spec.lines ?? []).map(clean).filter(Boolean).slice(0, 4);

  type Block =
    | { kind: 'names'; text: string; size: number; h: number }
    | { kind: 'hero'; r: number; h: number; fitted: Fitted; label?: string }
    | { kind: 'headline'; fitted: Fitted; lineH: number; h: number }
    | { kind: 'line'; text: string; size: number; h: number }
    | { kind: 'footnote'; fitted: Fitted; lineH: number; h: number }
    | { kind: 'gap'; h: number };

  const build = (scale: number): Block[] => {
    const blocks: Block[] = [];
    if (spec.names) {
      const text = `${clean(spec.names[0])}  ♥  ${clean(spec.names[1])}`;
      const f = fitText(ctx, text, { maxWidth: contentW, maxLines: 1, maxSize: 44 * scale, minSize: 26, weight: 600 });
      blocks.push({ kind: 'names', text: f.lines[0], size: f.size, h: f.size * 1.2 });
      blocks.push({ kind: 'gap', h: 28 * scale });
    }
    if (spec.hero) {
      const r = Math.round(150 * scale);
      const fitted = fitText(ctx, clean(spec.hero), { maxWidth: r * 1.5, maxLines: 1, maxSize: 112 * scale, minSize: 40, weight: 800 });
      blocks.push({ kind: 'hero', r, h: r * 2, fitted, label: spec.heroLabel ? clean(spec.heroLabel) : undefined });
      blocks.push({ kind: 'gap', h: 44 * scale });
    }
    const hf = fitText(ctx, spec.headline, { maxWidth: contentW, maxLines: 3, maxSize: 64 * scale, minSize: 36, weight: 800 });
    const hLineH = hf.size * 1.18;
    blocks.push({ kind: 'headline', fitted: hf, lineH: hLineH, h: hLineH * hf.lines.length });
    if (lines.length) {
      blocks.push({ kind: 'gap', h: 36 * scale });
      lines.forEach((text, i) => {
        const f = fitText(ctx, text, { maxWidth: contentW - 60, maxLines: 1, maxSize: 34 * scale, minSize: 24, weight: 500 });
        blocks.push({ kind: 'line', text: f.lines[0], size: f.size, h: f.size * 1.3 });
        if (i < lines.length - 1) blocks.push({ kind: 'gap', h: 18 * scale });
      });
    }
    if (spec.footnote) {
      blocks.push({ kind: 'gap', h: 40 * scale });
      const f = fitText(ctx, spec.footnote, { maxWidth: contentW, maxLines: 2, maxSize: 26, minSize: 20, weight: 'italic 400', family: SERIF });
      const lineH = f.size * 1.35;
      blocks.push({ kind: 'footnote', fitted: f, lineH, h: lineH * f.lines.length });
    }
    return blocks;
  };

  let scale = 1;
  let blocks = build(scale);
  let total = blocks.reduce((s, b) => s + b.h, 0);
  while (total > areaBottom - areaTop && scale > 0.6) {
    scale -= 0.05;
    blocks = build(scale);
    total = blocks.reduce((s, b) => s + b.h, 0);
  }

  let y = areaTop + Math.max(0, (areaBottom - areaTop - total) / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const b of blocks) {
    switch (b.kind) {
      case 'gap':
        break;
      case 'names':
        ctx.fillStyle = INK_SOFT;
        ctx.font = font(600, b.size);
        ctx.fillText(b.text, centerX, y + b.h / 2);
        break;
      case 'hero': {
        const cy = y + b.r;
        ctx.save();
        ctx.shadowColor = 'rgba(225, 29, 72, 0.35)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 16;
        const g = ctx.createLinearGradient(centerX - b.r, cy - b.r, centerX + b.r, cy + b.r);
        g.addColorStop(0, '#f43f5e');
        g.addColorStop(1, ROSE_DEEP);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(centerX, cy, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(centerX, cy, b.r - 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = font(800, b.fitted.size);
        const labelOffset = b.label ? b.fitted.size * 0.18 : 0;
        ctx.fillText(b.fitted.lines[0], centerX, cy - labelOffset + 4);
        if (b.label) {
          ctx.font = font(700, Math.max(18, Math.round(b.r * 0.16)));
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText(ellipsize(ctx, b.label.toUpperCase(), b.r * 1.5), centerX, cy + b.fitted.size * 0.5 + 6);
        }
        break;
      }
      case 'headline':
        ctx.fillStyle = INK;
        ctx.font = font(800, b.fitted.size);
        b.fitted.lines.forEach((l, i) => ctx.fillText(l, centerX, y + b.lineH * i + b.lineH / 2));
        break;
      case 'line': {
        ctx.font = font(500, b.size);
        const w = ctx.measureText(b.text).width;
        const dot = 7;
        const startX = centerX - (w + dot * 2 + 14) / 2;
        ctx.fillStyle = ROSE;
        ctx.beginPath();
        ctx.arc(startX + dot, y + b.h / 2, dot, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = INK_SOFT;
        ctx.textAlign = 'left';
        ctx.fillText(b.text, startX + dot * 2 + 14, y + b.h / 2);
        ctx.textAlign = 'center';
        break;
      }
      case 'footnote':
        ctx.fillStyle = INK_MUTED;
        ctx.font = font('italic 400', b.fitted.size, SERIF);
        b.fitted.lines.forEach((l, i) => ctx.fillText(l, centerX, y + b.lineH * i + b.lineH / 2));
        break;
    }
    y += b.h;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((out) => (out ? resolve(out) : reject(new Error('Could not encode the card.'))), 'image/png');
  });
}

/* ----------------------------- sharing ----------------------------- */

function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  try {
    return typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : false;
  } catch {
    return false;
  }
}

/** Share an already rendered card: native share sheet with the file on phones, else download + copy caption. */
export async function shareRenderedCard(blob: Blob, spec: ShareCardSpec, options: ShareCardOptions): Promise<ShareCardStatus> {
  const fileName = options.fileName.endsWith('.png') ? options.fileName : `${options.fileName}.png`;
  const caption = options.caption ?? buildCaption(spec);
  const toast = options.showToast ?? (() => {});
  const file = new File([blob], fileName, { type: 'image/png' });

  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: spec.headline, text: caption });
      return 'shared';
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
      /* fall through to the download path */
    }
  }

  try {
    downloadBlob(blob, fileName);
    const copied = await copyText(caption);
    toast(copied ? 'Card saved. Caption copied, ready to paste.' : 'Card saved to your downloads.', 'success');
    return 'downloaded';
  } catch {
    toast("Couldn't save the card. Please try again.", 'info');
    return 'failed';
  }
}

/** Render + share in one call. */
export async function shareCard(spec: ShareCardSpec, options: ShareCardOptions): Promise<ShareCardStatus> {
  try {
    const blob = await renderShareCard(spec);
    return shareRenderedCard(blob, spec, options);
  } catch {
    options.showToast?.("Couldn't create the card. Please try again.", 'info');
    return 'failed';
  }
}
