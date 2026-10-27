import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarHeart,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  Heart,
  HeartHandshake,
  Lock,
  Mic,
  Moon,
  Send,
  Smile,
  Sparkles,
  Square,
  Unlock,
  UserPlus,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WOULD_YOU_RATHER_CARDS } from '../../data/seedData';
import { useT } from '../../i18n';
import { copyText } from '../../utils/clipboard';
import { situationInfo } from '../../utils/situations';
import { LandingPage } from './LandingPage';

/* ---------------------------------------------------------------------------
   Daily content: rotates by calendar day, so "today's" items really change.
   --------------------------------------------------------------------------- */
type Lang = 'english' | 'hinglish';

const QUESTIONS: Record<Lang, string>[] = [
  { english: 'What is one small thing I do without noticing that makes you feel loved or safe?', hinglish: 'Meri kaunsi choti si aadat bina soche tujhe loved feel karwati hai?' },
  { english: 'Which ordinary day from our first month would you happily live again?', hinglish: 'Humare pehle mahine ka kaunsa normal sa din tu dobara jeena chahega?' },
  { english: "What's something you'd love us to try together this month?", hinglish: 'Is mahine hum dono saath mein kya naya try karein?' },
  { english: 'When do you feel most understood by me?', hinglish: 'Tujhe kab lagta hai ki main tujhe sabse zyada samajhta/samajhti hoon?' },
  { english: 'What made you smile this week that I might not know about?', hinglish: 'Is hafte kis baat pe tu muskuraya/muskurayi jo mujhe shayad pata nahi?' },
  { english: 'What is one worry you would like me to help carry right now?', hinglish: 'Abhi teri kaunsi ek tension hai jo main thodi halki kar sakta/sakti hoon?' },
  { english: "Which song or place instantly reminds you of us, and why?", hinglish: 'Kaunsa gaana ya jagah turant humari yaad dilata hai, aur kyun?' },
];

const TIPS: { tip: Record<Lang, string>; why: string }[] = [
  { tip: { english: 'When emotions are high, wait 90 seconds before replying.', hinglish: 'Gusse mein instant reply mat bhej. 90 second ruk ja.' }, why: 'Strong emotions peak and fade in about a minute and a half. Replying after the wave keeps the connection intact.' },
  { tip: { english: 'Ask one open question today and just listen to the answer.', hinglish: 'Aaj ek open question pooch aur bas dhyaan se sun.' }, why: 'Feeling heard builds closeness faster than advice does.' },
  { tip: { english: 'Name one specific thing you appreciated about them today.', hinglish: 'Aaj unki ek specific baat bata jo tujhe achhi lagi.' }, why: 'Specific appreciation lands deeper than a general "you are great".' },
  { tip: { english: 'Put phones away for the first 10 minutes when you meet.', hinglish: 'Milte hi pehle 10 minute phone side mein rakh de.' }, why: 'The first minutes together set the tone for the rest of the time.' },
  { tip: { english: 'Start a hard talk with "I feel", not "You always".', hinglish: '"Tu hamesha" ki jagah "Mujhe lagta hai" se baat shuru kar.' }, why: 'Blame invites defence. Feelings invite curiosity.' },
  { tip: { english: 'Send a "thinking of you" text with no question attached.', hinglish: 'Bina kuch pooche ek "tera khayal aaya" message bhej.' }, why: 'A message that asks for nothing feels like a gift, not a task.' },
  { tip: { english: 'Repair quickly: a small "sorry, that came out wrong" goes far.', hinglish: 'Jaldi repair kar: "sorry, galat tarah se bol diya" bahut kaam karta hai.' }, why: 'Couples who repair small moments early have fewer big fights.' },
];

const MOODS = [
  { id: 'connected', label: 'Cozy & connected', icon: <Heart /> },
  { id: 'hug', label: 'Need a warm hug', icon: <HeartHandshake /> },
  { id: 'playful', label: 'Playful & cheeky', icon: <Smile /> },
  { id: 'quiet', label: 'Stressed, need quiet', icon: <Moon /> },
] as const;
type MoodId = (typeof MOODS)[number]['id'];

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dayIndex = () => Math.floor(new Date(todayKey()).getTime() / 86_400_000);

interface DailyState {
  date: string;
  mine: string;
  partner: string;
  privateNote: string;
  mineSealed: boolean;
  partnerSealed: boolean;
  revealed: boolean;
  sealedPointsGiven: boolean;
  privateSaved: boolean;
  gameMine: 'a' | 'b' | null;
  gamePartner: 'a' | 'b' | null;
  mood: MoodId | null;
  tipRead: boolean;
}
const DAILY_KEY = 'lovemate_home_daily_v1';
const MODE_KEY = 'lovemate_home_mode_v1';
const freshDaily = (): DailyState => ({
  date: todayKey(),
  mine: '',
  partner: '',
  privateNote: '',
  mineSealed: false,
  partnerSealed: false,
  revealed: false,
  sealedPointsGiven: false,
  privateSaved: false,
  gameMine: null,
  gamePartner: null,
  mood: null,
  tipRead: false,
});
function loadDaily(): DailyState {
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null') as DailyState | null;
    return saved && saved.date === todayKey() ? { ...freshDaily(), ...saved } : freshDaily();
  } catch {
    return freshDaily();
  }
}

/** Next yearly occurrence for birthdays/anniversaries; the date itself for one-off milestones. */
function nextOccurrence(dateStr: string, recurring: boolean): Date | null {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date(todayKey());
  let next = new Date(y, m - 1, d);
  if (recurring) {
    next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  }
  return next;
}
const card = 'bg-white border border-[#EBE5DC] shadow-2xs';
const smallBtn = 'font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors';

export const PersonalizedDashboard: React.FC = () => {
  const {
    user,
    setActiveTab,
    coupleStreak,
    coupleRoom,
    agentTasks,
    importantDates,
    addPoints,
    addUserMemory,
    showToast,
    setPendingCopilotPrompt,
  } = useApp();
  const { t } = useT();
  const mySituation = situationInfo(user?.situation);
  const daysLabel = (n: number) => (n === 0 ? t('Today') : n === 1 ? t('Tomorrow') : t('In {n} days', { n }));

  const [mode, setMode] = useState<'couple' | 'private'>(() => {
    try {
      return localStorage.getItem(MODE_KEY) === 'private' ? 'private' : 'couple';
    } catch {
      return 'couple';
    }
  });
  const [daily, setDaily] = useState<DailyState>(loadDaily);
  const [lang, setLang] = useState<Lang>(user?.preferredLanguage === 'english' ? 'english' : 'hinglish');
  const [speaking, setSpeaking] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_KEY, JSON.stringify(daily));
    } catch {
      /* storage unavailable */
    }
  }, [daily]);
  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* storage unavailable */
    }
  }, [mode]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const update = (patch: Partial<DailyState>) => setDaily((d) => ({ ...d, ...patch }));
  const partner = user?.partnerName?.trim() || '';
  const partnerLabel = partner || t('Partner');
  const linked = !!partner && (coupleRoom?.status === 'connected' || !!user?.partnerConnected);
  const couple = mode === 'couple';

  const idx = dayIndex();
  const question = QUESTIONS[idx % QUESTIONS.length];
  const tip = TIPS[idx % TIPS.length];
  const game = WOULD_YOU_RATHER_CARDS[idx % WOULD_YOU_RATHER_CARDS.length];

  const nextDate = useMemo(() => {
    const today = new Date(todayKey());
    return importantDates
      .map((d) => ({ d, when: nextOccurrence(d.date, d.type === 'birthday' || d.type === 'anniversary') }))
      .filter((x): x is { d: (typeof importantDates)[number]; when: Date } => !!x.when && x.when >= today)
      .sort((a, b) => a.when.getTime() - b.when.getTime())
      .map((x) => ({ ...x, days: Math.round((x.when.getTime() - today.getTime()) / 86_400_000) }))[0];
  }, [importantDates]);

  const activePlan = useMemo(() => agentTasks.find((t) => !['completed', 'cancelled', 'failed'].includes(t.status)), [agentTasks]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Good morning');
    if (hour < 17) return t('Good afternoon');
    return t('Good evening');
  };

  /** Real delivery: hand the text to the phone's share sheet (WhatsApp etc.) or copy it. */
  const shareText = async (text: string, okMessage: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* cancelled or unsupported: fall back to copy */
      }
    }
    showToast((await copyText(text)) ? okMessage : t("Couldn't copy. Please copy it manually."), 'info');
  };

  const askAI = (query: string) => {
    setPendingCopilotPrompt(query);
    setActiveTab('copilot');
  };

  const sealMine = () => {
    if (!daily.mine.trim()) return showToast(t('Write your answer before sealing it.'), 'info');
    update({ mineSealed: true, sealedPointsGiven: true });
    if (!daily.sealedPointsGiven) addPoints(15, 'Answered the daily question');
  };

  const savePrivate = () => {
    if (!daily.privateNote.trim() || !user) return showToast(t('Write your reflection first.'), 'info');
    addUserMemory({
      userId: user.id,
      category: 'relationship',
      content: `Reflection on "${question.english}": ${daily.privateNote.trim()}`,
      source: 'explicit_user_input',
      confidence: 1,
      visibility: 'private',
      sourceReason: `Private reflection from the home page on ${todayKey()}`,
    });
    update({ privateSaved: true });
    if (!daily.sealedPointsGiven) {
      update({ privateSaved: true, sealedPointsGiven: true });
      addPoints(15, 'Private reflection');
    }
  };

  const toggleSpeak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return showToast(t('Audio playback is not supported in this browser.'), 'info');
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(`${tip.tip[lang]} ${tip.why}`);
    u.lang = 'en-IN';
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };

  /* ------------------------------- Guest view ------------------------------- */
  if (!user) return <LandingPage />;

  /* ------------------------------- Signed in -------------------------------- */
  return (
    <div className="space-y-8 sm:space-y-10 pb-16">
      {/* 1. Greeting + controls */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBE5DC]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif-romance font-bold text-zinc-900 tracking-tight">
            {getGreeting()}, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 flex items-center gap-2">
            {couple ? (
              linked ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t('Connected with {partner}', { partner })}</span>
                </>
              ) : partner ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-300" />
                  <span>{t("{partner} isn't linked yet.", { partner })}</span>
                  <button onClick={() => setActiveTab('couple-mode')} className={smallBtn}>
                    {t('Invite')}
                  </button>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-300" />
                  <span>{t('No partner added yet.')}</span>
                  <button onClick={() => setActiveTab('profile')} className={smallBtn}>
                    {t('Add partner')}
                  </button>
                </>
              )
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t('Private space. Only you can see what you write here.')}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold" title={couple ? t('Days you both checked in') : t('Days you opened LoveMate in a row')}>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('{n}-day streak', { n: couple ? coupleStreak : user.streak })}</span>
          </div>

          {couple && partner && (
            <button
              onClick={() => shareText(t('Thinking of you, {partner} 💓', { partner }), t('Heartbeat copied. Paste it in your chat.'))}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-white hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200/90 transition-colors"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              {t('Send a heartbeat')}
            </button>
          )}

          <div className="flex items-center bg-[#F3EFEA] p-1 rounded-xl border border-[#E5DFD5]" role="tablist" aria-label={t('Space')}>
            {(['couple', 'private'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${mode === m ? 'bg-white text-rose-600 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                {m === 'couple' ? t('Our room') : t('Private space')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 1b. Your tools: the five tools that fit the situation chosen in onboarding */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-serif-romance font-bold text-zinc-900 tracking-tight">
            {mySituation ? `${mySituation.emoji} ${t(mySituation.label)}: ${t('your tools')}` : t('Your tools')}
          </h2>
          <button onClick={() => setActiveTab('profile')} className="text-xs font-semibold text-rose-600 hover:underline">
            {mySituation ? t('Change situation') : t("Tell us what's your situation")}
          </button>
        </div>
        {mySituation ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {mySituation.tools.map((tool) => (
              <button
                key={tool.tab}
                onClick={() => setActiveTab(tool.tab)}
                className={`${card} rounded-2xl p-3.5 text-left hover:border-rose-300 transition-colors`}
              >
                <p className="text-xs font-bold text-zinc-900">{t(tool.label)}</p>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{t(tool.why)}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className={`${card} rounded-2xl p-4 text-sm text-zinc-600`}>
            {t('Crush, dating, long distance, engaged, married or complicated: tell us once and we put the right five tools first.')}
          </p>
        )}
      </section>

      {/* 2. Today's question (sealed in couple mode, private reflection otherwise) */}
      <section className={`${card} rounded-[32px] p-6 sm:p-8 space-y-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              {couple ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif-romance font-bold text-zinc-900">{couple ? t("Today's sealed question") : t("Today's private reflection")}</h2>
              <p className="text-xs text-zinc-500">
                {couple ? t('Answer separately. Neither answer is shown until you both have sealed yours.') : t('Saved to your private memories. Never shared.')}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-[11px] font-semibold shrink-0">
            {(['hinglish', 'english'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-2 py-0.5 rounded-md capitalize ${lang === l ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#EBE5DC]">
          <p className="text-sm sm:text-base font-serif-romance font-semibold text-zinc-900 leading-relaxed">"{question[lang]}"</p>
        </div>

        {!couple ? (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={daily.privateNote}
              disabled={daily.privateSaved}
              onChange={(e) => update({ privateNote: e.target.value })}
              placeholder={t('Write freely. This stays with you.')}
              className="w-full p-3 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-rose-400 resize-none disabled:bg-zinc-50"
            />
            {daily.privateSaved ? (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('Saved to your private memories')}
              </p>
            ) : (
              <button onClick={savePrivate} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold">
                {t('Save privately')}
              </button>
            )}
          </div>
        ) : daily.revealed ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-200 bg-white">
                <p className="text-xs font-semibold text-zinc-900 mb-1.5">{user.name}</p>
                <p className="text-sm text-zinc-800 leading-relaxed">"{daily.mine}"</p>
              </div>
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60">
                <p className="text-xs font-semibold text-rose-900 mb-1.5">{partnerLabel}</p>
                <p className="text-sm text-zinc-900 leading-relaxed font-serif-romance italic">"{daily.partner}"</p>
              </div>
            </div>
            <button
              onClick={() =>
                askAI(`We answered today's couple question: "${question.english}". ${user.name} said: "${daily.mine}". ${partnerLabel} said: "${daily.partner}". Reflect on what this shows about us and suggest one small thing we could do this week.`)
              }
              className={`${smallBtn} text-xs`}
            >
              {t('Reflect on this with LoveMate')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* You */}
            <div className="p-4 rounded-2xl border border-zinc-200/90 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-900">
                <span>{t('Your answer')}</span>
                {daily.mineSealed && (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('Sealed')}
                  </span>
                )}
              </div>
              {daily.mineSealed ? (
                <div className="p-5 rounded-xl bg-white border border-dashed border-zinc-300 text-center">
                  <Lock className="w-5 h-5 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-500 mt-1.5">{t('Hidden until you both reveal.')}</p>
                  <button onClick={() => update({ mineSealed: false })} disabled={daily.partnerSealed} className="text-[11px] text-zinc-400 hover:text-zinc-700 underline mt-2 disabled:hidden">
                    {t('Edit my answer')}
                  </button>
                </div>
              ) : (
                <>
                  <textarea
                    rows={3}
                    value={daily.mine}
                    onChange={(e) => update({ mine: e.target.value })}
                    placeholder={t('Write your honest answer...')}
                    className="w-full p-3 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-rose-400 resize-none"
                  />
                  <button onClick={sealMine} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> {t('Seal my answer')}
                  </button>
                </>
              )}
            </div>

            {/* Partner */}
            <div className="p-4 rounded-2xl border border-zinc-200/90 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-900">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  {partner ? t("{partner}'s answer", { partner }) : t("Partner's answer")}
                </span>
                {daily.partnerSealed && (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('Sealed')}
                  </span>
                )}
              </div>

              {!partner ? (
                <div className="p-5 rounded-xl bg-white border border-dashed border-zinc-300 text-center space-y-2">
                  <UserPlus className="w-5 h-5 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-500">{t("Add your partner's name to answer together.")}</p>
                  <button onClick={() => setActiveTab('profile')} className={`${smallBtn} text-xs`}>
                    {t('Add partner')}
                  </button>
                </div>
              ) : daily.partnerSealed ? (
                <div className="p-5 rounded-xl bg-white border border-dashed border-zinc-300 text-center">
                  <Lock className="w-5 h-5 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-500 mt-1.5">{t("{partner}'s answer is sealed.", { partner })}</p>
                </div>
              ) : !daily.mineSealed ? (
                <div className="p-5 rounded-xl bg-white border border-dashed border-zinc-300 text-center space-y-2">
                  <Lock className="w-5 h-5 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-500">{t('Seal your answer first, then pass the phone to {partner} or send them the question.', { partner })}</p>
                  <button
                    onClick={() => shareText(t("Today's LoveMate question for us: \"{q}\" Answer it before you peek at mine 🔒", { q: question[lang] }), t('Question copied. Send it to them.'))}
                    className={`${smallBtn} text-xs`}
                  >
                    <Send className="w-3 h-3" /> {t('Send the question')}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-zinc-500">{t('Pass the phone to {partner}. Your answer is hidden.', { partner })}</p>
                  <textarea
                    rows={3}
                    value={daily.partner}
                    onChange={(e) => update({ partner: e.target.value })}
                    placeholder={t('{partner}, write your answer...', { partner })}
                    className="w-full p-3 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-rose-400 resize-none"
                  />
                  <button
                    onClick={() => (daily.partner.trim() ? update({ partnerSealed: true }) : showToast(t('{partner} needs to write an answer first.', { partner }), 'info'))}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> {t("Seal {partner}'s answer", { partner })}
                  </button>
                </>
              )}
            </div>

            {daily.mineSealed && daily.partnerSealed && (
              <button onClick={() => update({ revealed: true })} className="md:col-span-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                <Unlock className="w-4 h-4" /> {t('Reveal both answers')}
              </button>
            )}
          </div>
        )}
      </section>

      {/* 3. Daily rituals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-serif-romance font-bold text-zinc-900 tracking-tight">{t('Daily rituals')}</h2>
          <span className="text-xs text-zinc-400">{t('New every day')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tip */}
          <div className={`${card} p-5 rounded-3xl flex flex-col justify-between gap-4`}>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">{t("Today's tip")}</span>
              <h3 className="font-serif-romance font-semibold text-zinc-900 text-sm leading-snug pt-1">"{tip.tip[lang]}"</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{tip.why}</p>
            </div>
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <button onClick={toggleSpeak} className="font-semibold text-zinc-700 hover:text-rose-600 flex items-center gap-1.5" aria-pressed={speaking}>
                {speaking ? <Square className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-400" />}
                {speaking ? t('Stop') : t('Listen')}
              </button>
              {daily.tipRead ? (
                <span className="text-zinc-400 font-semibold inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {t('Read today')}
                </span>
              ) : (
                <button
                  onClick={() => {
                    update({ tipRead: true });
                    addPoints(10, "Read today's tip");
                  }}
                  className={smallBtn}
                >
                  {t('Mark as read (+10)')}
                </button>
              )}
            </div>
          </div>

          {/* Would you rather */}
          <div className={`${card} p-5 rounded-3xl flex flex-col justify-between gap-4`}>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">{t('Would you rather')}</span>
              <h3 className="font-serif-romance font-semibold text-zinc-900 text-sm leading-snug pt-1">{game.question}</h3>
              <div className="space-y-1.5 pt-1">
                {(['a', 'b'] as const).map((opt) => {
                  const text = opt === 'a' ? game.optionA : game.optionB;
                  const mine = daily.gameMine === opt;
                  const theirs = daily.gamePartner === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => update({ gameMine: opt })}
                      className={`w-full p-2 text-left text-xs rounded-xl border transition-colors flex items-center justify-between gap-2 ${mine ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}
                    >
                      <span>{text}</span>
                      <span className="flex gap-1 shrink-0 text-[10px] font-semibold">
                        {mine && <span className="px-1.5 rounded bg-rose-600 text-white">{t('You')}</span>}
                        {theirs && <span className="px-1.5 rounded bg-zinc-900 text-white">{partner || t('Partner')}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-100 text-xs">
              {!daily.gameMine ? (
                <span className="text-zinc-500">{t('Pick one, then compare.')}</span>
              ) : couple && partner && !daily.gamePartner ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">{t("{partner}'s pick?", { partner })}</span>
                  <span className="flex gap-1.5">
                    <button onClick={() => update({ gamePartner: 'a' })} className="px-2 py-0.5 rounded-lg border border-zinc-200 hover:border-rose-300 font-semibold">
                      {t('First')}
                    </button>
                    <button onClick={() => update({ gamePartner: 'b' })} className="px-2 py-0.5 rounded-lg border border-zinc-200 hover:border-rose-300 font-semibold">
                      {t('Second')}
                    </button>
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">
                    {!daily.gamePartner ? t('Saved for today.') : daily.gamePartner === daily.gameMine ? t('You matched!') : t('Different picks. Ask each other why.')}
                  </span>
                  <button onClick={() => setActiveTab('games')} className={smallBtn}>
                    {t('More games')} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mood */}
          <div className={`${card} p-5 rounded-3xl flex flex-col justify-between gap-4`}>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">{t('Mood check-in')}</span>
              <h3 className="font-serif-romance font-semibold text-zinc-900 text-sm pt-1">{t('How are you feeling today?')}</h3>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => update({ mood: m.id })}
                    aria-pressed={daily.mood === m.id}
                    className={`p-2 rounded-xl text-left text-[11px] border transition-colors flex items-center gap-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:shrink-0 ${
                      daily.mood === m.id ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold [&>svg]:text-rose-600' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 [&>svg]:text-zinc-400'
                    }`}
                  >
                    {m.icon}
                    {t(m.label)}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">{daily.mood ? t('Saved for today.') : t('Tap how you feel.')}</span>
              {couple && partner && daily.mood && (
                <button
                  onClick={() => shareText(t("Today I'm feeling: {mood} 💛", { mood: t(MOODS.find((m) => m.id === daily.mood)?.label ?? '').toLowerCase() }), t('Mood copied. Send it to {partner}.', { partner }))}
                  className={smallBtn}
                >
                  {t('Tell {partner}', { partner })} <Send className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Ask LoveMate */}
      <section className={`${card} rounded-3xl p-5 sm:p-7 space-y-3`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-serif-romance font-bold text-zinc-900">{t('Ask LoveMate')}</h2>
            <p className="text-xs text-zinc-500">{t('Texting advice, date ideas, or help with a hard conversation')}</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = aiQuery.trim();
            setAiQuery('');
            if (q) askAI(q);
            else setActiveTab('copilot');
          }}
          className="p-2 rounded-2xl bg-zinc-50 border border-zinc-200 focus-within:border-rose-400 focus-within:bg-white transition-colors flex items-center gap-2"
        >
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder={t('Ask anything, like "How do I reply when they go quiet?"')}
            aria-label={t('Ask LoveMate')}
            className="flex-1 min-w-0 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none px-2"
          />
          <button type="button" onClick={() => setActiveTab('voice-chat')} aria-label={t('Ask by voice')} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hidden sm:block">
            <Mic className="w-4 h-4" />
          </button>
          <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0">
            {t('Ask')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { label: 'Plan a weekend date', query: 'Plan a relaxed weekend date for us with good food and time to talk' },
            { label: 'What should I text?', query: 'They have been quiet since Sunday. What is a kind, low-pressure way to check in?' },
            { label: 'Anniversary plan', query: 'Help me plan our upcoming anniversary step by step over the next three weeks' },
            { label: '3 deep questions', query: 'Give us 3 deep questions to ask each other tonight' },
          ].map((p) => (
            <button key={p.label} onClick={() => askAI(p.query)} className="px-2.5 py-1 rounded-full bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-700 border border-zinc-200 text-xs font-medium transition-colors">
              {t(p.label)}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Coming up */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-serif-romance font-bold text-zinc-900 tracking-tight">{t('Coming up')}</h2>
          <button onClick={() => setActiveTab('couple-calendar')} className={`${smallBtn} text-xs`}>
            {t('View calendar')} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next important date */}
          <div className={`${card} p-5 rounded-3xl flex flex-col justify-between gap-4`}>
            {nextDate ? (
              <>
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex flex-col items-center justify-center shrink-0 leading-none">
                    <span className="text-[10px] font-semibold uppercase">{nextDate.when.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="text-lg font-bold">{nextDate.when.getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-rose-600">{daysLabel(nextDate.days)}</p>
                    <h3 className="text-sm sm:text-base font-serif-romance font-bold text-zinc-900 leading-snug">{nextDate.d.title}</h3>
                    {nextDate.d.notes && <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{nextDate.d.notes}</p>}
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button onClick={() => setActiveTab('important-dates')} className="text-xs text-zinc-500 hover:text-zinc-800">
                    {t('All dates')}
                  </button>
                  <button
                    onClick={() => askAI(`Help me plan something special for "${nextDate.d.title}" ${nextDate.days === 0 ? 'today' : nextDate.days === 1 ? 'tomorrow' : `in ${nextDate.days} days`}.${nextDate.d.notes ? ` Notes: ${nextDate.d.notes}` : ''}`)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    {t('Plan it')} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              <EmptyMini icon={<CalendarHeart className="w-5 h-5" />} title={t('No dates saved yet')} body={t('Add birthdays and anniversaries so you never miss one.')} action={t('Add a date')} onAction={() => setActiveTab('important-dates')} />
            )}
          </div>

          {/* Active plan */}
          <div className={`${card} p-5 rounded-3xl flex flex-col justify-between gap-4`}>
            {activePlan ? (
              <>
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-500">
                      {t('Plan in progress')}
                      {activePlan.scheduledAt && !Number.isNaN(Date.parse(activePlan.scheduledAt)) && ` · ${new Date(activePlan.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </p>
                    <h3 className="text-sm sm:text-base font-serif-romance font-bold text-zinc-900 leading-snug">{activePlan.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{activePlan.description}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-end">
                  <button onClick={() => setActiveTab('copilot')} className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1">
                    {t('Continue')} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              <EmptyMini icon={<Sparkles className="w-5 h-5" />} title={t('No plans in progress')} body={t('Tell LoveMate what you want to make happen and it will build a plan.')} action={t('Start a plan')} onAction={() => setActiveTab('copilot')} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const EmptyMini: React.FC<{ icon: React.ReactNode; title: string; body: string; action: string; onAction: () => void }> = ({ icon, title, body, action, onAction }) => (
  <div className="flex flex-col items-start gap-3 h-full">
    <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">{icon}</div>
    <div>
      <h3 className="text-sm font-serif-romance font-bold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1">{body}</p>
    </div>
    <button onClick={onAction} className={`${smallBtn} text-xs mt-auto`}>
      {action} <ArrowRight className="w-3 h-3" />
    </button>
  </div>
);
