import React, { useEffect, useState } from 'react';
import {
  Coffee,
  Eye,
  Heart,
  HeartCrack,
  Lock,
  Mail,
  MessageSquare,
  Search,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { AIService } from '../../services/ai';
import { WantToTextDecision, WingmanStage } from '../../types';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
} from '../common/UIPrimitives';

const NO_CONTACT_KEY = 'lovemate_nocontact_v1';

interface NoContactState {
  /** YYYY-MM-DD the streak started */
  startDate: string | null;
  /** YYYY-MM-DD of the last day the user explicitly logged */
  lastLoggedDate?: string;
}

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const daysBetween = (fromKey: string, toKey: string) =>
  Math.max(0, Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86400000));

function loadNoContact(): NoContactState {
  try {
    const raw = localStorage.getItem(NO_CONTACT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && (parsed.startDate === null || typeof parsed.startDate === 'string')) {
        return { startDate: parsed.startDate, lastLoggedDate: parsed.lastLoggedDate };
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { startDate: null };
}

export const WingmanModeView: React.FC = () => {
  const { user, setActiveTab, showToast, addUserMemory } = useApp();

  const [activeStage, setActiveStage] = useState<WingmanStage>('crush');
  const [showWantToTextModal, setShowWantToTextModal] = useState(false);

  // Emergency Want to Text State
  const [textSituation, setTextSituation] = useState('');
  const [draftText, setDraftText] = useState('');
  const [analyzingText, setAnalyzingText] = useState(false);
  const [decision, setDecision] = useState<WantToTextDecision | null>(null);

  // Moving On No-Contact Tracker State (persisted so it survives reload)
  const [noContact, setNoContact] = useState<NoContactState>(() => loadNoContact());
  const [closureLetter, setClosureLetter] = useState('');
  const [letterLocked, setLetterLocked] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(NO_CONTACT_KEY, JSON.stringify(noContact));
    } catch {
      /* storage unavailable */
    }
  }, [noContact]);

  const today = toDateKey(new Date());
  const noContactDays = noContact.startDate ? daysBetween(noContact.startDate, today) : 0;
  const loggedToday = noContact.lastLoggedDate === today;

  const handleLogNoContactDay = () => {
    if (!noContact.startDate) {
      setNoContact({ startDate: today, lastLoggedDate: today });
      showToast('No-contact streak started today. One day at a time ❤️', 'love');
      return;
    }
    if (loggedToday) {
      showToast('Already logged for today. Come back tomorrow 🌙', 'info');
      return;
    }
    setNoContact((prev) => ({ ...prev, lastLoggedDate: today }));
    showToast('+1 Day of self-respect logged! Stay strong ❤️', 'love');
  };

  const handleResetNoContact = () => {
    if (!window.confirm('Reset your no-contact streak? This starts the count again from today.')) return;
    setNoContact({ startDate: today, lastLoggedDate: today });
    showToast('Streak reset. Starting fresh is still progress.', 'info');
  };

  const handleLockLetter = () => {
    const letter = closureLetter.trim();
    if (!letter) {
      showToast('Write a few lines first, then lock it in the vault.', 'info');
      return;
    }
    addUserMemory({
      userId: user?.id || 'guest',
      category: 'memories',
      content: letter,
      source: 'explicit_user_input',
      confidence: 1,
      visibility: 'private',
      importance: 'high',
      sourceReason: 'Unsent closure letter written in Wingman Moving On mode',
    });
    setLetterLocked(true);
    showToast('Closure letter safely saved in your private vault 🔒', 'love');
  };

  const stages: { id: WingmanStage; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'crush', label: 'Crush', icon: <Eye />, desc: 'Decoding signs, eye contact & opening lines' },
    { id: 'talking', label: 'Talking Stage', icon: <MessageSquare />, desc: 'Keeping momentum alive without playing games' },
    { id: 'first_date', label: 'First Date', icon: <Coffee />, desc: 'Places, conversation sparks & low-pressure endings' },
    { id: 'confession', label: 'Confession', icon: <Mail />, desc: 'Telling them how you feel with dignity' },
    { id: 'dating', label: 'Dating', icon: <Heart />, desc: 'Building intimacy, consistency & trust' },
    { id: 'moving_on', label: 'Moving On', icon: <HeartCrack />, desc: 'Healing, self-care & no-contact support' },
  ];

  const handleEvaluateText = async () => {
    if (!draftText.trim()) {
      showToast('Please type the text you want to send', 'info');
      return;
    }
    setAnalyzingText(true);
    try {
      const res = await AIService.evaluateWantToText(textSituation, draftText);
      setDecision(res);
      showToast('Context analyzed! Review recommendation below 🛑', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Evaluation error', 'info');
    } finally {
      setAnalyzingText(false);
    }
  };

  const linkCardClasses =
    'p-4 rounded-2xl bg-white border border-zinc-200 hover:border-rose-300 hover:shadow-xs text-left space-y-1 transition-all';

  return (
    <PageContainer>
      <PageHeader
        icon={<Target />}
        title="Wingman mode"
        subtitle="Wherever you are on the relationship map, from crushing to healing, your AI companion has your back."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setDecision(null);
              setShowWantToTextModal(true);
            }}
            icon={<MessageSquare className="w-4 h-4" />}
          >
            I want to text them
          </Button>
        }
      />

      {/* Stage Pickers */}
      <div className="flex flex-wrap gap-2">
        {stages.map((st) => (
          <Chip key={st.id} selected={activeStage === st.id} icon={st.icon} onClick={() => setActiveStage(st.id)}>
            {st.label}
          </Chip>
        ))}
      </div>

      {/* Stage Specific Guides */}
      {activeStage === 'crush' && (
        <Card padding="lg" className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Crush playbook: signs, timing and first texts</h3>
            <p className="text-sm text-zinc-600 leading-relaxed mt-1">
              Don't look for certainty from one message. Look for conversation revival, callback humor to previous conversations, and lingering eye contact in group settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button type="button" onClick={() => setActiveTab('decode')} className={linkCardClasses}>
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-rose-500" /> Decode their text
              </span>
              <p className="text-xs text-zinc-500">Analyze subtext without overinterpreting.</p>
            </button>
            <button type="button" onClick={() => setActiveTab('crush-analyzer')} className={linkCardClasses}>
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-500" /> Crush signal audit
              </span>
              <p className="text-xs text-zinc-500">Calculate green and yellow micro-signals.</p>
            </button>
            <button type="button" onClick={() => setActiveTab('reply')} className={linkCardClasses}>
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" /> What should I reply?
              </span>
              <p className="text-xs text-zinc-500">Generate playful, high-EQ openers.</p>
            </button>
          </div>
        </Card>
      )}

      {activeStage === 'talking' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Talking stage: keeping flow without anxiety</h3>
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-700 leading-relaxed">
            <strong className="text-zinc-900">Golden rule of modern texting:</strong> Match their energy and length. If someone is slow, don't double text three paragraphs. Give them space to wonder about you.
          </div>
          <Button variant="primary" onClick={() => setActiveTab('reply-copilot')}>
            Open the reply copilot
          </Button>
        </Card>
      )}

      {activeStage === 'first_date' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Planning the first date</h3>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Aim for active, low-pressure activities rather than a rigid 2-hour formal dinner where you feel interrogated.
          </p>
          <Button variant="primary" onClick={() => setActiveTab('date-planner')}>
            Generate a date itinerary
          </Button>
        </Card>
      )}

      {activeStage === 'confession' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Confession readiness</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => setActiveTab('should-confess')} className={linkCardClasses}>
              <span className="text-xs font-bold text-zinc-900 block">Should I confess?</span>
              <p className="text-xs text-zinc-500">Readiness assessment and confidence rating.</p>
            </button>
            <button type="button" onClick={() => setActiveTab('confession')} className={linkCardClasses}>
              <span className="text-xs font-bold text-zinc-900 block">Write a confession</span>
              <p className="text-xs text-zinc-500">Sincere, low-pressure heartfelt confessions.</p>
            </button>
          </div>
        </Card>
      )}

      {activeStage === 'dating' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Dating and long-term connection</h3>
          <p className="text-sm text-zinc-600">
            Turn communication into an ongoing habit. Invite your partner to a synchronized room.
          </p>
          <Button variant="primary" onClick={() => setActiveTab('couple-mode')}>
            Open Couple Mode
          </Button>
        </Card>
      )}

      {/* Moving On Mode (Requirement 46) */}
      {activeStage === 'moving_on' && (
        <div className="space-y-6 animate-in fade-in">
          {/* No-Contact Counter */}
          <Card padding="lg" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Badge variant="rose">No-contact streak</Badge>
              <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-500" />{' '}
                {noContact.startDate ? `${noContactDays} ${noContactDays === 1 ? 'day' : 'days'} strong` : 'Not started yet'}
              </h3>
              <p className="text-xs text-zinc-500">
                {noContact.startDate
                  ? `Counting since ${parseDateKey(noContact.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Every day without breaking boundary gives your nervous system space to heal.`
                  : 'Start the streak today. Every day without breaking boundary gives your nervous system space to heal.'}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <Button variant="secondary" onClick={handleLogNoContactDay} disabled={loggedToday}>
                {!noContact.startDate ? 'Start no-contact streak' : loggedToday ? 'Logged for today' : 'Log today free of contact'}
              </Button>
              {noContact.startDate && (
                <Button variant="ghost" size="sm" onClick={handleResetNoContact}>
                  Reset streak
                </Button>
              )}
            </div>
          </Card>

          {/* Unsent Closure Letter Vault */}
          <Card className="space-y-3">
            <h4 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-500" /> Unsent closure letter
            </h4>
            <p className="text-xs text-zinc-500">
              Write everything you wish you could say. It stays private here and will never be sent.
            </p>
            <Textarea
              rows={4}
              value={closureLetter}
              onChange={(e) => {
                setClosureLetter(e.target.value);
                setLetterLocked(false);
              }}
              placeholder="Write your raw, honest thoughts without filtering..."
            />
            <Button variant="secondary" onClick={handleLockLetter} disabled={letterLocked || !closureLetter.trim()}>
              {letterLocked ? 'Locked in private vault' : 'Lock in private vault'}
            </Button>
          </Card>
        </div>
      )}

      {/* Emergency "I Want To Text Them" Modal Flow (Requirement 47) */}
      {showWantToTextModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-5">
            {/* Step 1 Header */}
            <div className="space-y-1.5">
              <Badge variant="rose">Step 1: deep breath</Badge>
              <h3 className="text-xl font-bold text-zinc-900">Don't send anything yet.</h3>
              <p className="text-xs text-zinc-500">
                Adrenaline makes us send texts that feel urgent right now, but cause regret 2 hours later. Let's look at it together.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <FieldLabel>What happened right before this urge?</FieldLabel>
                <Input
                  type="text"
                  value={textSituation}
                  onChange={(e) => setTextSituation(e.target.value)}
                  placeholder="e.g. Saw their story or they left me on delivered for 5 hours..."
                />
              </div>

              <div>
                <FieldLabel>What text were you about to send?</FieldLabel>
                <Textarea
                  rows={3}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Type the exact text here..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" className="w-1/3" onClick={() => setShowWantToTextModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                className="w-2/3"
                onClick={handleEvaluateText}
                disabled={!draftText.trim()}
                loading={analyzingText}
              >
                Evaluate my text
              </Button>
            </div>

            {/* Step 3: Analysis Decision Output */}
            {decision && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                  <span className="uppercase tracking-wider text-zinc-500">Wingman verdict</span>
                  <Badge
                    size="md"
                    variant={
                      decision.recommendation === 'send'
                        ? 'emerald'
                        : decision.recommendation === 'wait'
                        ? 'amber'
                        : 'rose'
                    }
                  >
                    {decision.recommendation === 'send'
                      ? 'Safe to send'
                      : decision.recommendation === 'wait'
                      ? `Wait ${decision.delayHours || 2} hours`
                      : 'Rewrite to de-escalate'}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-700 leading-relaxed">{decision.reasoning}</p>

                {decision.polishedText && (
                  <div className="bg-white p-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900">
                    Better script: "{decision.polishedText}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
