import React, { useState } from 'react';
import { Check, Copy, Download, Heart, Share2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import { downloadCardPng } from '../../utils/download';

type ShareType = 'compatibility' | 'confession' | 'reply' | 'game' | 'card' | 'story' | 'wrapped' | 'scrapbook';

interface ShareSummary {
  title: string;
  subtitle?: string;
  body: string;
  footer: string;
  colors: [string, string];
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' && v.trim() ? v : fallback);

/** Build a plain-text summary of the shared item, used for the PNG card, the copy action and native share. */
function buildSummary(type: ShareType, data: any): ShareSummary {
  const d = data || {};
  switch (type) {
    case 'compatibility':
      return {
        title: `${str(d.yourName, 'You')} × ${str(d.theirName, 'Them')}: ${Number(d.overallScore) || 0}%`,
        subtitle: str(d.verdict),
        body: str(d.aiAnalysis, 'Compatibility report generated with LoveMate.'),
        footer: 'Compatibility report · via LoveMate',
        colors: ['#fff1f2', '#fce7f3'],
      };
    case 'confession':
      return {
        title: `A confession for ${str(d.recipient, 'someone special')}`,
        subtitle: d.tone ? `${d.tone} tone` : undefined,
        body: str(d.content, ''),
        footer: 'Confession · via LoveMate',
        colors: ['#fff1f2', '#ffe4e6'],
      };
    case 'reply': {
      const first = Array.isArray(d.replies) ? d.replies[0] : null;
      const text = str(d.text) || str(first?.text) || str(d.reply);
      const vibe = str(d.vibe) || str(first?.vibe) || str(d.intent);
      return {
        title: 'Reply suggestion',
        subtitle: [d.inputMessage ? `Replying to: "${d.inputMessage}"` : '', vibe].filter(Boolean).join(' · ') || undefined,
        body: text,
        footer: 'Reply · via LoveMate',
        colors: ['#eff6ff', '#e0e7ff'],
      };
    }
    case 'game':
      return {
        title: str(d.yourName, 'Couple Game Card'),
        subtitle: d.category ? `${d.category}` : undefined,
        body: str(d.verdict) || str(d.question),
        footer: 'Couple game · via LoveMate',
        colors: ['#fdf4ff', '#fae8ff'],
      };
    case 'card': {
      const themeColors: Record<string, [string, string]> = {
        'soft-rose': ['#fff1f2', '#fce7f3'],
        'lavender-dream': ['#faf5ff', '#eef2ff'],
        'golden-sunset': ['#fffbeb', '#fff7ed'],
        'midnight-romance': ['#27272a', '#09090b'],
        'minimal-ivory': ['#FAF9F8', '#fafaf9'],
      };
      const recipient = str(d.recipientName) || str(d.yourName, 'you');
      const quote = str(d.quote);
      const note = str(d.personalNote) || str(d.verdict);
      return {
        title: `${str(d.type, 'A love card')} for ${recipient}`,
        subtitle: quote ? `"${quote}"` : undefined,
        body: note,
        footer: 'Love card · via LoveMate',
        colors: themeColors[str(d.theme)] || themeColors['soft-rose'],
      };
    }
    case 'story': {
      const chapters = Array.isArray(d.episodes) ? d.episodes : Array.isArray(d.chapters) ? d.chapters : [];
      const first = chapters[0];
      const names = str(d.partners) || [str(d.protagonistName), str(d.partnerName)].filter(Boolean).join(' & ');
      return {
        title: str(d.title) || (names ? `The story of ${names}` : 'Our love story'),
        subtitle: first?.title ? `Chapter 1 · ${first.title}` : chapters.length ? `${chapters.length} chapters` : undefined,
        body: str(first?.content) || str(d.howWeMet) || 'A story written with LoveMate.',
        footer: 'Love story · via LoveMate',
        colors: ['#fff7ed', '#fef3c7'],
      };
    }
    case 'wrapped':
      return {
        title: `LoveMate Wrapped ${d.year ?? new Date().getFullYear()}${d.monthName ? ` · ${d.monthName}` : ''}`,
        subtitle: str(d.yearInOneSentence),
        body: [
          d.mostDiscussedTopic ? `Most discussed: ${d.mostDiscussedTopic}` : '',
          d.mostUsedFeature ? `Most used: ${d.mostUsedFeature}` : '',
          d.favoriteActivity ? `Favourite activity: ${d.favoriteActivity}` : '',
          Number.isFinite(d.challengesCompleted) ? `Challenges completed: ${d.challengesCompleted}` : '',
          Number.isFinite(d.memoriesCreated) ? `Memories created: ${d.memoriesCreated}` : '',
          Number.isFinite(d.daysConnected) ? `Days connected: ${d.daysConnected}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        footer: 'Wrapped · via LoveMate',
        colors: ['#f5f3ff', '#fce7f3'],
      };
    case 'scrapbook':
      return {
        title: str(d.title, 'A shared memory'),
        subtitle: [str(d.date), str(d.location)].filter(Boolean).join(' · ') || undefined,
        body: str(d.caption) || str(d.generatedCaptions?.romantic) || '',
        footer: 'Scrapbook memory · via LoveMate',
        colors: ['#ecfdf5', '#fef3c7'],
      };
    default:
      return { title: 'Shared from LoveMate', body: '', footer: 'via LoveMate', colors: ['#fff1f2', '#ffe4e6'] };
  }
}

function toShareText(s: ShareSummary): string {
  return [s.title, s.subtitle, '', s.body, '', 'via LoveMate'].filter((l) => l !== undefined).join('\n').trim();
}

export const ShareModal: React.FC = () => {
  const { shareModalItem, closeShareModal, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!shareModalItem) return null;

  const { type, data } = shareModalItem;
  const d = data || {};
  const summary = buildSummary(type, d);
  const shareText = toShareText(summary);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyText = async () => {
    const ok = await copyText(shareText);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopied(true);
    showToast('Result copied as text! 📋', 'love');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    downloadCardPng(
      { title: summary.title, subtitle: summary.subtitle, body: summary.body, footer: summary.footer, colors: summary.colors },
      `lovemate-${type}-${Date.now()}.png`
    );
    showToast('Card image downloaded 📸', 'success');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: summary.title, text: shareText });
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') showToast("Couldn't open the share sheet.", 'info');
    }
  };

  const pct = (v: unknown) => (Number.isFinite(Number(v)) ? `${Number(v)}%` : '—');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden relative">
        {/* Close button */}
        <button
          onClick={closeShareModal}
          aria-label="Close share dialog"
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-5 pb-3 text-center border-b border-zinc-100">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold mb-1">
            <Share2 className="w-3 h-3" /> Social Story Card
          </div>
          <h3 className="font-bold text-base text-zinc-900">Share Your Result</h3>
          <p className="text-[11px] text-zinc-500">Instagram Story & WhatsApp ready layout</p>
        </div>

        {/* Card Preview Container */}
        <div className="p-6 bg-zinc-100/70 flex justify-center">
          <div
            id="shareable-result-card"
            className="w-full max-w-[320px] bg-gradient-to-br from-rose-50 via-white to-pink-50/70 rounded-3xl p-6 shadow-xl border border-rose-100 text-zinc-900 relative overflow-hidden"
          >
            {/* Top brand watermark */}
            <div className="flex items-center justify-between pb-4 border-b border-rose-100/80 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center text-white">
                  <Heart className="w-3.5 h-3.5 fill-white" />
                </div>
                <span className="font-bold text-xs tracking-tight text-zinc-900">LoveMate AI</span>
              </div>
              <span className="text-[9px] font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {summary.footer.split(' · ')[0]}
              </span>
            </div>

            {/* Content according to type */}
            {type === 'compatibility' && (
              <div className="text-center space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-800">
                    {d.yourName} <span className="text-rose-500">×</span> {d.theirName}
                  </h4>
                  <div className="my-3">
                    <span className="text-4xl font-bold text-rose-600 tracking-tight">{pct(d.overallScore)}</span>
                    <p className="text-[11px] font-bold text-zinc-700 mt-0.5">{d.verdict}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-rose-100/60 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">🔥 Chemistry</span>
                    <span className="font-bold text-zinc-900">{pct(d.breakdown?.chemistry)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">💬 Communication</span>
                    <span className="font-bold text-zinc-900">{pct(d.breakdown?.communication)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">🧠 Personality</span>
                    <span className="font-bold text-zinc-900">{pct(d.breakdown?.personality)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">🥰 Emotional Bond</span>
                    <span className="font-bold text-zinc-900">{pct(d.breakdown?.emotionalConnection)}</span>
                  </div>
                </div>

                {d.aiAnalysis && (
                  <p className="text-[11px] text-zinc-600 italic leading-relaxed line-clamp-3">"{d.aiAnalysis}"</p>
                )}
              </div>
            )}

            {type === 'confession' && (
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-2xl">💌</span>
                  <h4 className="text-xs font-bold text-zinc-700 mt-1">Confession for {d.recipient}</h4>
                  {d.tone && (
                    <span className="text-[10px] text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-full font-semibold">
                      {d.tone} Tone
                    </span>
                  )}
                </div>
                <div className="bg-white/95 p-4 rounded-2xl border border-rose-100 text-xs text-zinc-800 leading-relaxed font-serif italic text-center">
                  "{d.content}"
                </div>
              </div>
            )}

            {type === 'reply' && (
              <div className="space-y-3">
                {summary.subtitle && <p className="text-[10px] text-zinc-500 text-center line-clamp-2">{summary.subtitle}</p>}
                <div className="bg-white/95 p-4 rounded-2xl border border-rose-100 text-xs text-zinc-800 leading-relaxed text-center">
                  {summary.body || 'No reply text provided.'}
                </div>
              </div>
            )}

            {type === 'game' && (
              <div className="space-y-3 text-center">
                <span className="text-2xl">🎲</span>
                <h4 className="text-xs font-bold text-zinc-700">{summary.title}</h4>
                <div className="bg-white/95 p-4 rounded-2xl border border-rose-100 text-sm font-semibold text-zinc-900 leading-relaxed">
                  {summary.body}
                </div>
              </div>
            )}

            {type === 'card' && (
              <div className="space-y-3 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">{str(d.type, 'A love card')} for</span>
                <h4 className="text-lg font-bold text-zinc-900">{str(d.recipientName) || str(d.yourName, 'you')}</h4>
                {d.quote && (
                  <blockquote className="font-serif italic text-xs text-zinc-700 border-y border-rose-100 py-2">"{d.quote}"</blockquote>
                )}
                <p className="text-xs text-zinc-700 leading-relaxed">{summary.body}</p>
              </div>
            )}

            {type === 'story' && (
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-2xl">📖</span>
                  <h4 className="text-sm font-bold text-zinc-800 mt-1">{summary.title}</h4>
                  {summary.subtitle && <p className="text-[10px] text-zinc-500">{summary.subtitle}</p>}
                </div>
                <p className="bg-white/95 p-4 rounded-2xl border border-rose-100 text-xs text-zinc-800 leading-relaxed font-serif line-clamp-6">
                  {summary.body}
                </p>
              </div>
            )}

            {type === 'wrapped' && (
              <div className="space-y-3">
                <div className="text-center">
                  <h4 className="text-sm font-bold text-zinc-800">{summary.title}</h4>
                  {summary.subtitle && <p className="text-[11px] text-zinc-600 italic mt-1">"{summary.subtitle}"</p>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-white/90 rounded-xl p-2 border border-rose-100/60">
                    <span className="block text-lg font-bold text-rose-600">{d.challengesCompleted ?? 0}</span>
                    Challenges
                  </div>
                  <div className="bg-white/90 rounded-xl p-2 border border-rose-100/60">
                    <span className="block text-lg font-bold text-rose-600">{d.memoriesCreated ?? 0}</span>
                    Memories
                  </div>
                  <div className="bg-white/90 rounded-xl p-2 border border-rose-100/60">
                    <span className="block text-lg font-bold text-rose-600">{d.daysConnected ?? 0}</span>
                    Days
                  </div>
                </div>
                <div className="text-[11px] text-zinc-700 space-y-0.5">
                  {d.mostDiscussedTopic && <p>Most discussed: <b>{d.mostDiscussedTopic}</b></p>}
                  {d.mostUsedFeature && <p>Most used: <b>{d.mostUsedFeature}</b></p>}
                  {d.favoriteActivity && <p>Favourite activity: <b>{d.favoriteActivity}</b></p>}
                </div>
              </div>
            )}

            {type === 'scrapbook' && (
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-2xl">📸</span>
                  <h4 className="text-sm font-bold text-zinc-800 mt-1">{summary.title}</h4>
                  {summary.subtitle && <p className="text-[10px] text-zinc-500">{summary.subtitle}</p>}
                </div>
                {summary.body && (
                  <p className="bg-white/95 p-4 rounded-2xl border border-rose-100 text-xs text-zinc-800 leading-relaxed italic text-center">
                    {summary.body}
                  </p>
                )}
                {Array.isArray(d.tags) && d.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {d.tags.slice(0, 5).map((t: string) => (
                      <span key={t} className="text-[9px] bg-rose-100/70 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Card Footer Call To Action */}
            <div className="mt-5 pt-3 border-t border-rose-100 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full shadow-xs">
                Made with LoveMate ❤️
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white flex items-center justify-between gap-3">
          <button
            onClick={handleCopyText}
            className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
            <span>{copied ? 'Copied!' : 'Copy text'}</span>
          </button>

          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4 text-zinc-500" />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-rose-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};
