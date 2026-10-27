import React, { useState } from 'react';
import { Bookmark, Brain, Calculator, Flame, Heart, HelpCircle, MessageCircle, Moon, Share2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AstroLanguage } from '../../../shared/jyotish';
import { computeChart } from '../../astro/engine';
import { matchCharts, type ChartMatch } from '../../astro/gunaMilan';
import { LOVE_QUIZ, funLoveScore, funVerdict, type QuizAnswers } from '../../astro/loveScore';
import { loadBirthDetails } from '../../astro/birthStore';
import { AIService } from '../../services/ai';
import { offlineCompatibility, type CompatibilityInput } from '../../services/aiContentAstro';
import { CompatibilityResult } from '../../types';
import { ShareCardButton } from '../common/ShareCardButton';
import { SavedCompatibility } from '../common/SavedItems';
import { isAiLimitError } from '../../utils/aiErrors';
import { Button, Card, Chip, FieldLabel, Input, PageContainer, PageHeader, ToolLayout } from '../common/UIPrimitives';
import { BirthDetailsForm, JyotishNote, LanguageChips } from '../jyotish/JyotishCommon';
import { detailsFromDraft, draftFromDetails, emptyDraft, type BirthDraft } from '../jyotish/birthDraft';
import { GunaScore, KootaTable } from '../jyotish/KundliMilanView';
import { gunaBreakdown, kootaSummaries } from '../jyotish/matchInput';

type Mode = 'fun' | 'jyotish';

export const LoveCalculatorView: React.FC = () => {
  const { user, saveCompatibility, openShareModal, setActiveTab, triggerConfetti, showToast } = useApp();
  const saved = loadBirthDetails();

  const [mode, setMode] = useState<Mode>('fun');
  const [yourName, setYourName] = useState(user?.name || '');
  const [theirName, setTheirName] = useState('');
  const [birthdaySelf, setBirthdaySelf] = useState(saved?.date ?? '');
  const [birthdayPartner, setBirthdayPartner] = useState('');
  const [relationshipType, setRelationshipType] = useState('Crush');
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [language, setLanguage] = useState<AstroLanguage>('english');
  const [boyDraft, setBoyDraft] = useState<BirthDraft>(() => emptyDraft());
  const [girlDraft, setGirlDraft] = useState<BirthDraft>(() => emptyDraft());
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [match, setMatch] = useState<ChartMatch | null>(null);

  const relationshipTypes = ['Crush', 'Talking Stage', 'Dating', 'Long-Distance', 'Complicated'];

  const buildInput = (): CompatibilityInput | string => {
    const answerList = LOVE_QUIZ.filter((q) => (answers[q.id] ?? -1) >= 0).map((q) => ({ question: q.label, answer: q.options[answers[q.id]] }));
    if (mode === 'jyotish') {
      const b = detailsFromDraft(boyDraft, "Boy's details");
      const g = detailsFromDraft(girlDraft, "Girl's details");
      if (!b.details || !g.details) return b.error ?? g.error ?? 'Please fill both birth details.';
      if (!b.details.name || !g.details.name) return 'Please enter both names.';
      const boy = computeChart(b.details);
      const girl = computeChart(g.details);
      const m = matchCharts(boy, girl);
      setMatch(m);
      return {
        yourName: b.details.name,
        theirName: g.details.name,
        relationshipType,
        language,
        mode,
        birthdaySelf: b.details.date,
        birthdayPartner: g.details.date,
        answers: answerList,
        overallScore: Math.round((m.guna.total / 36) * 100),
        breakdown: gunaBreakdown(m.guna),
        guna: { total: m.guna.total, label: m.guna.label, kootas: kootaSummaries(m.guna), manglikSummary: m.manglik.summary },
        verdict: m.guna.label,
      };
    }
    if (!yourName.trim() || !theirName.trim()) return 'Please enter both names to calculate compatibility!';
    const s = funLoveScore({ yourName, theirName, birthdaySelf, birthdayPartner, answers });
    setMatch(null);
    return {
      yourName: yourName.trim(),
      theirName: theirName.trim(),
      relationshipType,
      language,
      mode,
      birthdaySelf: birthdaySelf || undefined,
      birthdayPartner: birthdayPartner || undefined,
      answers: answerList,
      overallScore: s.overallScore,
      breakdown: s.breakdown,
      signNote: s.signNote,
      verdict: funVerdict(s.overallScore),
    };
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    let input: CompatibilityInput | string;
    try {
      input = buildInput();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Please check the details.', 'info');
      return;
    }
    if (typeof input === 'string') {
      showToast(input, 'info');
      return;
    }
    setIsCalculating(true);
    try {
      setResult(await AIService.calculateCompatibility(input));
      triggerConfetti();
    } catch (err) {
      // The score never depends on the AI: show it with offline words if the AI is unavailable.
      if (!isAiLimitError(err)) showToast('The AI is busy, so here is your score with a quick summary.', 'info');
      setResult({
        id: `compat_${Date.now()}`,
        yourName: input.yourName,
        theirName: input.theirName,
        birthdaySelf: input.birthdaySelf,
        birthdayPartner: input.birthdayPartner,
        relationshipType: input.relationshipType,
        overallScore: input.overallScore,
        breakdown: input.breakdown,
        mode: input.mode,
        gunaScore: input.guna?.total,
        ...offlineCompatibility(input),
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const breakdownRows = result
    ? [
        { label: 'Chemistry & attraction', icon: <Flame />, value: result.breakdown.chemistry },
        { label: 'Communication style', icon: <MessageCircle />, value: result.breakdown.communication },
        { label: 'Personality fit', icon: <Brain />, value: result.breakdown.personality },
        { label: 'Emotional connection', icon: <Heart />, value: result.breakdown.emotionalConnection },
      ]
    : [];

  const quiz = (
    <div className="space-y-3">
      <FieldLabel hint="optional, makes the score real">Quick questions</FieldLabel>
      {LOVE_QUIZ.map((q) => (
        <div key={q.id}>
          <p className="text-xs text-zinc-700 mb-1.5">{q.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((o, i) => (
              <Chip key={o} selected={answers[q.id] === i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: a[q.id] === i ? -1 : i }))}>
                {o}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const form = (
    <Card>
      <form onSubmit={handleCalculate} className="space-y-5">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-zinc-100" role="tablist" aria-label="Calculator mode">
          {(
            [
              ['fun', 'Fun mode', <Sparkles key="f" className="w-3.5 h-3.5" />],
              ['jyotish', 'Jyotish mode', <Moon key="j" className="w-3.5 h-3.5" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => {
                setMode(id);
                setResult(null);
              }}
              className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${mode === id ? 'bg-white text-rose-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {mode === 'fun' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Your name</FieldLabel>
                <Input type="text" placeholder="Your name" value={yourName} onChange={(e) => setYourName(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Their name</FieldLabel>
                <Input type="text" placeholder="Their name" value={theirName} onChange={(e) => setTheirName(e.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel hint="optional, for sun signs">Birthdays</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" aria-label="Your birthday" value={birthdaySelf} onChange={(e) => setBirthdaySelf(e.target.value)} />
                <Input type="date" aria-label="Their birthday" value={birthdayPartner} onChange={(e) => setBirthdayPartner(e.target.value)} />
              </div>
            </div>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900">Boy</h2>
                {saved && (
                  <button type="button" className="text-[11px] font-semibold text-rose-600" onClick={() => setBoyDraft(draftFromDetails(saved))}>
                    Use my saved details
                  </button>
                )}
              </div>
              <BirthDetailsForm value={boyDraft} onChange={setBoyDraft} namePlaceholder="e.g. Rahul" />
            </section>
            <section className="space-y-3 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900">Girl</h2>
                {saved && (
                  <button type="button" className="text-[11px] font-semibold text-rose-600" onClick={() => setGirlDraft(draftFromDetails(saved))}>
                    Use my saved details
                  </button>
                )}
              </div>
              <BirthDetailsForm value={girlDraft} onChange={setGirlDraft} namePlaceholder="e.g. Priya" />
            </section>
          </>
        )}

        <div>
          <FieldLabel>Relationship stage</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {relationshipTypes.map((type) => (
              <Chip key={type} selected={relationshipType === type} onClick={() => setRelationshipType(type)}>
                {type}
              </Chip>
            ))}
          </div>
        </div>

        {mode === 'fun' && quiz}

        <div>
          <FieldLabel>Write the result in</FieldLabel>
          <LanguageChips value={language} onChange={setLanguage} />
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isCalculating} icon={<Sparkles className="w-4 h-4" />}>
          Check compatibility
        </Button>
        {mode === 'jyotish' && <JyotishNote />}
      </form>
    </Card>
  );

  const resultView = result ? (
    <div className="space-y-4">
      <Card className="space-y-6 animate-in fade-in duration-300">
        {result.mode === 'jyotish' && match ? (
          <div className="pb-6 border-b border-zinc-100">
            <GunaScore guna={match.guna} names={[result.yourName, result.theirName]} />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-100">
            <div className="text-center sm:text-left min-w-0">
              <span className="text-xs uppercase font-bold text-rose-600 tracking-wider">Overall compatibility</span>
              <h2 className="text-2xl font-bold text-zinc-900 mt-0.5 break-words">
                {result.yourName} <span className="text-rose-500">×</span> {result.theirName}
              </h2>
              <p className="text-sm text-zinc-600 mt-1">{result.verdict}</p>
            </div>
            <div className="w-24 h-24 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center shadow-md shadow-rose-200 shrink-0">
              <span className="text-2xl font-bold">{result.overallScore}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Match</span>
            </div>
          </div>
        )}

        {result.mode === 'jyotish' && match ? (
          <>
            <KootaTable guna={match.guna} compact />
            <p className="text-xs text-zinc-600">{match.manglik.summary}</p>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {breakdownRows.map((row) => (
              <div key={row.label} className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                  <span className="inline-flex items-center gap-1.5 text-zinc-700 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-rose-500">
                    {row.icon}
                    {row.label}
                  </span>
                  <span className="text-rose-600 font-bold">{row.value}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${row.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" /> {result.mode === 'jyotish' ? result.verdict : 'Relationship insight'}
          </h4>
          <p className="text-sm text-zinc-700 leading-relaxed">{result.aiAnalysis}</p>
          {result.strengths && result.strengths.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-0.5">
              {result.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {result.tip && (
            <p className="text-sm text-zinc-800">
              <span className="font-semibold">Try this: </span>
              {result.tip}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => saveCompatibility(result)} icon={<Bookmark className="w-3.5 h-3.5" />}>
              Save report
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openShareModal({ type: 'compatibility', data: result })} icon={<Share2 className="w-3.5 h-3.5" />}>
              Share card
            </Button>
            <ShareCardButton
              fileName={`lovemate-love-score-${result.overallScore}`}
              spec={{
                eyebrow: 'Love calculator',
                names: [result.yourName, result.theirName],
                hero: `${result.overallScore}%`,
                heroLabel: 'match',
                headline: result.verdict,
                lines: [
                  `Chemistry ${result.breakdown.chemistry}%`,
                  `Communication ${result.breakdown.communication}%`,
                  `Emotional connection ${result.breakdown.emotionalConnection}%`,
                ],
                footnote: 'For fun and conversation. Real love runs on effort and empathy.',
              }}
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => setActiveTab(result.mode === 'jyotish' ? 'kundli' : 'chat')} icon={<MessageCircle className="w-3.5 h-3.5" />}>
            {result.mode === 'jyotish' ? 'Full Kundli Milan' : 'Talk to AI about this'}
          </Button>
        </div>

        <p className="text-xs text-zinc-500 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {result.mode === 'jyotish'
              ? 'Jyotish is shared as cultural guidance, not a prediction. Real love thrives on effort, empathy and respect.'
              : 'Computed from your answers and sun signs, for fun and conversation. Real love thrives on mutual effort, empathy and respect.'}
          </span>
        </p>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader icon={<Calculator />} title="Love calculator" subtitle="A playful read from your answers and sun signs, or a Jyotish Guna Milan from your birth details." />
      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Calculator />,
          title: 'No score yet',
          description: mode === 'fun' ? 'Enter both names, answer a few quick questions and see your compatibility.' : 'Enter both birth details for a Guna Milan based score.',
        }}
      />

      <SavedCompatibility />
    </PageContainer>
  );
};
