import React, { useState } from 'react';
import {
  ArrowRight,
  Dices,
  Gamepad2,
  Heart,
  Laugh,
  MessageSquare,
  Share2,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  COUPLE_QUIZ_CARDS,
  DEEP_QUESTIONS_CARDS,
  NEVER_HAVE_I_EVER_CARDS,
  TRUTH_OR_DARE_CARDS,
  WOULD_YOU_RATHER_CARDS,
} from '../../data/seedData';
import { GameCard } from '../../types';
import { Badge, Button, Card, Chip, PageContainer, PageHeader } from '../common/UIPrimitives';

export const CoupleGamesView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti, openShareModal } = useApp();

  const [activeGame, setActiveGame] = useState<
    'wyr' | 'tod' | 'deep' | 'quiz' | 'nhie'
  >('wyr');

  const [cardIndex, setCardIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [score, setScore] = useState(0);

  const gameTypes = [
    { id: 'wyr', title: 'Would You Rather', icon: <Heart />, cards: WOULD_YOU_RATHER_CARDS },
    { id: 'tod', title: 'Truth or Dare', icon: <Dices />, cards: TRUTH_OR_DARE_CARDS },
    { id: 'deep', title: 'Deep Questions', icon: <MessageSquare />, cards: DEEP_QUESTIONS_CARDS },
    { id: 'quiz', title: 'Couple Quiz', icon: <Sparkles />, cards: COUPLE_QUIZ_CARDS },
    { id: 'nhie', title: 'Never Have I Ever', icon: <Laugh />, cards: NEVER_HAVE_I_EVER_CARDS },
  ];

  const currentCards = gameTypes.find((g) => g.id === activeGame)?.cards || WOULD_YOU_RATHER_CARDS;
  const currentCard: GameCard = currentCards[cardIndex % currentCards.length];

  const handleNextCard = () => {
    setSelectedOption(null);
    setCardIndex((prev) => prev + 1);
    setScore((prev) => prev + 1);
    addPoints(5);
    triggerConfetti();
  };

  const handleSelectOption = (opt: 'A' | 'B') => {
    setSelectedOption(opt);
    addPoints(10, 'Answered Couple Game');
    showToast('Choice recorded! +10 Love Points ❤️', 'love');
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Gamepad2 />}
        title="Couple games"
        subtitle="Pass your phone back and forth or play together over a call. Never run out of questions."
      />

      {/* Game Mode Pickers */}
      <div className="flex flex-wrap gap-2">
        {gameTypes.map((gt) => (
          <Chip
            key={gt.id}
            selected={activeGame === gt.id}
            icon={gt.icon}
            onClick={() => {
              setActiveGame(gt.id as any);
              setCardIndex(0);
              setSelectedOption(null);
            }}
          >
            {gt.title}
          </Chip>
        ))}
      </div>

      {/* Interactive Playable Game Card */}
      <Card padding="lg" className="min-h-[360px] flex flex-col justify-between">
        {/* Top Card Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Badge variant="rose">{currentCard.category}</Badge>
            <span className="text-xs text-zinc-500 font-medium">
              Card {(cardIndex % currentCards.length) + 1} of {currentCards.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> {score} played
            </span>
            <button
              onClick={() =>
                openShareModal({
                  type: 'game',
                  data: {
                    yourName: 'Couple Game Card',
                    overallScore: 100,
                    verdict: currentCard.question,
                  },
                })
              }
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Share this prompt"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Question */}
        <div className="py-8 text-center space-y-4">
          <h3 className="text-lg sm:text-2xl font-bold text-zinc-900 leading-snug max-w-xl mx-auto">
            "{currentCard.question}"
          </h3>

          {/* If the card has options A & B */}
          {currentCard.optionA && currentCard.optionB && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-4">
              <button
                type="button"
                onClick={() => handleSelectOption('A')}
                className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
                  selectedOption === 'A'
                    ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200'
                    : 'bg-white hover:bg-rose-50/60 border-zinc-200 text-zinc-800'
                }`}
              >
                Option A: {currentCard.optionA}
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('B')}
                className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
                  selectedOption === 'B'
                    ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200'
                    : 'bg-white hover:bg-rose-50/60 border-zinc-200 text-zinc-800'
                }`}
              >
                Option B: {currentCard.optionB}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">
            Pass the phone or reveal your answer at the same time.
          </span>

          <Button variant="primary" onClick={handleNextCard} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
            Next card
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};
