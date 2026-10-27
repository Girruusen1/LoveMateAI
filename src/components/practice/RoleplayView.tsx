import React, { useEffect, useRef, useState } from 'react';
import {
  Bandage,
  CheckCircle,
  Coffee,
  Drama,
  HeartCrack,
  HelpCircle,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLEPLAY_SCENARIOS } from '../../data/seedData';
import { AIService } from '../../services/ai';
import { isAiLimitError } from '../../utils/aiErrors';
import { RoleplayMessage, RoleplayScenario, RoleplayScorecard } from '../../types';
import { Button, Card, Chip, PageContainer, PageHeader, SectionHeading } from '../common/UIPrimitives';

const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  ask_out: <Coffee />,
  confess_feelings: <Mail />,
  after_fight: <Bandage />,
  set_boundary: <Shield />,
  ask_status: <MessageSquare />,
  respectful_breakup: <HeartCrack />,
};

export const RoleplayView: React.FC = () => {
  const { addPoints, unlockBadge, showToast, triggerConfetti } = useApp();

  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario>(ROLEPLAY_SCENARIOS[0]);
  const [messages, setMessages] = useState<RoleplayMessage[]>([
    {
      sender: 'ai',
      text: ROLEPLAY_SCENARIOS[0].startingMessage,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scorecard, setScorecard] = useState<RoleplayScorecard | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSelectScenario = (sc: RoleplayScenario) => {
    setSelectedScenario(sc);
    setScorecard(null);
    setMessages([
      {
        sender: 'ai',
        text: sc.startingMessage,
        timestamp: 'Just now',
      },
    ]);
    showToast(`Scenario active: ${sc.title}`, 'info');
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: RoleplayMessage = {
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextTranscript = [...messages, userMsg];
    setMessages(nextTranscript);
    setInputText('');
    setIsTyping(true);

    try {
      const aiReply = await AIService.generateRoleplayStep(selectedScenario, nextTranscript);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      addPoints(5);
    } catch (err) {
      showToast('Error continuing roleplay', 'info');
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinishRoleplay = async () => {
    if (isScoring) return;
    setIsScoring(true);
    try {
      const card = await AIService.evaluateRoleplaySession(selectedScenario, messages);
      setScorecard(card);
      unlockBadge('roleplay_rookie');
      addPoints(25, 'Completed Practice Conversation');
      triggerConfetti();
      showToast('Roleplay feedback ready! 🎭', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Could not score this practice. Please retry.', 'info');
    } finally {
      setIsScoring(false);
    }
  };

  const handleRestart = () => {
    setScorecard(null);
    setMessages([
      {
        sender: 'ai',
        text: selectedScenario.startingMessage,
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<Drama />}
        title="Roleplay practice"
        subtitle="Rehearse high-stakes relationship talks in a judgment-free space and get objective feedback on confidence and clarity."
      />

      {/* Scenario Chooser Chips */}
      <div className="flex flex-wrap gap-2">
        {ROLEPLAY_SCENARIOS.map((sc) => (
          <Chip
            key={sc.id}
            selected={selectedScenario.id === sc.id}
            icon={SCENARIO_ICONS[sc.id] || <MessageSquare />}
            onClick={() => handleSelectScenario(sc)}
          >
            {sc.title}
          </Chip>
        ))}
      </div>

      {/* Simulation Chat */}
      <Card padding="none" className="flex flex-col min-h-[60vh]">
        {/* Scenario Context Bar */}
        <div className="p-3.5 sm:px-6 bg-zinc-50 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <span className="font-bold text-zinc-900 block">{selectedScenario.characterRole}</span>
            <span className="text-zinc-600 line-clamp-1">{selectedScenario.context}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleFinishRoleplay}
            loading={isScoring}
            disabled={isTyping}
            icon={<Trophy className="w-3.5 h-3.5" />}
            className="shrink-0"
          >
            Finish and get score
          </Button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-white">
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            return (
              <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${
                    isUser ? 'bg-zinc-800' : 'bg-rose-500'
                  }`}
                >
                  {isUser ? 'You' : 'AI'}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[80%] leading-relaxed ${
                    isUser
                      ? 'bg-rose-600 text-white rounded-tr-xs shadow-2xs'
                      : 'bg-zinc-100 text-zinc-900 rounded-tl-xs border border-zinc-200/60'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 pl-9">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-zinc-500 font-medium ml-1">In character...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your response as if you were in the real conversation..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-zinc-900 placeholder:text-zinc-400 transition-colors"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={!inputText.trim() || isTyping}
            className="px-3 shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      {/* Post-Roleplay Scorecard */}
      {scorecard && (
        <Card padding="lg" className="space-y-6 animate-in slide-in-from-bottom-3 duration-300">
          <SectionHeading
            title="Communication scorecard"
            description="How this practice conversation went."
            action={
              <Button variant="ghost" size="sm" onClick={handleRestart} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Retry scenario
              </Button>
            }
            className="pb-4 border-b border-zinc-100"
          />

          {/* 4 Score Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Confidence</span>
              <span className="text-xl font-bold text-rose-700 mt-0.5 block">{scorecard.confidence}/10</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Clarity</span>
              <span className="text-xl font-bold text-rose-700 mt-0.5 block">{scorecard.clarity}/10</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Naturalness</span>
              <span className="text-xl font-bold text-rose-700 mt-0.5 block">{scorecard.naturalness}/10</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Pressure level</span>
              <span className="text-base font-bold text-emerald-600 mt-1 block">{scorecard.pressureLevel}</span>
            </div>
          </div>

          {/* What Worked & What Could Improve */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5 text-xs text-zinc-700">
              <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> What worked well
              </span>
              {scorecard.whatWorked.map((item, i) => (
                <p key={i}>• {item}</p>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1.5 text-xs text-zinc-700">
              <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Opportunities to refine
              </span>
              {scorecard.whatCouldImprove.map((item, i) => (
                <p key={i}>• {item}</p>
              ))}
            </div>
          </div>

          {/* A Better Script Version */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs space-y-1.5">
            <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Recommended script
            </span>
            <p className="text-zinc-900 font-serif italic text-xs sm:text-sm bg-white p-3 rounded-xl border border-rose-100">
              "{scorecard.betterScript}"
            </p>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};
