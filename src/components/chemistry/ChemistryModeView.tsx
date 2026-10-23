import React, { useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  FlaskConical,
  Heart,
  Lightbulb,
  Smile,
  Sprout,
  Users,
  Waves,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CHEMISTRY_QUESTIONS } from '../../data/seedData';
import { ChemistryQuestion } from '../../types';
import { Badge, Button, Card, Input, PageContainer, PageHeader } from '../common/UIPrimitives';

export const ChemistryModeView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti, setActiveTab } = useApp();

  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3 | 4>(1);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [showWhy, setShowWhy] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [answerInput, setAnswerInput] = useState('');

  const questionsForLevel = CHEMISTRY_QUESTIONS.filter((q) => q.level === currentLevel);
  const currentQuestion: ChemistryQuestion = questionsForLevel[questionIdx % questionsForLevel.length] || CHEMISTRY_QUESTIONS[0];

  const levels: { level: 1 | 2 | 3 | 4; label: string; icon: React.ReactNode; desc: string }[] = [
    { level: 1, label: 'Level 1: Fun', icon: <Smile />, desc: 'Playful icebreakers and creative banter' },
    { level: 2, label: 'Level 2: Personal', icon: <Sprout />, desc: 'Childhood nostalgia and authentic habits' },
    { level: 3, label: 'Level 3: Deep', icon: <Waves />, desc: 'Values, fears, trust boundaries and dreams' },
    { level: 4, label: 'Level 4: Romantic', icon: <Heart />, desc: 'Sparks, attraction and future visions' },
  ];

  const handleNext = () => {
    setShowWhy(false);
    setAnswerInput('');
    if (questionIdx + 1 < questionsForLevel.length) {
      setQuestionIdx((prev) => prev + 1);
    } else if (currentLevel < 4) {
      setCurrentLevel((prev) => (prev + 1) as any);
      setQuestionIdx(0);
      triggerConfetti();
      showToast(`Level ${currentLevel + 1} Unlocked! ✨`, 'love');
    } else {
      setQuestionIdx((prev) => prev + 1);
    }
    addPoints(10);
  };

  const handleSaveAnswer = () => {
    if (!answerInput.trim()) return;
    setSavedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answerInput }));
    addPoints(15, 'Saved Intimacy Response');
    showToast('Reflection saved to memory ❤️', 'love');
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<FlaskConical />}
        title="Chemistry mode"
        subtitle="Deepen your connection through four progressive levels of conversational intimacy."
      />

      {/* Level Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {levels.map((lvl) => {
          const isActive = currentLevel === lvl.level;
          return (
            <button
              key={lvl.level}
              type="button"
              onClick={() => {
                setCurrentLevel(lvl.level);
                setQuestionIdx(0);
                setShowWhy(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-200 shadow-xs'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}
            >
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 [&>svg]:w-4 [&>svg]:h-4 ${
                  isActive ? 'bg-rose-600 text-white' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {lvl.icon}
              </span>
              <p className="text-xs font-bold leading-tight">{lvl.label}</p>
              <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{lvl.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Question Card */}
      <Card padding="lg" className="min-h-[380px] flex flex-col justify-between space-y-6">
        {/* Top Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <Badge variant="rose">{currentQuestion.levelTitle}</Badge>

          <button
            onClick={() => setActiveTab('couple-mode')}
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Play with your partner in Couple Mode</span>
          </button>
        </div>

        {/* Question Text */}
        <div className="py-4 text-center space-y-4">
          <h3 className="text-lg sm:text-2xl font-bold text-zinc-900 leading-snug font-serif italic max-w-xl mx-auto">
            "{currentQuestion.question}"
          </h3>

          {/* Explain Why You're Asking Toggle */}
          <div>
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{showWhy ? 'Hide the reason' : 'Why are we asking this?'}</span>
            </button>

            {showWhy && (
              <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200 text-amber-900 text-xs rounded-2xl max-w-md mx-auto text-left animate-in fade-in leading-relaxed">
                <strong className="block text-[10px] uppercase font-bold mb-0.5">Why this question</strong>
                {currentQuestion.whyAsking}
              </div>
            )}
          </div>

          {/* Optional Reflection Input */}
          <div className="max-w-md mx-auto pt-2">
            <Input
              type="text"
              placeholder="Jot down your answer or notes here..."
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveAnswer}
            disabled={!answerInput.trim()}
            icon={<Bookmark className="w-3.5 h-3.5" />}
          >
            Save answer
          </Button>

          <Button variant="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
            Next question
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};
