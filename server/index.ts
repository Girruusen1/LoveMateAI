/**
 * Production server: serves the built app from ./dist and the GenAI API under /api/ai.
 *   npm run build && npm start
 * Requires Node 22.6+ (runs TypeScript directly via type stripping).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { handleGenAI } from './genai/handler.ts';
import { isConfigured, modelFor, providerChain } from './genai/config.ts';

const DIST = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 8787);
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

async function serveStatic(pathname: string): Promise<{ body: Buffer; type: string } | null> {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(DIST, safe);
  if (!file.startsWith(DIST)) return null;
  try {
    const s = await stat(file);
    if (s.isFile()) return { body: await readFile(file), type: TYPES[extname(file)] ?? 'application/octet-stream' };
  } catch {
    /* not found */
  }
  return null;
}

createServer(async (req, res) => {
  try {
    if (await handleGenAI(req, res)) return;
    const url = new URL(req.url ?? '/', 'http://localhost');
    const asset = (await serveStatic(url.pathname)) ?? (await serveStatic('/index.html')); // SPA fallback
    if (!asset) {
      res.statusCode = 404;
      res.end('Not found - run "npm run build" first.');
      return;
    }
    res.setHeader('Content-Type', asset.type);
    if (url.pathname.startsWith('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(asset.body);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Server error');
  }
}).listen(PORT, () => {
  console.log(`LoveMate running on http://localhost:${PORT}`);
  console.log(isConfigured() ? `GenAI providers (in failover order): ${providerChain().map((id) => `${id} (${modelFor(id)})`).join(' -> ')}` : 'GenAI disabled (set GROQ_API_KEY and/or OPENROUTER_API_KEY for free AI); the app runs in demo mode.');
});
