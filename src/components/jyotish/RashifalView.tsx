import React, { useEffect, useMemo, useState } from 'react';
import { Heart, RefreshCw, Sparkles, Sun, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RASHIS, indiaDate, type AstroLanguage } from '../../../shared/jyotish';
import { loadBirthDetails } from '../../astro/birthStore';
import { computeChart } from '../../astro/engine';
import { fetchRashifal, type RashifalResponse } from '../../services/astroClient';
import { Badge, Button, Card, PageContainer, PageHeader } from '../common/UIPrimitives';
import { JyotishNote, LanguageChips } from './JyotishCommon';

const LANG_KEY = 'lovemate_rashifal_lang_v1';

export const RashifalView: React.FC = () => {
  const { setActiveTab } = useApp();
  const mySign = useMemo(() => {
    const saved = loadBirthDetails();
    if (!saved) return null;
    try {
      return computeChart(saved).rashi;
    } catch {
      return null;
    }
  }, []);
  const [sign, setSign] = useState<number>(mySign ?? 0);
  const [language, setLanguage] = useState<AstroLanguage>(() => {
    try {
      const v = localStorage.getItem(LANG_KEY);
      return v === 'english' || v === 'hindi' || v === 'hinglish' ? v : 'hinglish';
    } catch {
      return 'hinglish';
    }
  });
  const [data, setData] = useState<(RashifalResponse & { reload: number }) | null>(null);
  const [reload, setReload] = useState(0);
  // Loading whenever the shown answer is not for the current pick.
  const loading = !data || data.sign !== sign || data.language !== language || data.reload !== reload;

  useEffect(() => {
    let live = true;
    fetchRashifal(sign, language).then((r) => {
      if (live) setData({ ...r, reload });
    });
    return () => {
      live = false;
    };
  }, [sign, language, reload]);

  const changeLanguage = (l: AstroLanguage) => {
    setLanguage(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const r = data?.rashifal;
  const dateLabel = new Date(`${indiaDate()}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <PageContainer>
      <PageHeader icon={<Sun />} title="Daily love rashifal" subtitle={`Today's love horoscope for your Moon sign · ${dateLabel}`} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-6 items-start">
        <Card className="space-y-5 lg:sticky lg:top-24">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-bold text-zinc-900">Pick a rashi</h2>
              {mySign == null ? (
                <button type="button" className="text-[11px] font-semibold text-rose-600 hover:text-rose-700" onClick={() => setActiveTab('my-kundli')}>
                  Find my rashi
                </button>
              ) : (
                sign !== mySign && (
                  <button type="button" className="text-[11px] font-semibold text-rose-600 hover:text-rose-700" onClick={() => setSign(mySign)}>
                    Back to mine
                  </button>
                )
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2" role="radiogroup" aria-label="Rashi">
              {RASHIS.map((s, i) => (
                <button
                  key={s.sanskrit}
                  type="button"
                  role="radio"
                  aria-checked={sign === i}
                  onClick={() => setSign(i)}
                  className={`relative p-2 rounded-2xl border text-center transition-colors ${sign === i ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-zinc-200 hover:border-rose-300 text-zinc-800'}`}
                >
                  <span className="block text-lg leading-none" aria-hidden>
                    {s.symbol}
                  </span>
                  <span className="block text-xs font-bold mt-1">{s.sanskrit}</span>
                  <span className={`block text-[10px] ${sign === i ? 'text-rose-100' : 'text-zinc-500'}`}>{s.english}</span>
                  {mySign === i && <span className={`absolute top-1 right-1.5 text-[9px] font-bold ${sign === i ? 'text-white' : 'text-rose-600'}`}>MINE</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 mb-2">Language</h2>
            <LanguageChips value={language} onChange={changeLanguage} />
          </div>
        </Card>

        <div className="min-w-0">
          <Card className="space-y-5" aria-busy={loading}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">
                  {RASHIS[sign].symbol} {RASHIS[sign].sanskrit} · {RASHIS[sign].hindi} · {RASHIS[sign].english}
                </span>
                <h2 className="text-xl sm:text-2xl font-serif-romance font-bold text-zinc-900 mt-1">{loading || !r ? 'Reading the stars…' : r.headline}</h2>
              </div>
              {data && !loading && <Badge variant={data.source === 'ai' ? 'rose' : 'zinc'}>{data.source === 'ai' ? "Today's AI rashifal" : 'Offline rashifal'}</Badge>}
            </div>
            {loading || !r ? (
              <div className="space-y-3">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="h-4 bg-zinc-100 rounded-lg shimmer-loading" style={{ width: `${90 - k * 15}%` }} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <p className="text-sm text-zinc-700 leading-relaxed">{r.overview}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <h3 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" /> If you are single
                    </h3>
                    <p className="text-sm text-zinc-700 mt-1 leading-relaxed">{r.forSingles}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                    <h3 className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> If you are in a relationship
                    </h3>
                    <p className="text-sm text-zinc-700 mt-1 leading-relaxed">{r.forCouples}</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" /> Small step for today
                  </h3>
                  <p className="text-sm text-zinc-700 mt-1">{r.tip}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
                  <span className="px-3 py-1.5 rounded-full bg-white border border-zinc-200">
                    Lucky colour: <b className="text-zinc-900">{r.luckyColor}</b>
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white border border-zinc-200">
                    Lucky number: <b className="text-zinc-900">{r.luckyNumber}</b>
                  </span>
                </div>
                {data?.source === 'offline' && (
                  <Button size="sm" variant="ghost" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => setReload((n) => n + 1)}>
                    Try for today&apos;s AI rashifal
                  </Button>
                )}
              </div>
            )}
            <JyotishNote />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
