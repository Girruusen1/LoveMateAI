import React, { useState } from 'react';
import { ArrowRight, Dices, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { GeneratedGameSession } from '../../types';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  PageContainer,
  PageHeader,
  Select,
  ToolLayout,
} from '../common/UIPrimitives';

export const InfiniteGamesView: React.FC = () => {
  const { user, addPoints, triggerConfetti, showToast } = useApp();

  const [stage, setStage] = useState('Dating');
  const [mood, setMood] = useState<'funny' | 'spicy' | 'deep' | 'nostalgic'>('funny');
  const [duration, setDuration] = useState(10);
  const [players, setPlayers] = useState(2);
  const [loading, setLoading] = useState(false);

  const [activeSession, setActiveSession] = useState<GeneratedGameSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const handleGenerateGame = async () => {
    setLoading(true);
    setSessionCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    try {
      const res = await AIService.generateInfiniteGame(stage, mood, duration, players);
      setActiveSession(res);
      showToast(`Generated: ${res.title}! 🎮`, 'love');
    } catch (e) {
      showToast('Game generation error', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!activeSession) return;
    if (currentQuestionIndex < activeSession.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      addPoints(30, 'Completed AI Game Session');
      triggerConfetti();
      showToast('🎉 Game Completed! +30 Love Points', 'success');
    }
  };

  const form = (
    <Card className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-zinc-900">Set up your game</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Pick a stage, mood and length. We generate a fresh set of prompts every time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel>Relationship stage</FieldLabel>
          <Select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="Talking Stage">Talking Stage</option>
            <option value="Crush / Flirting">Crush / Flirting</option>
            <option value="First Dates">First Dates</option>
            <option value="Dating">Dating</option>
            <option value="Long Term">Long Term</option>
            <option value="Long Distance">Long Distance</option>
          </Select>
        </div>

        <div>
          <FieldLabel>Mood</FieldLabel>
          <Select value={mood} onChange={(e) => setMood(e.target.value as any)}>
            <option value="funny">Funny and playful</option>
            <option value="spicy">Flirty and spicy</option>
            <option value="deep">Deep and vulnerable</option>
            <option value="nostalgic">Nostalgic moments</option>
          </Select>
        </div>

        <div>
          <FieldLabel>Duration</FieldLabel>
          <Select value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))}>
            <option value={5}>5 minute sprint</option>
            <option value={10}>10 minute game</option>
            <option value={20}>20 minute deep dive</option>
          </Select>
        </div>

        <div>
          <FieldLabel>Players</FieldLabel>
          <Select value={players} onChange={(e) => setPlayers(parseInt(e.target.value, 10))}>
            <option value={2}>2 people (couple)</option>
            <option value={1}>Solo practice</option>
          </Select>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleGenerateGame}
        loading={loading}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Generate a game
      </Button>
    </Card>
  );

  const result =
    activeSession && !sessionCompleted ? (
      <div className="space-y-4">
        <Card padding="lg" className="space-y-6 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-100 pb-4">
            <Badge variant="rose">{activeSession.gameType}</Badge>
            <span className="font-mono font-bold text-zinc-600">
              Question {currentQuestionIndex + 1} of {activeSession.questions.length}
            </span>
          </div>

          {/* Current Question Display */}
          <div className="py-4 text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-snug">
              "{activeSession.questions[currentQuestionIndex].prompt}"
            </h2>

            {/* If Multiple Choice Options */}
            {activeSession.questions[currentQuestionIndex].options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {activeSession.questions[currentQuestionIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserAnswers({ ...userAnswers, [currentQuestionIndex]: opt });
                      showToast(`Selected: ${opt}`, 'love');
                    }}
                    className={`p-4 rounded-2xl border text-xs font-bold transition-all ${
                      userAnswers[currentQuestionIndex] === opt
                        ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              onClick={handleNextQuestion}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              iconPosition="right"
            >
              {currentQuestionIndex === activeSession.questions.length - 1 ? 'Finish game' : 'Next question'}
            </Button>
          </div>
        </Card>
      </div>
    ) : sessionCompleted ? (
      <div className="space-y-4">
        <Card padding="lg" className="text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Game completed</h2>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            {user?.name || 'You'} finished all {activeSession?.questions.length} connection prompts. A great relationship is made of these little shared minutes.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button variant="primary" onClick={handleGenerateGame} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              New game
            </Button>
          </div>
        </Card>
      </div>
    ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Dices />}
        title="Infinite games"
        subtitle="Generate an endless variety of couple games tailored to your relationship stage, mood and available time."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <Dices />,
          title: 'Your game will appear here',
          description: 'Choose a stage and mood on the left, then generate a fresh set of prompts to play together.',
        }}
      />
    </PageContainer>
  );
};
