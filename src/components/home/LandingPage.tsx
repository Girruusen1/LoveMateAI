import React, { useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookHeart,
  Check,
  ChevronDown,
  Copy,
  Gamepad2,
  Gift,
  Headphones,
  Heart,
  Languages,
  Lock,
  Mail,
  MessageSquare,
  Mic,
  Orbit,
  Plane,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import type { ActiveTab, DecodeResult } from '../../types';
import { copyText } from '../../utils/clipboard';
import { isAiLimitError } from '../../utils/aiErrors';

/* ---------------------------------------------------------------------------
   Small presentational pieces (all built from the app's own UI, no stock art)
   --------------------------------------------------------------------------- */
const Pill: React.FC<{ children: React.ReactNode; tone?: 'rose' | 'zinc' | 'amber' | 'emerald' }> = ({ children, tone = 'rose' }) => {
  const tones = {
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
};

const Bubble: React.FC<{ from: 'them' | 'you'; children: React.ReactNode; time?: string }> = ({ from, children, time }) => (
  <div className={`flex ${from === 'you' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm shadow-2xs ${from === 'you' ? 'bg-rose-600 text-white rounded-br-md' : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-md'}`}>
      {children}
      {time && <span className={`block text-[10px] mt-0.5 ${from === 'you' ? 'text-rose-100' : 'text-zinc-400'}`}>{time}</span>}
    </div>
  </div>
);

/** Hero visual: an incoming text decoded into tone, meaning and replies. */
const HeroPreview: React.FC = () => (
  <div className="relative mx-auto w-full max-w-md">
    {/* glow */}
    <div className="absolute -inset-10 bg-gradient-to-tr from-rose-200/60 via-amber-100/50 to-pink-200/50 blur-3xl rounded-full -z-10" />

    {/* main card */}
    <div className="lm-float rounded-[28px] bg-white/90 backdrop-blur border border-white shadow-[0_30px_80px_-30px_rgba(225,29,72,0.45)] overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2.5 bg-[#FCFAF7]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-rose-300 text-white text-xs font-bold flex items-center justify-center">A</div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-zinc-900">Aarav</p>
          <p className="text-[11px] text-zinc-400">last seen 11:34 pm</p>
        </div>
      </div>
      <div className="p-4 space-y-2.5 bg-[#FAF7F2]">
        <Bubble from="you" time="11:20 pm">Coffee this Saturday? ☕</Bubble>
        <Bubble from="them" time="11:34 pm">haan dekhte hain 😂</Bubble>
      </div>

      <div className="p-5 space-y-3 border-t border-zinc-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
          <Search className="w-3.5 h-3.5" /> LoveMate decoded it
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="amber">Tone: light, non-committal</Pill>
          <Pill tone="zinc">Interest: unclear</Pill>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          They're open but haven't committed. Give them an easy yes with a specific time.
        </p>
        <div className="space-y-1.5">
          {['Saturday 5 pm at Blue Tokai? 😄', 'Haha theek hai, main 5 baje free hoon'].map((r) => (
            <div key={r} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-zinc-800">
              <span>{r}</span>
              <Copy className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* floating: sealed question */}
    <div className="lm-float-slow hidden sm:flex absolute -right-10 -top-8 w-52 rounded-2xl bg-white border border-zinc-100 shadow-xl p-3.5 gap-3 items-start">
      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <Lock className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-zinc-900">Today's sealed question</p>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">Both answers stay hidden until you both reply.</p>
      </div>
    </div>

    {/* floating: date plan */}
    <div className="lm-float hidden sm:flex absolute -left-12 -bottom-14 w-48 rounded-2xl bg-white border border-zinc-100 shadow-xl p-3.5 gap-3 items-center">
      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex flex-col items-center justify-center leading-none shrink-0">
        <span className="text-[9px] font-bold uppercase">Sat</span>
        <span className="text-sm font-bold">7pm</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-zinc-900">Date plan ready</p>
        <p className="text-[11px] text-zinc-500">Rooftop dinner, 3 stops</p>
      </div>
    </div>
  </div>
);

/* Mini previews for the feature rows */
const PreviewUnderstand = () => (
  <div className="rounded-3xl bg-white border border-zinc-100 shadow-lg p-5 space-y-3">
    <div className="rounded-2xl bg-[#FAF7F2] border border-[#EBE5DC] p-3 space-y-2">
      <Bubble from="them">k</Bubble>
      <Bubble from="you">did I say something wrong?</Bubble>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { k: 'Tone', v: 'Tired' },
        { k: 'Mood', v: 'Distracted' },
        { k: 'Risk', v: 'Low' },
      ].map((x) => (
        <div key={x.k} className="rounded-xl bg-zinc-50 border border-zinc-100 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">{x.k}</p>
          <p className="text-xs font-semibold text-zinc-900">{x.v}</p>
        </div>
      ))}
    </div>
    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-900">
      <span className="font-semibold">Don't assume</span> a one-letter reply means they're upset. Short replies often mean busy.
    </div>
  </div>
);

const PreviewSayIt = () => (
  <div className="rounded-3xl bg-white border border-zinc-100 shadow-lg p-5 space-y-3">
    <div className="flex flex-wrap gap-1.5">
      {['Cute', 'Romantic', 'Funny', 'Shy'].map((t, i) => (
        <span key={t} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${i === 0 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-zinc-600 border-zinc-200'}`}>
          {t}
        </span>
      ))}
    </div>
    <div className="rounded-2xl bg-rose-50/60 border border-rose-100 p-4">
      <p className="font-serif-romance italic text-zinc-800 leading-relaxed text-sm">
        "Pata nahi kab hua, but tere messages ka wait karna meri favourite habit ban gayi hai. No pressure, bas tujhe batana tha 🙂"
      </p>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {['Make it shorter', 'More confident', 'Less cringe'].map((t) => (
        <span key={t} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-50 border border-zinc-200 text-zinc-600">
          {t}
        </span>
      ))}
    </div>
  </div>
);

const PreviewTogether = () => (
  <div className="rounded-3xl bg-white border border-zinc-100 shadow-lg p-5 space-y-3">
    <p className="font-serif-romance font-semibold text-zinc-900 text-sm">"What made you smile this week that I might not know about?"</p>
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-zinc-200 p-3 text-center">
        <Lock className="w-4 h-4 text-zinc-400 mx-auto" />
        <p className="text-[11px] text-zinc-500 mt-1">Your answer, sealed</p>
      </div>
      <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
        <Unlock className="w-4 h-4 text-rose-500 mx-auto" />
        <p className="text-[11px] text-rose-700 mt-1">Ready to reveal</p>
      </div>
    </div>
    <div className="space-y-1.5">
      {[
        { t: '7:00 pm', a: 'Sunset walk at the lake' },
        { t: '8:15 pm', a: 'Dinner at the rooftop café' },
      ].map((s) => (
        <div key={s.t} className="flex items-center gap-3 text-xs">
          <span className="w-14 shrink-0 font-semibold text-rose-600">{s.t}</span>
          <span className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-700">{s.a}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ---------------------------------------------------------------------------
   Page
   --------------------------------------------------------------------------- */
const SAMPLES = ['haan dekhte hain 😂', 'k', 'haha okay sure', 'busy hoon, baad mein baat karte hain'];

/** The hubs and headline tools, in the same words as the Explore menu. */
const TOOLS: { label: string; tab: ActiveTab; icon: React.ReactNode }[] = [
  { label: 'Decode a message', tab: 'understand-message', icon: <Search /> },
  { label: 'Read the situation', tab: 'read-situation', icon: <Radar /> },
  { label: 'Help me reply', tab: 'help-reply', icon: <MessageSquare /> },
  { label: 'Confession studio', tab: 'confession', icon: <Mail /> },
  { label: 'Date & gift planner', tab: 'plan-date', icon: <Gift /> },
  { label: 'Trip together', tab: 'trip-together', icon: <Plane /> },
  { label: 'Practice a conversation', tab: 'practice', icon: <Headphones /> },
  { label: 'Check-in & insights', tab: 'insights', icon: <Activity /> },
  { label: 'Couple mode', tab: 'couple', icon: <Gamepad2 /> },
  { label: 'Our story', tab: 'our-story-hub', icon: <BookHeart /> },
  { label: 'Voice chat', tab: 'voice-chat', icon: <Mic /> },
  { label: 'Kundli Milan', tab: 'kundli', icon: <Orbit /> },
];

const FAQ = [
  { q: 'Is LoveMate free?', a: 'Yes. The free plan gives you daily AI chats, decodes, replies and confessions, plus games and Our Space. New accounts also get 7 days of Plus free. Plus (₹149/month) makes every tool unlimited, and Couple (₹249/month) covers both partners with one payment.' },
  { q: 'Does it understand Hinglish?', a: 'Yes. You can write in Hinglish, Hindi or English, and choose the language for replies and suggestions.' },
  { q: 'Who can see what I write?', a: 'Only you. Your chats, drafts and reflections are private by default, and you can delete everything from Trust & safety at any time.' },
  { q: 'Can LoveMate tell me if they like me?', a: "No one can read minds. LoveMate shows you possible meanings and what would confirm them, so you can decide calmly instead of overthinking." },
  { q: 'Is this therapy?', a: 'No. LoveMate is a supportive companion, not a therapist. For serious or ongoing problems, please reach out to a licensed professional.' },
];

export const LandingPage: React.FC = () => {
  const { openAuthModal, setActiveTab, setProModalOpen, showToast } = useApp();
  const demoRef = useRef<HTMLElement>(null);
  const [msg, setMsg] = useState(SAMPLES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const runDecode = async () => {
    if (!msg.trim()) return showToast('Paste a message to decode.', 'info');
    setLoading(true);
    try {
      setResult(await AIService.decodeMessage(msg.trim()));
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Could not decode that right now. Please try again.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const signup = () => openAuthModal('signup');
  const scrollToDemo = () => demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="-mt-6 pb-8 overflow-hidden">
      {/* ============================ HERO ============================ */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24">
        <div className="absolute inset-0 lm-dots-bg [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)] -z-10" />
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-rose-200/40 blur-3xl -z-10" />
        <div className="absolute top-40 -left-32 w-[360px] h-[360px] rounded-full bg-amber-100/60 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="text-center lg:text-left">
            <span className="lm-fade-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              Your AI wingman for love and relationships
            </span>
            <h1 className="lm-fade-up lm-delay-1 mt-5 text-4xl sm:text-6xl font-serif-romance font-bold text-zinc-900 leading-[1.05] tracking-tight">
              Say the part you haven't found the <span className="italic text-rose-600">words</span> for yet.
            </h1>
            <p className="lm-fade-up lm-delay-2 mt-5 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Decode confusing texts, write the right reply, plan dates and grow closer as a couple, in English or Hinglish.
            </p>
            <div className="lm-fade-up lm-delay-3 mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button onClick={signup} className="w-full sm:w-auto px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
                Create a free account <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={scrollToDemo} className="w-full sm:w-auto px-6 py-3.5 bg-white border border-zinc-200 hover:border-rose-300 rounded-2xl text-sm font-semibold text-zinc-800 transition-colors">
                Try it without signing up
              </button>
            </div>
            <div className="lm-fade-up lm-delay-3 mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Free to start
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Private by default
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-emerald-600" /> English and Hinglish
              </span>
            </div>
          </div>

          <div className="lm-fade-up lm-delay-2">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ============================ LIVE DEMO ============================ */}
      <section ref={demoRef} className="max-w-4xl mx-auto scroll-mt-24">
        <div className="rounded-[32px] bg-white border border-[#EBE5DC] shadow-xl shadow-rose-900/5 p-6 sm:p-10">
          <div className="text-center">
            <Pill>Try it now, no sign-up</Pill>
            <h2 className="mt-3 text-2xl sm:text-3xl font-serif-romance font-bold text-zinc-900">Got a confusing text? Decode it.</h2>
            <p className="text-sm text-zinc-500 mt-2">Paste what they sent. See the likely tone, what it might mean, and three replies.</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runDecode()}
              aria-label="Message to decode"
              placeholder="Paste their message..."
              className="flex-1 px-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE5DC] text-sm text-zinc-900 focus:outline-none focus:border-rose-400 focus:bg-white"
            />
            <button onClick={runDecode} disabled={loading} className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-70 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 shrink-0">
              {loading ? (
                <span className="flex gap-1">
                  <span className="lm-dot w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="lm-dot w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="lm-dot w-1.5 h-1.5 rounded-full bg-white" />
                </span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Decode
                </>
              )}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-400 mr-1">Examples:</span>
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => setMsg(s)} className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${msg === s ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-zinc-200 text-zinc-600 hover:border-rose-200'}`}>
                {s}
              </button>
            ))}
          </div>

          {result && (
            <div className="mt-7 grid grid-cols-1 md:grid-cols-5 gap-4 lm-fade-up">
              <div className="md:col-span-2 rounded-2xl bg-[#FAF7F2] border border-[#EBE5DC] p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone="amber">{result.tone}</Pill>
                  <Pill tone="zinc">{result.mood}</Pill>
                  <Pill>Interest: {result.interestSignal}</Pill>
                </div>
                <ul className="space-y-1.5">
                  {result.whatItMightMean.slice(0, 3).map((m) => (
                    <li key={m} className="text-xs text-zinc-700 leading-relaxed flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-3 space-y-2">
                {result.responses.map((r) => (
                  <button
                    key={r.id}
                    onClick={async () => showToast((await copyText(r.text)) ? 'Reply copied' : "Couldn't copy. Please copy manually.", 'love')}
                    className="w-full text-left rounded-2xl border border-zinc-200 hover:border-rose-300 bg-white p-3.5 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-rose-600">{r.label}</span>
                      <Copy className="w-3.5 h-3.5 text-zinc-300 group-hover:text-rose-500" />
                    </div>
                    <p className="text-sm text-zinc-800 mt-1">{r.text}</p>
                  </button>
                ))}
              </div>
              <div className="md:col-span-5 rounded-2xl bg-rose-600 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm font-medium">Save your results and unlock replies, confessions and date plans.</p>
                <button onClick={signup} className="px-5 py-2 bg-white text-rose-700 rounded-xl text-sm font-semibold shrink-0">
                  Create a free account
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className="max-w-6xl mx-auto mt-24 space-y-20 sm:space-y-28">
        {[
          {
            eyebrow: 'Understand them',
            title: 'Stop overthinking every text.',
            body: 'Decode a message or a whole chat screenshot. LoveMate separates what was actually said from what you might be assuming, then helps you reply calmly.',
            points: ['Tone and mood at a glance', 'Screenshot analysis', 'What not to assume'],
            preview: <PreviewUnderstand />,
            tab: 'understand-message' as ActiveTab,
          },
          {
            eyebrow: 'Say it right',
            title: 'Find words that sound like you.',
            body: 'Write a confession, an apology or the perfect reply in your tone and language. Then tweak it until it feels right: shorter, braver, less cringe.',
            points: ['Confessions and apologies', 'Replies in six vibes', 'Hinglish built in'],
            preview: <PreviewSayIt />,
            tab: 'confession' as ActiveTab,
          },
          {
            eyebrow: 'Grow together',
            title: 'A little ritual for the two of you.',
            body: 'Answer a sealed question each day, keep shared memories and goals, and plan dates and trips that fit your city and budget.',
            points: ['Daily sealed questions', 'Our Space for memories', 'Date and trip plans'],
            preview: <PreviewTogether />,
            tab: 'plan-date' as ActiveTab,
          },
        ].map((f, i) => (
          <div key={f.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div>
              <Pill>{f.eyebrow}</Pill>
              <h2 className="mt-3 text-3xl sm:text-4xl font-serif-romance font-bold text-zinc-900 leading-tight">{f.title}</h2>
              <p className="mt-4 text-zinc-600 leading-relaxed">{f.body}</p>
              <ul className="mt-5 space-y-2">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-zinc-700">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <button onClick={() => setActiveTab(f.tab)} className="mt-6 text-sm font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5">
                Try it <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <div className={`absolute -inset-6 rounded-[40px] -z-10 ${i === 1 ? 'bg-amber-100/50' : 'bg-rose-100/50'} blur-2xl`} />
              {f.preview}
            </div>
          </div>
        ))}
      </section>

      {/* ============================ TOOL GRID ============================ */}
      <section className="max-w-6xl mx-auto mt-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-serif-romance font-bold text-zinc-900">Everything for your love life, in one place</h2>
          <p className="text-sm text-zinc-500 mt-2">From the first crush to the tenth anniversary.</p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {TOOLS.map((t) => (
            <button
              key={t.tab}
              onClick={() => setActiveTab(t.tab)}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#EBE5DC] hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
            >
              <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors [&>svg]:w-4 [&>svg]:h-4">{t.icon}</span>
              <span className="text-sm font-medium text-zinc-800">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="max-w-6xl mx-auto mt-24">
        <h2 className="text-3xl font-serif-romance font-bold text-zinc-900 text-center">How it works</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: '1', t: 'Tell LoveMate what happened', d: 'Paste a text, upload a screenshot or just describe the situation.' },
            { n: '2', t: 'Get clarity and words', d: 'See what it might mean, and get replies or messages in your style.' },
            { n: '3', t: 'Grow closer over time', d: 'Daily questions, shared memories and plans keep the spark going.' },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl bg-white border border-[#EBE5DC] p-6">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white font-serif-romance text-lg font-bold flex items-center justify-center shadow-md shadow-rose-600/20">{s.n}</span>
              <h3 className="mt-4 font-semibold text-zinc-900">{s.t}</h3>
              <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ PRIVACY + PLANS ============================ */}
      <section className="max-w-6xl mx-auto mt-24 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[32px] bg-zinc-900 text-white p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-rose-500/30 blur-3xl" />
          <ShieldCheck className="w-8 h-8 text-rose-300" />
          <h2 className="mt-4 text-2xl sm:text-3xl font-serif-romance font-bold">Your heart's business stays yours.</h2>
          <ul className="mt-5 space-y-2.5 text-sm text-zinc-300">
            <li className="flex gap-2.5"><Check className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" /> Private by default. Nothing is shared with your partner unless you choose to.</li>
            <li className="flex gap-2.5"><Check className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" /> See, edit or delete everything LoveMate remembers.</li>
            <li className="flex gap-2.5"><Check className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" /> Never helps with manipulation, pressure or tracking someone.</li>
          </ul>
        </div>
        <div className="rounded-[32px] bg-gradient-to-br from-rose-50 via-white to-amber-50 border border-[#EBE5DC] p-8 sm:p-10 flex flex-col">
          <Sparkles className="w-8 h-8 text-rose-500" />
          <h2 className="mt-4 text-2xl sm:text-3xl font-serif-romance font-bold text-zinc-900">Start free. Upgrade when you're ready.</h2>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            Free gives you daily decodes, replies, confessions and games. Plus (₹149/month) makes every AI tool unlimited, and Couple (₹249/month) covers both partners. New accounts get 7 days of Plus free.
          </p>
          <div className="mt-auto pt-6 flex flex-wrap gap-3">
            <button onClick={signup} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold">
              Start free
            </button>
            <button onClick={() => setProModalOpen(true)} className="px-5 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl text-sm font-semibold text-zinc-800">
              See plans
            </button>
          </div>
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section className="max-w-3xl mx-auto mt-24">
        <h2 className="text-3xl font-serif-romance font-bold text-zinc-900 text-center">Questions</h2>
        <div className="mt-6 space-y-2">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-2xl bg-white border border-[#EBE5DC] overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left">
                <span className="font-semibold text-sm sm:text-base text-zinc-900">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <p className="px-4 sm:px-5 pb-5 -mt-1 text-sm text-zinc-600 leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="max-w-6xl mx-auto mt-24">
        <div className="relative rounded-[36px] overflow-hidden bg-gradient-to-br from-rose-600 via-rose-500 to-pink-500 px-6 py-14 sm:py-16 text-center text-white">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="relative">
            <Heart className="w-10 h-10 mx-auto fill-white/90 text-white" />
            <h2 className="mt-4 text-3xl sm:text-5xl font-serif-romance font-bold leading-tight">Love is complicated.<br className="hidden sm:block" /> Getting help shouldn't be.</h2>
            <p className="mt-4 text-rose-50 max-w-lg mx-auto">Join free in under a minute. No card needed.</p>
            <button onClick={signup} className="mt-8 px-8 py-3.5 bg-white text-rose-700 hover:bg-rose-50 rounded-2xl text-sm font-bold shadow-xl inline-flex items-center gap-2 transition-all hover:-translate-y-0.5">
              Create a free account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
