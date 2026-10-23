/** Trigger a browser download for a Blob or data URL and clean up the object URL. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, type = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([text], { type }), filename);
}

interface CardSpec {
  title: string;
  subtitle?: string;
  body: string;
  footer?: string;
  /** two CSS colors for the background gradient */
  colors?: [string, string];
  textColor?: string;
  width?: number;
  height?: number;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Render a simple shareable card (1080x1350, Instagram story-friendly) to PNG and download it. */
export function downloadCardPng(spec: CardSpec, filename: string) {
  const W = spec.width ?? 1080;
  const H = spec.height ?? 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const [c1, c2] = spec.colors ?? ['#fff1f2', '#ffe4e6'];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // inner card
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const pad = 80;
  const r = 48;
  ctx.beginPath();
  ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, r);
  ctx.fill();

  const ink = spec.textColor ?? '#18181b';
  let y = pad + 120;
  ctx.fillStyle = '#e11d48';
  ctx.font = '600 34px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('LoveMate', pad + 72, y);
  y += 90;

  ctx.fillStyle = ink;
  ctx.font = '700 64px "Plus Jakarta Sans", system-ui, sans-serif';
  for (const l of wrap(ctx, spec.title, W - pad * 2 - 144)) {
    ctx.fillText(l, pad + 72, y);
    y += 76;
  }
  if (spec.subtitle) {
    y += 8;
    ctx.fillStyle = '#71717a';
    ctx.font = '500 32px "Plus Jakarta Sans", system-ui, sans-serif';
    for (const l of wrap(ctx, spec.subtitle, W - pad * 2 - 144)) {
      ctx.fillText(l, pad + 72, y);
      y += 42;
    }
  }
  y += 50;
  ctx.fillStyle = ink;
  ctx.font = 'italic 500 40px "Playfair Display", Georgia, serif';
  for (const l of wrap(ctx, spec.body, W - pad * 2 - 144)) {
    if (y > H - pad - 160) break;
    ctx.fillText(l, pad + 72, y);
    y += 56;
  }
  if (spec.footer) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 28px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(spec.footer, pad + 72, H - pad - 72);
  }
  canvas.toBlob((blob) => blob && downloadBlob(blob, filename), 'image/png');
}
