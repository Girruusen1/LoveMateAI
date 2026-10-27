import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  Clock,
  DollarSign,
  ListTodo,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentActionPlan, ActiveTab } from '../../types';
import { AIService } from '../../services/ai';
import { isAiLimitError } from '../../utils/aiErrors';
import { Button, Card, Input, PageContainer, PageHeader, SectionHeading } from '../common/UIPrimitives';

export const RelationshipCopilotView: React.FC = () => {
  const {
    user,
    setActiveTab,
    executeAgentPrompt,
    calendarEvents,
    agentTasks,
    userMemories,
    triggerConfetti,
    pendingCopilotPrompt,
    setPendingCopilotPrompt,
  } = useApp();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<AgentActionPlan | null>(null);
  const [messages, setMessages] = useState<
    { id: string; role: 'user' | 'assistant'; text: string; plan?: AgentActionPlan; actions?: { label: string; tab?: ActiveTab; actionType?: string }[] }[]
  >([
    {
      id: 'm1',
      role: 'assistant',
      text: `Good day, ${user?.name || 'You'} ❤️ I'm LoveMate. Tell me what you're hoping to make happen for your relationship, and I'll build structured plans, queue tasks, and handle reminders for you.`,
      actions: [
        { label: 'Anniversary under ₹5k', actionType: 'quick_prompt' },
        { label: 'Weekend surprise', actionType: 'quick_prompt' },
        { label: 'Help me apologize', actionType: 'quick_prompt' },
        { label: 'LDR date tonight', actionType: 'quick_prompt' },
      ],
    },
  ]);

  const quickPrompts = [
    'Our anniversary is next Friday. Plan something romantic under ₹5,000.',
    'I want to surprise my girlfriend this weekend with a spontaneous adventure.',
    'We had a small argument and I need to apologize without being defensive.',
    'Plan a long-distance virtual date for us tonight with paired dinner.',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `usr_${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      // Determine if this is a high-intent planning request or conversational guidance
      const lower = textToSend.toLowerCase();
      const isPlanningRequest =
        lower.includes('plan') ||
        lower.includes('anniversary') ||
        lower.includes('surprise') ||
        lower.includes('budget') ||
        lower.includes('date') ||
        lower.includes('apologize') ||
        lower.includes('tomorrow');

      if (isPlanningRequest) {
        const plan = await executeAgentPrompt(textToSend);
        setActivePlan(plan);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            role: 'assistant',
            text: `🎯 **Action Plan Generated: ${plan.intent.replace('_', ' ').toUpperCase()}**\n\n${plan.summary}`,
            plan,
            actions: [
              { label: 'View couple calendar', tab: 'couple-calendar' },
              { label: 'Check wishlist', tab: 'wishlist' },
            ],
          },
        ]);
      } else {
        const copilotResponse = await AIService.generateCopilotResponse(
          textToSend,
          { name: user?.name || 'You', partnerName: user?.partnerName || 'your partner' },
          'copilot',
          userMemories
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            role: 'assistant',
            text: copilotResponse.text,
            actions: copilotResponse.suggestedActions as any,
          },
        ]);
      }
    } catch (e) {
      if (!isAiLimitError(e)) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            text: 'I ran into an issue processing that request. Please try rephrasing or pick a suggested prompt below.',
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Consume a prompt handed over from the home composer / "Try:" chips: fill the input, send it, then clear it.
  const consumedPromptRef = useRef(false);
  useEffect(() => {
    if (!pendingCopilotPrompt) {
      consumedPromptRef.current = false;
      return;
    }
    if (consumedPromptRef.current) return; // guards StrictMode double-invoked effects
    consumedPromptRef.current = true;
    const prompt = pendingCopilotPrompt;
    setInput(prompt);
    setPendingCopilotPrompt(null);
    void handleSend(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCopilotPrompt]);

  const renderPermissionBadge = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Level 1: Safe auto
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Level 2: You confirm
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Level 3: Explicit confirm
          </span>
        );
    }
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Bot />}
        title="Ask LoveMate"
        subtitle="Tell LoveMate what you want to make happen. It turns the goal into a plan, queues tasks, schedules calendar blocks and keeps partner data private."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Calendar className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('couple-calendar')}
            >
              Calendar
            </Button>
          </>
        }
      />

      {/* Sample prompts */}
      <div className="space-y-3">
        <SectionHeading title="Try asking" description="Pick a sample request or type your own below." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="p-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-rose-300 hover:bg-rose-50/40 text-left transition-colors flex items-start gap-2.5 text-sm text-zinc-700"
            >
              <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{qp}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <Card padding="none" className="flex flex-col min-h-[60vh]">
        <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[65vh]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed space-y-3 ${
                  m.role === 'user'
                    ? 'bg-rose-600 text-white rounded-tr-md'
                    : 'bg-zinc-50 border border-zinc-200/80 text-zinc-800 rounded-tl-md'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{m.text}</div>

                {/* Structured plan */}
                {m.plan && (
                  <div className="mt-3 bg-white rounded-2xl p-4 border border-zinc-200 text-zinc-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-xs text-zinc-900">Action plan</span>
                      </div>
                      {renderPermissionBadge(m.plan.permissionLevel)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {m.plan.estimatedBudget && (
                        <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-500">Budget:</span>
                          <span className="font-bold text-zinc-800">{m.plan.estimatedBudget}</span>
                        </div>
                      )}
                      {m.plan.recommendedDate && (
                        <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-500">Target date:</span>
                          <span className="font-bold text-zinc-800">{m.plan.recommendedDate}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-semibold text-zinc-500">
                        Steps ({m.plan.steps.length})
                      </p>
                      <div className="space-y-1.5">
                        {m.plan.steps.map((step) => (
                          <div
                            key={step.id}
                            className="p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-100 flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {step.stepNumber}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold text-xs text-zinc-900">{step.title}</h4>
                                <span className="text-[10px] text-zinc-400">
                                  {step.category}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-600 mt-0.5">{step.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline actions */}
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-200/50">
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => {
                          if (act.tab) {
                            setActiveTab(act.tab);
                          } else if (act.actionType === 'quick_prompt') {
                            handleSend(act.label);
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
                          m.role === 'user'
                            ? 'bg-rose-700 text-rose-100 hover:bg-rose-800'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:border-rose-300 hover:text-rose-600'
                        }`}
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-zinc-400 text-xs italic animate-pulse">
              <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <span>LoveMate is retrieving memories, checking permissions and compiling a plan...</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-100 flex items-center gap-2">
          <Input
            type="text"
            placeholder="Ask LoveMate (e.g. 'Plan anniversary next Friday under ₹5,000')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            icon={<Send className="w-3.5 h-3.5" />}
            iconPosition="right"
            className="shrink-0"
          >
            Ask
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};
