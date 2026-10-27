import React, { useState } from 'react';
import { AlertTriangle, HeartHandshake, Lock, MessageCircle, Sparkles, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RASHIS, type AstroLanguage } from '../../../shared/jyotish';
import { NAKSHATRAS } from '../../astro/constants';
import { computeChart, type Chart } from '../../astro/engine';
import { describeManglik, matchCharts, type ChartMatch, type GunaMilanResult } from '../../astro/gunaMilan';
import { loadBirthDetails } from '../../astro/birthStore';
import { AIService } from '../../services/ai';
import type { KundliExplanation } from '../../services/aiContentAstro';
import { isAiLimitError } from '../../utils/aiErrors';
import { PLANS } from '../../utils/plans';
import { Badge, Button, Card, PageContainer, PageHeader, ToolLayout } from '../common/UIPrimitives';
import { ShareCardButton } from '../common/ShareCardButton';
import { BirthDetailsForm, JyotishNote, LanguageChips } from './JyotishCommon';
import { detailsFromDraft, draftFromDetails, emptyDraft, type BirthDraft } from './birthDraft';
import { kundliExplainInput } from './matchInput';

const TONE: Record<GunaMilanResult['tone'], string> = {
  excellent: 'bg-emerald-600',
  good: 'bg-rose-600',
  average: 'bg-amber-500',
  low: 'bg-zinc-500',
};

export const GunaScore: React.FC<{ guna: GunaMilanResult; names: [string, string] }> = ({ guna, names }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="text-center sm:text-left min-w-0">
      <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">Guna Milan</span>
      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-0.5 break-words">
        {names[0]} <span className="text-rose-500">×</span> {names[1]}
      </h2>
      <p className="text-sm text-zinc-600 mt-1">{guna.label}</p>
      <p className="text-xs text-zinc-500 mt-0.5">Traditionally, 18 or more out of 36 is considered a good match.</p>
    </div>
    <div className={`w-24 h-24 rounded-full text-white flex flex-col items-center justify-center shadow-md shrink-0 ${TONE[guna.tone]}`}>
      <span className="text-2xl font-bold leading-none">{guna.total}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider mt-1">of 36</span>
    </div>
  </div>
);

export const KootaTable: React.FC<{ guna: GunaMilanResult; compact?: boolean }> = ({ guna, compact }) => (
  <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-100 overflow-hidden">
    {guna.kootas.map((k) => (
      <div key={k.key} className="p-3 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm font-bold text-zinc-900">{k.name}</span>
            <span className="text-xs text-zinc-500"> · {k.meaning}</span>
          </div>
          <span className={`text-sm font-bold shrink-0 ${k.points === k.max ? 'text-emerald-600' : k.points === 0 ? 'text-zinc-500' : 'text-rose-600'}`}>
            {k.points}/{k.max}
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(k.points / k.max) * 100}%` }} />
        </div>
        {!compact && (
          <p className="text-xs text-zinc-600 mt-1.5">
            <span className="text-zinc-400">Boy {k.boy} · Girl {k.girl}.</span> {k.detail}
            {k.cancellation && <span className="block text-emerald-700 mt-0.5">{k.cancellation}</span>}
          </p>
        )}
      </div>
    ))}
  </div>
);

const PersonFacts: React.FC<{ label: string; chart: Chart }> = ({ label, chart }) => (
  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1.5 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-bold text-zinc-900 truncate">{chart.input.name || label}</span>
      <Badge variant={chart.manglik.isManglik ? 'amber' : 'emerald'}>{chart.manglik.isManglik ? 'Manglik' : 'Not Manglik'}</Badge>
    </div>
    <p className="text-xs text-zinc-600">
      {RASHIS[chart.rashi].sanskrit} rashi · {NAKSHATRAS[chart.nakshatra].name} pada {chart.pada}
    </p>
    <p className="text-[11px] text-zinc-500 leading-relaxed">{describeManglik(chart.manglik)}</p>
  </div>
);

export const KundliMilanView: React.FC = () => {
  const { hasPlan, showToast, setProModalOpen } = useApp();
  const saved = loadBirthDetails();
  const [boyDraft, setBoyDraft] = useState<BirthDraft>(() => emptyDraft());
  const [girlDraft, setGirlDraft] = useState<BirthDraft>(() => emptyDraft());
  const [result, setResult] = useState<{ boy: Chart; girl: Chart; match: ChartMatch } | null>(null);
  const [language, setLanguage] = useState<AstroLanguage>('hinglish');
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<KundliExplanation | null>(null);
  const isPlus = hasPlan('plus');

  const handleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const b = detailsFromDraft(boyDraft, "Boy's details");
    const g = detailsFromDraft(girlDraft, "Girl's details");
    const error = b.error ?? g.error;
    if (!b.details || !g.details) {
      showToast(error ?? 'Please check both birth details.', 'info');
      return;
    }
    try {
      const boy = computeChart(b.details);
      const girl = computeChart(g.details);
      setResult({ boy, girl, match: matchCharts(boy, girl) });
      setExplanation(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not calculate the charts.', 'info');
    }
  };

  const handleExplain = async () => {
    if (!result) return;
    if (!isPlus) {
      setProModalOpen(true);
      return;
    }
    setExplaining(true);
    try {
      setExplanation(await AIService.explainKundliMatch(kundliExplainInput(result.boy, result.girl, result.match, language)));
    } catch (err) {
      if (!isAiLimitError(err)) showToast('Could not write the explanation right now. Please try again.', 'info');
    } finally {
      setExplaining(false);
    }
  };

  const savedButton = (set: (d: BirthDraft) => void) => saved && (
    <button type="button" className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1" onClick={() => set(draftFromDetails(saved))}>
      <UserRound className="w-3 h-3" /> Use my saved details
    </button>
  );

  const form = (
    <Card>
      <form onSubmit={handleMatch} className="space-y-5">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-zinc-900">Boy</h2>
            {savedButton(setBoyDraft)}
          </div>
          <BirthDetailsForm value={boyDraft} onChange={setBoyDraft} namePlaceholder="e.g. Rahul" />
        </section>
        <div className="border-t border-zinc-100" />
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-zinc-900">Girl</h2>
            {savedButton(setGirlDraft)}
          </div>
          <BirthDetailsForm value={girlDraft} onChange={setGirlDraft} namePlaceholder="e.g. Priya" />
        </section>
        <p className="text-[11px] text-zinc-500">Guna Milan tables are traditionally read with a boy and a girl. For same-gender couples, either order works.</p>
        <Button type="submit" size="lg" className="w-full" icon={<HeartHandshake className="w-4 h-4" />}>
          Match kundlis
        </Button>
        <JyotishNote />
      </form>
    </Card>
  );

  const view = result && (
    <div className="space-y-4">
      <Card className="space-y-5 animate-in fade-in duration-300">
        <GunaScore guna={result.match.guna} names={[result.boy.input.name || 'Boy', result.girl.input.name || 'Girl']} />
        {/* Share card: names and scores only, never birth details */}
        <div className="flex justify-end">
          <ShareCardButton
            fileName="lovemate-kundli-milan"
            spec={{
              eyebrow: 'Kundli Milan',
              names: [result.boy.input.name || 'Boy', result.girl.input.name || 'Girl'],
              hero: `${result.match.guna.total}/36`,
              heroLabel: 'gunas',
              headline: result.match.guna.label,
              lines: [...result.match.guna.kootas]
                .sort((a, b) => b.points / b.max - a.points / a.max)
                .slice(0, 3)
                .map((k) => `${k.name}: ${k.points}/${k.max}`),
              footnote: 'Jyotish is shared as cultural guidance, not a prediction.',
            }}
          />
        </div>
        {result.match.caveats.length > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            {result.match.caveats.map((c) => (
              <p key={c} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
                <span>{c}</span>
              </p>
            ))}
          </div>
        )}
        <KootaTable guna={result.match.guna} />
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900">Manglik (Kuja) dosha</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PersonFacts label="Boy" chart={result.boy} />
            <PersonFacts label="Girl" chart={result.girl} />
          </div>
          <p className={`text-xs p-3 rounded-2xl border ${result.match.manglik.status === 'one' ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'}`}>
            {result.match.manglik.summary}
          </p>
        </div>
        <JyotishNote />
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-600" /> Explain it in simple words
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">LoveMate explains what these points mean for you two. The numbers above stay exactly the same.</p>
          </div>
          {!isPlus && <Badge variant="purple">Plus</Badge>}
        </div>
        {isPlus ? (
          <div className="flex flex-wrap items-center gap-3">
            <LanguageChips value={language} onChange={setLanguage} />
            <Button size="sm" loading={explaining} onClick={handleExplain} icon={<MessageCircle className="w-3.5 h-3.5" />}>
              {explanation ? 'Explain again' : 'Explain'}
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-700 flex-1">
              The detailed Kundli Milan report, in English, Hinglish or Hindi, is part of LoveMate Plus (₹{PLANS.plus.monthlyINR}/month). Your score and all 8 kootas stay free.
            </p>
            <Button size="sm" variant="premium" onClick={() => setProModalOpen(true)}>
              See plans
            </Button>
          </div>
        )}
        {explanation && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <h4 className="text-base font-bold text-zinc-900">{explanation.headline}</h4>
            <p className="text-sm text-zinc-700 leading-relaxed">{explanation.summary}</p>
            {explanation.strengths.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">What looks supportive</h5>
                <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
                  {explanation.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {explanation.growthAreas.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Worth talking about</h5>
                <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
                  {explanation.growthAreas.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">Manglik: </span>
              {explanation.manglikNote}
            </p>
            {explanation.conversationStarters.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                <h5 className="text-xs font-bold text-rose-800 mb-1">Ask each other</h5>
                <ul className="text-sm text-zinc-700 space-y-1">
                  {explanation.conversationStarters.map((s) => (
                    <li key={s}>“{s}”</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-zinc-500">{explanation.reminder}</p>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        icon={<HeartHandshake />}
        title="Kundli Milan"
        subtitle={`Ashtakoota Guna Milan out of 36 and Manglik check from real birth charts. Calculated on your device, free.`}
      />
      <ToolLayout
        form={form}
        result={view}
        placeholder={{ icon: <HeartHandshake />, title: 'No match yet', description: 'Enter both birth details to see the Guna Milan score, all 8 kootas and the Manglik check.' }}
      />
    </PageContainer>
  );
};
