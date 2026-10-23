import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Brain,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Heart,
  Lock,
  LogOut,
  Mail,
  Plus,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
} from '../common/UIPrimitives';

const CHECKIN_KEY = 'lovemate_couple_checkin_v1';
const QUIZ_KEY = 'lovemate_couple_quiz_v1';
const ROOM_CODE_RE = /^LOVE-[A-Z0-9]{4}$/;

type Choice = 'A' | 'B';
interface QuizState {
  roomCode: string | null;
  mine: Record<string, Choice>;
  partner: Record<string, Choice>;
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
};

const loadQuiz = (roomCode: string | null): QuizState => {
  try {
    const raw = readStorage(QUIZ_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuizState;
      // Partner answers belong to a specific room; a different room starts fresh on the partner side
      if (parsed && parsed.mine && parsed.partner) {
        return parsed.roomCode === roomCode ? parsed : { roomCode, mine: parsed.mine, partner: {} };
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { roomCode, mine: {}, partner: {} };
};

export const CoupleModeView: React.FC = () => {
  const {
    user,
    coupleRoom,
    createCoupleRoom,
    joinCoupleRoom,
    leaveCoupleRoom,
    coupleStreak,
    incrementCoupleStreak,
    addPoints,
    showToast,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'know_me_better' | 'streak' | 'invite'>('know_me_better');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(() => readStorage(CHECKIN_KEY));

  const myName = user?.name || 'You';
  // The other side is always the partner, never the current user (avoids "Rahul & Rahul")
  const partnerDisplayName =
    user?.partnerName ||
    [coupleRoom?.creatorName, coupleRoom?.partnerName].find((n) => n && n !== myName) ||
    'your partner';
  const isConnected = coupleRoom?.status === 'connected';
  const isMyRoom = !!coupleRoom && coupleRoom.creatorName === myName;

  // Know Me Better Interactive Questions
  const questions = [
    {
      id: 'kmb_1',
      question: 'What is your idea of a perfect Saturday evening?',
      optionA: 'Cozy couch, candles & binge-watching a movie',
      optionB: 'Exploring a bustling street food market or night drive',
      category: 'Lifestyle',
    },
    {
      id: 'kmb_2',
      question: 'When you are deeply stressed, what do you need first?',
      optionA: 'Quiet space to process alone for an hour',
      optionB: 'A long hug and talking through it immediately',
      category: 'Emotional Needs',
    },
    {
      id: 'kmb_3',
      question: 'In spending money, what gives you the most happiness?',
      optionA: 'Memorable travel experiences and delicious food',
      optionB: 'Investing in comfortable home aesthetics & tech',
      category: 'Finances',
    },
  ];

  const [quiz, setQuiz] = useState<QuizState>(() => loadQuiz(coupleRoom?.roomCode ?? null));

  // Partner answers are tied to the current room
  useEffect(() => {
    const code = coupleRoom?.roomCode ?? null;
    setQuiz((prev) => (prev.roomCode === code ? prev : { roomCode: code, mine: prev.mine, partner: {} }));
  }, [coupleRoom?.roomCode]);

  useEffect(() => {
    writeStorage(QUIZ_KEY, JSON.stringify(quiz));
  }, [quiz]);

  const myAnsweredCount = questions.filter((q) => quiz.mine[q.id]).length;
  const partnerAnsweredCount = questions.filter((q) => quiz.partner[q.id]).length;
  const pairs = questions
    .filter((q) => quiz.mine[q.id] && quiz.partner[q.id])
    .map((q) => ({ q, mine: quiz.mine[q.id], partner: quiz.partner[q.id] }));
  const matched = pairs.filter((p) => p.mine === p.partner);
  const differed = pairs.filter((p) => p.mine !== p.partner);
  const optionText = (q: (typeof questions)[number], c: Choice) => (c === 'A' ? q.optionA : q.optionB);

  const handleSelectAnswer = (qId: string, choice: Choice) => {
    const firstTime = !quiz.mine[qId];
    setQuiz((prev) => ({ ...prev, mine: { ...prev.mine, [qId]: choice } }));
    if (firstTime) addPoints(10, 'Answered Couple Question');
  };

  const handleSelectPartnerAnswer = (qId: string, choice: Choice) => {
    setQuiz((prev) => ({ ...prev, partner: { ...prev.partner, [qId]: choice } }));
  };

  const handleCreateRoom = () => {
    createCoupleRoom('know_me_better');
    setJoinError(null);
  };

  const handleLeaveRoom = () => {
    if (!coupleRoom) return;
    if (!window.confirm(`Leave room ${coupleRoom.roomCode}? You can create or join another room any time.`)) return;
    leaveCoupleRoom();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = inputCode.trim().toUpperCase();
    if (!ROOM_CODE_RE.test(normalized)) {
      setJoinError('Room codes look like LOVE-AB12: "LOVE-" followed by 4 letters or numbers.');
      return;
    }
    if (isMyRoom && coupleRoom?.roomCode === normalized) {
      setJoinError("That's your own room code. Share it with your partner so they can join you.");
      return;
    }
    setJoinError(null);
    if (joinCoupleRoom(normalized)) {
      setInputCode('');
    } else {
      setJoinError("Couldn't join that room. Check the code with your partner and try again.");
    }
  };

  const handleCopyInviteLink = async () => {
    if (!coupleRoom) {
      showToast('Create a room first, then share the invite link.', 'info');
      return;
    }
    const link = `${window.location.origin}/?room=${coupleRoom.roomCode}&partner=${encodeURIComponent(myName)}`;
    const ok = await copyText(link);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setInviteCopied(true);
    showToast('Couple invite link copied to clipboard! 💌', 'love');
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const today = todayKey();
  const checkedInToday = lastCheckIn === today;

  const handleCheckIn = () => {
    if (readStorage(CHECKIN_KEY) === today) {
      setLastCheckIn(today);
      showToast('You already checked in today. Come back tomorrow to keep the streak going.', 'info');
      return;
    }
    incrementCoupleStreak();
    writeStorage(CHECKIN_KEY, today);
    setLastCheckIn(today);
  };

  // Position in the current 7-day cycle, derived from the real streak count
  let cycleDone = coupleStreak === 0 ? 0 : ((coupleStreak - 1) % 7) + 1;
  if (!checkedInToday && cycleDone === 7) cycleDone = 0; // next check-in starts a new week
  const streakLabels = ['Appreciation', 'Memories', 'Future', 'Deep Chat', 'Playful Banter', 'Compliments', 'Reflection'];
  const streakDays = streakLabels.map((label, i) => ({
    day: `Day ${i + 1}`,
    label,
    done: i < cycleDone,
    active: !checkedInToday && i === cycleDone,
  }));

  const roomBadge = !coupleRoom ? (
    <Badge variant="zinc">No room yet</Badge>
  ) : isConnected ? (
    <Badge variant="emerald">Connected</Badge>
  ) : (
    <Badge variant="amber">Waiting for partner</Badge>
  );

  const conversationPrompt =
    differed.length > 0
      ? `You see "${differed[0].q.question.toLowerCase().replace(/\?$/, '')}" differently. What would a middle ground look like that leaves neither of you feeling ignored?`
      : matched.length > 0
      ? `You matched on ${matched.map((m) => m.q.category.toLowerCase()).join(', ')}. What is one small plan this week that celebrates that?`
      : null;

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Users />}
        title="Couple mode"
        subtitle="Invite your partner into a private shared room. Compare answers privately, discover similarities and build lasting streaks."
        actions={
          <>
            <Button
              variant="secondary"
              icon={inviteCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyInviteLink}
              disabled={!coupleRoom}
            >
              {inviteCopied ? 'Link copied' : 'Copy invite link'}
            </Button>
            <Button variant="primary" icon={<Flame className="w-4 h-4" />} onClick={handleCheckIn} disabled={checkedInToday}>
              Streak ({coupleStreak}d)
            </Button>
          </>
        }
      />

      {/* Room status */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900">
                {myName} & {partnerDisplayName}
              </h3>
              {roomBadge}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {coupleRoom ? (
                <>
                  Room code: <strong className="font-mono text-zinc-900">{coupleRoom.roomCode}</strong>
                  {' · '}created by {isMyRoom ? 'you' : coupleRoom.creatorName}
                </>
              ) : (
                'Create a room or join your partner’s room to start.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {coupleRoom ? (
            <Button variant="ghost" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} onClick={handleLeaveRoom}>
              Leave room
            </Button>
          ) : (
            <>
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleCreateRoom}>
                Create room
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActiveSubTab('invite')}>
                Join with a code
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex flex-wrap gap-2">
        <Chip selected={activeSubTab === 'know_me_better'} onClick={() => setActiveSubTab('know_me_better')} icon={<Brain />}>
          Know me better
        </Chip>
        <Chip selected={activeSubTab === 'streak'} onClick={() => setActiveSubTab('streak')} icon={<Flame />}>
          Couple streak
        </Chip>
        <Chip selected={activeSubTab === 'invite'} onClick={() => setActiveSubTab('invite')} icon={<Mail />}>
          Invite & room code
        </Chip>
      </div>

      {/* Tab 1: Know Me Better */}
      {activeSubTab === 'know_me_better' && (
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Synchronized quiz</h3>
                <p className="text-xs text-zinc-500">
                  {isConnected
                    ? `Pick your answer, then pass the phone so ${partnerDisplayName} can pick theirs. Matches reveal once you both answer.`
                    : 'Select your true choice privately. Results reveal once your partner joins the room and answers.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <Badge variant="rose" size="md">
                  You: {myAnsweredCount} of {questions.length}
                </Badge>
                <Badge variant={isConnected ? 'purple' : 'zinc'} size="md">
                  {isConnected ? `${partnerDisplayName}: ${partnerAnsweredCount} of ${questions.length}` : 'Waiting for partner'}
                </Badge>
              </div>
            </div>

            <div className="space-y-5">
              {questions.map((q) => {
                const myAns = quiz.mine[q.id];
                const partnerAns = quiz.partner[q.id];
                const bothAnswered = !!myAns && !!partnerAns;
                const isMatch = bothAnswered && myAns === partnerAns;

                return (
                  <div key={q.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-500">{q.category}</span>
                      {bothAnswered && (
                        <Badge variant={isMatch ? 'emerald' : 'zinc'}>{isMatch ? 'Perfect match' : 'Different perspectives'}</Badge>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900">{q.question}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(['A', 'B'] as const).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => handleSelectAnswer(q.id, choice)}
                          aria-pressed={myAns === choice}
                          className={`p-3 rounded-xl border text-xs text-left transition-all ${
                            myAns === choice
                              ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                              : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          {choice}) {optionText(q, choice)}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 pt-1">
                      <span className="font-semibold">{partnerDisplayName}:</span>
                      {!isConnected ? (
                        <span className="italic">Waiting for partner</span>
                      ) : (
                        (['A', 'B'] as const).map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handleSelectPartnerAnswer(q.id, choice)}
                            aria-pressed={partnerAns === choice}
                            aria-label={`${partnerDisplayName} picks option ${choice}`}
                            className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                              partnerAns === choice
                                ? 'bg-purple-50 border-purple-300 text-purple-800'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            {choice}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Synthesis */}
          <Card className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-zinc-900">Couple synthesis</h3>
            </div>

            {pairs.length === 0 ? (
              <p className="text-xs text-zinc-500">
                {isConnected
                  ? `Once you and ${partnerDisplayName} both answer a question, you'll see where you match and where you differ.`
                  : 'Waiting for partner. Create or join a room so your partner can answer too.'}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1.5 text-xs text-zinc-700">
                    <span className="font-bold text-emerald-900 block">You both harmonize on</span>
                    {matched.length === 0 ? (
                      <p>No matches yet on the questions you've both answered.</p>
                    ) : (
                      matched.map((m) => (
                        <p key={m.q.id}>
                          • {m.q.category}: {optionText(m.q, m.mine)}
                        </p>
                      ))
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs text-zinc-700">
                    <span className="font-bold text-zinc-900 block">Where you see things differently</span>
                    {differed.length === 0 ? (
                      <p>No differences on the questions you've both answered.</p>
                    ) : (
                      differed.map((d) => (
                        <p key={d.q.id}>
                          • {d.q.category}: you chose "{optionText(d.q, d.mine)}", {partnerDisplayName} chose "
                          {optionText(d.q, d.partner)}"
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {conversationPrompt && (
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs text-zinc-800 space-y-2">
                    <span className="font-bold text-rose-900 block">A conversation prompt for tonight</span>
                    <p className="italic bg-white p-3 rounded-xl border border-rose-100">"{conversationPrompt}"</p>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Couple Streaks */}
      {activeSubTab === 'streak' && (
        <Card className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center">
              <Flame className="w-7 h-7 fill-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">{coupleStreak} day couple streak</h3>
            <p className="text-xs text-zinc-500">
              Completing one micro-activity together each day builds steady emotional intimacy.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            {streakDays.map((d, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-between gap-1.5 ${
                  d.done
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : d.active
                    ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-200'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                }`}
              >
                <span className="font-bold text-[10px]">{d.day}</span>
                {d.done ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                ) : d.active ? (
                  <Star className="w-5 h-5 text-rose-500 fill-rose-500" />
                ) : (
                  <Lock className="w-5 h-5 text-zinc-400" />
                )}
                <span className="text-[10px] font-semibold line-clamp-1">{d.label}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="primary" onClick={handleCheckIn} disabled={checkedInToday}>
              {checkedInToday ? 'Checked in today. See you tomorrow' : "Complete today's activity (+20 points)"}
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 3: Invite Partner & Join Room */}
      {activeSubTab === 'invite' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-zinc-900">Your private room code</h4>
              <p className="text-xs text-zinc-500">
                {coupleRoom ? 'Share it with your partner to pair accounts.' : 'Create a room to get a code your partner can enter.'}
              </p>
            </div>
            {coupleRoom ? (
              <>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-center font-mono text-xl font-bold text-zinc-900 tracking-wider">
                  {coupleRoom.roomCode}
                </div>
                <Button variant="primary" className="w-full" onClick={handleCopyInviteLink}>
                  Copy full invite link
                </Button>
                <Button variant="ghost" className="w-full" icon={<LogOut className="w-4 h-4" />} onClick={handleLeaveRoom}>
                  Leave room
                </Button>
              </>
            ) : (
              <Button variant="primary" className="w-full" icon={<Plus className="w-4 h-4" />} onClick={handleCreateRoom}>
                Create room
              </Button>
            )}
          </Card>

          <Card className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-zinc-900">Join an existing room</h4>
              <p className="text-xs text-zinc-500">Enter the code your partner shared with you.</p>
            </div>
            <form onSubmit={handleJoin} className="space-y-3" noValidate>
              <div>
                <FieldLabel>Partner's code</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. LOVE-AB12"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    if (joinError) setJoinError(null);
                  }}
                  className="text-center font-mono uppercase"
                  maxLength={9}
                  aria-invalid={!!joinError}
                  aria-describedby={joinError ? 'join-room-error' : undefined}
                />
                {joinError && (
                  <p id="join-room-error" role="alert" className="mt-1.5 text-xs font-semibold text-rose-600 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {joinError}
                  </p>
                )}
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={!inputCode.trim()}>
                Join room
              </Button>
            </form>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};
