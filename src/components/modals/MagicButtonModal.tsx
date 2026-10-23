import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Gift,
  Heart,
  Lightbulb,
  Lock,
  Music,
  Send,
  Sparkles,
  Utensils,
  Wand2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { isAiLimitError } from '../../utils/aiErrors';

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toGoogleStamp = (d: Date) =>
  `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;

/** Hours to block out for each "Time available" option. */
const durationHours = (label: string) => (label.startsWith('Quick') ? 2 : label.startsWith('All-Day') ? 8 : 4);

/** The surprise is scheduled two days from now at 18:00 local (10:00 for all-day adventures). */
const surpriseStart = (durationLabel: string) => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(durationLabel.startsWith('All-Day') ? 10 : 18, 0, 0, 0);
  return d;
};

export const MagicButtonModal: React.FC = () => {
  const {
    magicButtonModalOpen,
    setMagicButtonModalOpen,
    proactiveSuggestions,
    dismissProactiveSuggestion,
    addCalendarEvent,
    setActiveTab,
    triggerConfetti,
    showToast,
    user,
  } = useApp();

  const [activeTabMode, setActiveTabMode] = useState<'magic' | 'surprise'>('magic');

  // Surprise Mode State
  const [surpriseBudget, setSurpriseBudget] = useState('₹2,000 - ₹5,000');
  const [surpriseDuration, setSurpriseDuration] = useState('Full Evening (3-4 hrs)');
  const [surpriseMood, setSurpriseMood] = useState('Romantic & High Spark');
  const [surpriseLocation, setSurpriseLocation] = useState<'together' | 'long_distance'>('together');
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [generatedSurprise, setGeneratedSurprise] = useState<{
    title: string;
    mood: string;
    timeline: { time: string; action: string }[];
    foodIdea: string;
    playlistSuggestion: string;
    secretClosingGesture: string;
  } | null>(null);

  if (!magicButtonModalOpen) return null;

  // Prioritize one single context recommendation as required by Rule 39
  const primarySuggestion = proactiveSuggestions.length > 0 ? proactiveSuggestions[0] : null;

  const handleExecute = () => {
    if (!primarySuggestion) return;
    triggerConfetti();
    setMagicButtonModalOpen(false);
    setActiveTab(primarySuggestion.ctaTab);
  };

  const handleDismiss = () => {
    if (!primarySuggestion) return;
    if (!primarySuggestion.dismissable) {
      setMagicButtonModalOpen(false);
      return;
    }
    // Removing it from context makes the next suggestion (or the empty state) render
    dismissProactiveSuggestion(primarySuggestion.id);
  };

  const handleOpenGoogleCalendar = () => {
    if (!generatedSurprise) return;
    const start = surpriseStart(surpriseDuration);
    const end = new Date(start.getTime() + durationHours(surpriseDuration) * 60 * 60 * 1000);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Secret Surprise: ${generatedSurprise.title}`,
      dates: `${toGoogleStamp(start)}/${toGoogleStamp(end)}`,
      details: [
        `Surprise for ${user?.partnerName || 'my partner'} (${surpriseDuration}, ${surpriseBudget})`,
        ...generatedSurprise.timeline.map((t) => `${t.time}: ${t.action}`),
        `Closing gesture: ${generatedSurprise.secretClosingGesture}`,
      ].join('\n'),
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const handleGenerateSurprise = async () => {
    setSurpriseLoading(true);
    try {
      // The service has no duration parameter, so it travels in the mood text (which the plan echoes back)
      const plan = await AIService.generateSurprisePlan(
        surpriseBudget,
        `${surpriseMood} · ${surpriseDuration}`,
        surpriseLocation
      );
      setGeneratedSurprise(plan);
      triggerConfetti();
    } catch (err) {
      if (!isAiLimitError(err)) showToast('Could not generate surprise blueprint. Please retry.', 'info');
    } finally {
      setSurpriseLoading(false);
    }
  };

  const handleAddSurpriseToCalendar = () => {
    if (!generatedSurprise) return;
    const start = surpriseStart(surpriseDuration);

    addCalendarEvent({
      title: `Secret Surprise: ${generatedSurprise.title}`,
      date: toDateKey(start),
      time: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
      category: 'date',
      participants: 'both',
      privacy: 'private',
      createdBy: user?.name || 'You',
      description: `Surprise plan for ${user?.partnerName || 'Partner'} (${surpriseDuration}) • ${generatedSurprise.secretClosingGesture}`,
    });

    showToast('🔒 Added to Couple Calendar as a Private Surprise (hidden from partner)!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-rose-100 shadow-2xl relative space-y-5 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow backdrop */}
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-rose-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Header with Tab Navigation */}
        <div className="flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-2xl">
            <button
              onClick={() => setActiveTabMode('magic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabMode === 'magic'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              Daily Magic
            </button>
            <button
              onClick={() => setActiveTabMode('surprise')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabMode === 'surprise'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-purple-600" />
              Surprise Planner
            </button>
          </div>

          <button
            onClick={() => setMagicButtonModalOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Proactive Magic Idea */}
        {activeTabMode === 'magic' && !primarySuggestion && (
          <div className="space-y-4 relative z-10 text-center py-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900">You're all caught up</h3>
              <p className="text-xs text-zinc-500">No more ideas for today. Try the Surprise Planner or check back tomorrow.</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveTabMode('surprise')}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition-colors"
              >
                Plan a surprise
              </button>
              <button
                onClick={() => setMagicButtonModalOpen(false)}
                className="py-2.5 px-4 text-xs font-bold text-zinc-500 hover:text-zinc-800 rounded-2xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {activeTabMode === 'magic' && primarySuggestion && (
          <div className="space-y-5 relative z-10 overflow-y-auto">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                AI Proactive Spark
              </span>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                One tailored idea for you today:
              </h3>
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70 space-y-2">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                  {primarySuggestion.title}
                </span>
                <p className="text-xs sm:text-sm font-medium text-zinc-800 leading-relaxed">
                  "{primarySuggestion.text}"
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleDismiss}
                className="w-1/3 py-3 text-xs font-bold text-zinc-500 hover:text-zinc-800 rounded-2xl transition-colors"
              >
                {primarySuggestion.dismissable ? 'Dismiss' : 'Close'}
              </button>
              <button
                onClick={handleExecute}
                className="w-2/3 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 transition-all hover:scale-102"
              >
                <span>{primarySuggestion.ctaLabel || "Let's Do It"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Surprise planner */}
        {activeTabMode === 'surprise' && (
          <div className="space-y-4 relative z-10 overflow-y-auto pr-1">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">
                Plan a surprise
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Generate an end-to-end secret surprise date and add it to your calendar without spoiling it for {user?.partnerName || 'your partner'}.
              </p>
            </div>

            {/* Parameter Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Budget Tier</label>
                <select
                  value={surpriseBudget}
                  onChange={(e) => setSurpriseBudget(e.target.value)}
                  className="w-full text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-800 focus:outline-none focus:border-rose-400"
                >
                  <option value="Under ₹1,000">Under ₹1,000 (Budget Cozy)</option>
                  <option value="₹2,000 - ₹5,000">₹2,000 - ₹5,000 (Classic)</option>
                  <option value="₹5,000+">₹5,000+ (Luxury / Milestone)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Time Available</label>
                <select
                  value={surpriseDuration}
                  onChange={(e) => setSurpriseDuration(e.target.value)}
                  className="w-full text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-800 focus:outline-none focus:border-rose-400"
                >
                  <option value="Quick 2 Hours">Quick 2 Hours</option>
                  <option value="Full Evening (3-4 hrs)">Full Evening (3-4 hrs)</option>
                  <option value="All-Day Adventure">All-Day Adventure</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Mood / Vibe</label>
                <select
                  value={surpriseMood}
                  onChange={(e) => setSurpriseMood(e.target.value)}
                  className="w-full text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-800 focus:outline-none focus:border-rose-400"
                >
                  <option value="Romantic & High Spark">Romantic & High Spark</option>
                  <option value="Playful & Adventurous">Playful & Adventurous</option>
                  <option value="Cozy & Low-Stress">Cozy & Low-Stress</option>
                  <option value="Nostalgic Throwback">Nostalgic Throwback</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Location Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSurpriseLocation('together')}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all ${
                      surpriseLocation === 'together'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    Together
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurpriseLocation('long_distance')}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all ${
                      surpriseLocation === 'long_distance'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    LDR / Virtual
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateSurprise}
              disabled={surpriseLoading}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              {surpriseLoading ? 'Crafting Secret Blueprint...' : 'Generate Surprise Blueprint'}
            </button>

            {/* Generated Blueprint View */}
            {generatedSurprise && (
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-3.5 mt-3 animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                      {generatedSurprise.mood}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 mt-1">
                      {generatedSurprise.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 bg-white border border-zinc-200 px-2 py-1 rounded-lg">
                    🔒 Secret
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-rose-500" /> Execution Timeline:
                  </p>
                  <div className="space-y-1">
                    {generatedSurprise.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs bg-white p-2 rounded-xl border border-zinc-100 font-medium">
                        <span className="font-mono text-zinc-400 font-bold text-[10px] shrink-0 mt-0.5">
                          {step.time}
                        </span>
                        <span className="text-zinc-800 text-[11px]">{step.action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pairings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-zinc-100 space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                      <Utensils className="w-3 h-3" /> Food Pairing:
                    </span>
                    <p className="text-[11px] text-zinc-700 font-medium">
                      {generatedSurprise.foodIdea}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-zinc-100 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                      <Music className="w-3 h-3" /> Soundtrack:
                    </span>
                    <p className="text-[11px] text-zinc-700 font-medium">
                      {generatedSurprise.playlistSuggestion}
                    </p>
                  </div>
                </div>

                {/* Secret Closing Gesture */}
                <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 text-xs">
                  <span className="text-[10px] font-bold text-rose-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-600" /> Secret Closing Gesture:
                  </span>
                  <p className="text-[11px] text-rose-950 font-medium mt-0.5">
                    {generatedSurprise.secretClosingGesture}
                  </p>
                </div>

                {/* Calendar Add Button */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleAddSurpriseToCalendar}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    Add as Private Surprise to Calendar
                  </button>
                  <button
                    onClick={handleOpenGoogleCalendar}
                    className="p-2.5 bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-xl text-xs font-bold"
                    title="Export to Google Calendar"
                    aria-label="Export to Google Calendar"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

