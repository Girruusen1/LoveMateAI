import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Coffee, Compass, Flame, Heart, HeartCrack, Laugh, Mail, MessageCircle, Smile, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useT } from '../../i18n';
import { Language, Situation } from '../../types';
import { SITUATIONS } from '../../utils/situations';

/* Option labels are stored on the user record in English; `t()` only changes what is displayed. */
const GOAL_OPTIONS = [
  { label: 'Crush', icon: <Heart />, desc: 'Decoding signs & making a move' },
  { label: 'Relationship', icon: <Heart />, desc: 'Strengthening our connection' },
  { label: 'Want to confess', icon: <Mail />, desc: 'Crafting the perfect confession' },
  { label: 'Need conversation help', icon: <MessageCircle />, desc: 'Never run out of things to say' },
  { label: 'Couple fun & games', icon: <Smile />, desc: 'Playful questions & spark renewers' },
  { label: 'Relationship problems', icon: <HeartCrack />, desc: 'Resolving fights & boundaries' },
  { label: 'Just exploring', icon: <Compass />, desc: 'Curious about AI relationship tools' },
];

const LANGUAGE_OPTIONS: { id: Language; label: string; desc: string; sample: string }[] = [
  { id: 'hinglish', label: 'Hinglish', desc: 'Natural, playful, modern Indian conversational vibe', sample: '“Bhai tension mat le, mast text likhte hain!”' },
  { id: 'english', label: 'English', desc: 'Clean, modern, high-EQ international phrasing', sample: '“Let’s craft a thoughtful, confident reply.”' },
  { id: 'roman_hindi', label: 'Roman Hindi', desc: 'Hindi written in English alphabet', sample: '“Aap unhe seedha coffee ke liye pooch sakte hain.”' },
  { id: 'hindi', label: 'Hindi (हिंदी)', desc: 'Pure, poetic, respectful Devanagari script', sample: '“सच्चा प्रेम हमेशा धैर्य और सम्मान मांगता है।”' },
];

const VIBE_OPTIONS = [
  { label: 'Cute & Playful', icon: <Smile />, desc: 'Sweet, lighthearted, warm emojis' },
  { label: 'Romantic & Deep', icon: <Heart />, desc: 'Poetic, expressive, emotional resonance' },
  { label: 'Funny & Banter', icon: <Laugh />, desc: 'Witty teasing, memes, casual energy' },
  { label: 'Chill & Casual', icon: <Coffee />, desc: 'No pressure, easygoing, unbothered' },
  { label: 'Direct & Savage', icon: <Flame />, desc: 'Honest reality checks from a true bestie' },
  { label: 'Emotional & Supportive', icon: '🥹', desc: 'Deep listener, validating, compassionate' },
];

export const OnboardingModal: React.FC = () => {
  const { onboardingOpen, setOnboardingOpen, completeOnboarding, user } = useApp();
  const { t } = useT();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Crush', 'Need conversation help']);
  const [chatLanguage, setChatLanguage] = useState<Language>('hinglish');
  const [vibe, setVibe] = useState('Romantic & Playful');
  const [situation, setSituation] = useState<Situation | null>(user?.situation ?? null);

  // Re-seed the form from the user who just signed up each time the modal opens
  useEffect(() => {
    if (onboardingOpen) {
      setStep(1);
      setName(user?.name || '');
      setSelectedGoals(user?.goals?.length ? user.goals : []);
      setSituation(user?.situation ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingOpen]);

  if (!onboardingOpen) return null;

  const toggleGoal = (goalLabel: string) => {
    if (selectedGoals.includes(goalLabel)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goalLabel));
    } else {
      setSelectedGoals([...selectedGoals, goalLabel]);
    }
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      completeOnboarding({
        name: name || user?.name || 'Explorer',
        goals: selectedGoals,
        situation,
        chatLanguage,
        vibe,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden relative">
        {/* Progress Bar Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-semibold text-rose-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {t('Step {step} of 6', { step })}
            </span>
            <span className="flex items-center gap-3">
              {t('{pct}% Complete', { pct: Math.round((step / 5) * 100) })}
              <button type="button" onClick={() => setOnboardingOpen(false)} className="text-zinc-400 hover:text-zinc-700 underline-offset-2 hover:underline">
                {t('Skip for now')}
              </button>
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-600 rounded-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="p-6 pt-4">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">👋</div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{t('Hey! What should we call you?')}</h3>
                <p className="text-xs text-zinc-500 mt-1">{t('Your AI wingman keeps everything confidential.')}</p>
              </div>

              <input
                type="text"
                autoFocus
                placeholder={t('Enter your first name or nickname')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-hidden focus:border-rose-500 focus:bg-white text-zinc-900 font-medium"
              />

              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start gap-2.5">
                <span className="text-base">🔒</span>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {t('We respect your privacy. LoveMate AI never exposes your name publicly and never shares your chat logs.')}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: What is your situation? Picks the five tools shown first on the home page. */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{t("What's your situation right now?")}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{t("We'll put the right tools first. You can change this anytime in your profile.")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SITUATIONS.map((opt) => {
                  const isSelected = situation === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSituation(opt.id)}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-200' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                      }`}
                    >
                      <span className="text-xl leading-none mt-0.5">{opt.emoji}</span>
                      <span>
                        <span className="block text-xs font-semibold text-zinc-900">{t(opt.label)}</span>
                        <span className="block text-[10px] text-zinc-500 leading-tight mt-0.5">{t(opt.description)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: What brings you here? */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{t('What brings you to LoveMate?')}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{t('Choose all that resonate with you right now.')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.label);
                  return (
                    <button
                      key={goal.label}
                      type="button"
                      onClick={() => toggleGoal(goal.label)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-2 ${
                        isSelected ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-200' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-8 h-8 shrink-0 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">{goal.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">{t(goal.label)}</p>
                          <p className="text-[10px] text-zinc-500 leading-tight">{t(goal.desc)}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-rose-500 text-white' : 'border border-zinc-300'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: How do you like to chat? */}
          {step === 4 && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{t('How do you like to chat?')}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{t('LoveMate automatically adapts to your natural conversational rhythm.')}</p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = chatLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setChatLanguage(lang.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between ${
                        isSelected ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-200' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900">{t(lang.label)}</span>
                          {lang.id === 'hinglish' && <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">{t('Most Popular')}</span>}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{t(lang.desc)}</p>
                        <p className="text-[11px] text-rose-600/90 font-medium italic mt-1">{lang.sample}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-1 ${isSelected ? 'bg-rose-500 text-white' : 'border border-zinc-300'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: What's your vibe? */}
          {step === 5 && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{t("What's your primary dating vibe?")}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{t('This shapes reply suggestions and confession tones.')}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {VIBE_OPTIONS.map((v) => {
                  const isSelected = vibe === v.label;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setVibe(v.label)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-200' : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200'
                      }`}
                    >
                      <span className="w-8 h-8 mb-1.5 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">{v.icon}</span>
                      <p className="text-xs font-bold text-zinc-900">{t(v.label)}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{t(v.desc)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 6: You're all set */}
          {step === 6 && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-200">
                <Heart className="w-8 h-8 text-white fill-white animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">{t("You're all set, {name}", { name: name || t('friend') })}</h3>
                <p className="text-sm text-zinc-600 mt-1 max-w-xs mx-auto">{t("“Let's figure out love together.” Your private AI wingman is ready to assist.")}</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-1.5 text-xs text-zinc-700">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('Language:')}</span>
                  <span className="font-semibold text-rose-700 uppercase">{chatLanguage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('Your Vibe:')}</span>
                  <span className="font-semibold text-rose-700">{t(vibe)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t('Welcome Bonus:')}</span>
                  <span className="font-semibold text-amber-600">{t('+100 Love Points')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex items-center justify-between pt-5 border-t border-zinc-100 mt-4">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-3 py-2">
                {t('Back')}
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-rose-200 flex items-center gap-2 transition-all hover:scale-102"
            >
              <span>{step === 6 ? t('Start Exploring') : t('Continue')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
