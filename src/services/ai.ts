/**
 * LoveMate AI service.
 *
 * When the server has an Anthropic key configured, these methods call Claude through the
 * server-side gateway (structured outputs for tools, streaming for chat, vision for
 * screenshots, retrieved memories as context). Without a key the app runs in demo mode
 * and every method falls back to the offline simulator in ./aiService.
 *
 * Real-model failures are surfaced, never silently replaced with simulated answers.
 */
import { AIService as MockAIService } from './aiService';
import { getGenAIStatus, runTask, streamChat } from './genaiClient';
import { uid } from '../utils/uid';
import type {
  AgentActionPlan,
  AgentTaskPriority,
  AgentTaskType,
  AIPersonality,
  ConversationCoachPlan,
  DatePlanItinerary,
  DecodeResult,
  GeneratedGameSession,
  GiftIntelligenceResult,
  Language,
  RelationshipDetectiveResult,
  ReplyCopilotResult,
  ReplySuggestion,
  RoleplayScenario,
  ScreenshotAnalysis,
  SharedGoal,
  SharedMemory,
  TripTogetherItinerary,
  UserMemoryItem,
  VoiceCommunicationAudit,
  WantToTextDecision,
  WhatIfResult,
} from '../types';

const live = async () => (await getGenAIStatus()).enabled;
const orUndef = <T,>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

/** Retrieval step: pick the memories most relevant to the query (lexical retriever from the simulator). */
const relevantMemories = (query: string, memories: UserMemoryItem[]) => {
  const visible = memories.filter((m) => !m.isConflicting);
  const picked = MockAIService.retrieveRelevantMemories(query, visible);
  return (picked.length ? picked : visible.slice(0, 6).map((m) => m.content)).slice(0, 8);
};

export class AIService extends MockAIService {
  /** True when answers come from the real model rather than the offline simulator. */
  static async isLive(): Promise<boolean> {
    return live();
  }

  // 1. Chat (streaming)
  static async generateChatReply(
    userMessage: string,
    history: { role: string; content: string }[],
    personality: AIPersonality = 'wingman',
    language: Language = 'hinglish',
    memories: string[] = [],
    onDelta?: (delta: string) => void,
    context?: { userName?: string; partnerName?: string }
  ): Promise<string> {
    if (!(await live())) return super.generateChatReply(userMessage, history, personality, language, memories);
    return streamChat({ message: userMessage, history, personality, language, memories, ...context }, onDelta);
  }

  // 2. Decode a message
  static async decodeMessage(message: string, context?: string): Promise<DecodeResult> {
    if (!(await live())) return super.decodeMessage(message, context);
    const d = await runTask<Omit<DecodeResult, 'id' | 'originalMessage' | 'context' | 'responses'> & { responses: Omit<DecodeResult['responses'][number], 'id'>[] }>('decode', { message, context });
    return { id: uid('dec'), originalMessage: message, context, ...d, responses: d.responses.map((r) => ({ id: uid('res'), ...r })) };
  }

  // 3. Screenshot analysis (vision)
  static async analyzeScreenshot(imageName: string, imageDataUrl?: string): Promise<ScreenshotAnalysis> {
    // Real analysis needs real pixels; the built-in "sample chat" has none, so it stays simulated.
    if (!imageDataUrl?.startsWith('data:image/') || !(await live())) return super.analyzeScreenshot(imageName);
    const d = await runTask<Omit<ScreenshotAnalysis, 'id' | 'imagePreviewUrl' | 'timestamp'>>('screenshot', { fileName: imageName, imageDataUrl });
    return { id: uid('shot'), imagePreviewUrl: imageDataUrl ?? '', timestamp: new Date().toLocaleString(), ...d };
  }

  // 4. Role-play
  static async generateRoleplayStep(scenario: RoleplayScenario, transcript: { sender: 'user' | 'ai'; text: string }[]): Promise<string> {
    if (!(await live())) return super.generateRoleplayStep(scenario, transcript);
    const d = await runTask<{ reply: string }>('roleplayStep', { scenario, transcript });
    return d.reply;
  }

  // 5. What-if paths
  static async evaluateWhatIf(scenarioText: string): Promise<WhatIfResult> {
    if (!(await live())) return super.evaluateWhatIf(scenarioText);
    const d = await runTask<{ paths: WhatIfResult['paths'] }>('whatIf', { scenarioText });
    return { query: scenarioText, paths: d.paths };
  }

  // 6. Date planner
  static async generateDateItinerary(stage: string, budget: string, location: string, vibe: string): Promise<DatePlanItinerary> {
    if (!(await live())) return super.generateDateItinerary(stage, budget, location, vibe);
    const d = await runTask<Omit<DatePlanItinerary, 'id' | 'stage' | 'schedule'> & { schedule: { time: string; activity: string; description: string; locationTip: string | null }[] }>('datePlan', { stage, budget, location, vibe });
    return { id: uid('date'), stage, ...d, schedule: d.schedule.map((s) => ({ ...s, locationTip: orUndef(s.locationTip) })) };
  }

  // 7. Message transformer
  static async transformMessage(originalText: string, style: string): Promise<{ text: string; hinglish: string; explanation: string }[]> {
    if (!(await live())) return super.transformMessage(originalText, style);
    const d = await runTask<{ variations: { text: string; hinglish: string; explanation: string }[] }>('transform', { originalText, style });
    return d.variations;
  }

  // 8. Timeline summary
  static async summarizeTimeline(milestones: { title: string; date: string }[]): Promise<string> {
    if (!(await live())) return super.summarizeTimeline(milestones);
    const d = await runTask<{ summary: string }>('timelineSummary', { milestones });
    return d.summary;
  }

  // 9. Confession
  static async generateConfession(recipient: string, tone: string, language: Language, length: 'short' | 'medium' | 'long'): Promise<string> {
    if (!(await live())) return super.generateConfession(recipient, tone, language, length);
    const d = await runTask<{ confession: string }>('confession', { recipient, tone, language, length });
    return d.confession;
  }

  // 10. Reply generator
  static async generateReplies(inputMessage: string, intent: string): Promise<ReplySuggestion['replies']> {
    if (!(await live())) return super.generateReplies(inputMessage, intent);
    const d = await runTask<{ replies: Omit<ReplySuggestion['replies'][number], 'id'>[] }>('replies', { inputMessage, intent });
    return d.replies.map((r) => ({ id: uid('rep'), ...r }));
  }

  // 11. Relationship detective
  static async generateRelationshipDetective(situation: string, context?: string): Promise<RelationshipDetectiveResult> {
    if (!(await live())) return super.generateRelationshipDetective(situation, context);
    return runTask<RelationshipDetectiveResult>('detective', { situation, context });
  }

  // 12. Conversation coach
  static async generateConversationCoach(scenario: string, goal: string): Promise<ConversationCoachPlan> {
    if (!(await live())) return super.generateConversationCoach(scenario, goal);
    return runTask<ConversationCoachPlan>('conversationCoach', { scenario, goal });
  }

  // 13. Reply copilot
  static async generateReplyCopilot(ongoingThread: string, lastMessage: string): Promise<ReplyCopilotResult> {
    if (!(await live())) return super.generateReplyCopilot(ongoingThread, lastMessage);
    return runTask<ReplyCopilotResult>('replyCopilot', { ongoingThread, lastMessage });
  }

  // 14. Tone coach
  static async auditVoiceCommunication(spokenText: string): Promise<VoiceCommunicationAudit> {
    if (!(await live())) return super.auditVoiceCommunication(spokenText);
    const d = await runTask<VoiceCommunicationAudit>('voiceAudit', { spokenText });
    return { ...d, clarityScore: Math.max(0, Math.min(10, Math.round(d.clarityScore))) };
  }

  // 15. Infinite games
  static async generateInfiniteGame(stage: string, mood: string, duration: number, players: number): Promise<GeneratedGameSession> {
    if (!(await live())) return super.generateInfiniteGame(stage, mood, duration, players);
    const d = await runTask<{ title: string; gameType: string; questions: { prompt: string; type: GeneratedGameSession['questions'][number]['type']; options: string[] | null }[] }>('game', { stage, mood, duration, players });
    return {
      id: uid('game'),
      title: d.title,
      gameType: d.gameType,
      relationshipStage: stage,
      mood,
      durationMinutes: duration,
      questions: d.questions.map((q) => ({ id: uid('q'), prompt: q.prompt, type: q.type, options: orUndef(q.options) })),
    };
  }

  // 16. Should I text them?
  static async evaluateWantToText(situation: string, draftText: string): Promise<WantToTextDecision> {
    if (!(await live())) return super.evaluateWantToText(situation, draftText);
    const d = await runTask<Omit<WantToTextDecision, 'situation' | 'polishedText' | 'delayHours'> & { polishedText: string | null; delayHours: number | null }>('wantToText', { situation, draftText });
    return { situation, ...d, polishedText: orUndef(d.polishedText), delayHours: orUndef(d.delayHours) };
  }

  // 17. Gift ideas
  static async generateGiftIntelligence(stage: string, budget: string, occasion: string, personality: string, style: string): Promise<GiftIntelligenceResult> {
    if (!(await live())) return super.generateGiftIntelligence(stage, budget, occasion, personality, style);
    return runTask<GiftIntelligenceResult>('giftIdeas', { stage, budget, occasion, personality, style });
  }

  // 18. Trip planner
  static async generateTripTogether(destination: string, durationDays: number, budget: string, vibe: string): Promise<TripTogetherItinerary> {
    if (!(await live())) return super.generateTripTogether(destination, durationDays, budget, vibe);
    const d = await runTask<Omit<TripTogetherItinerary, 'destination' | 'durationDays'>>('trip', { destination, durationDays, budget, vibe });
    return { destination, durationDays, ...d };
  }

  // 19. Couples coach
  static async generateCouplesCoachSession(
    topic: string,
    personAInput: string,
    personBInput: string
  ): Promise<{ commonGround: string[]; differences: string[]; discussionPrompts: string[]; agreedNextStep: string }> {
    if (!(await live())) return super.generateCouplesCoachSession(topic, personAInput, personBInput);
    return runTask('couplesCoach', { topic, personAInput, personBInput });
  }

  // 20. Agent planner
  static async executeAgentRequest(prompt: string, userContext: { name: string; partnerName?: string }, memories: UserMemoryItem[] = []): Promise<AgentActionPlan> {
    if (!(await live())) return super.executeAgentRequest(prompt, userContext, memories);
    const d = await runTask<{
      intent: string;
      summary: string;
      estimatedBudget: string | null;
      recommendedDate: string | null;
      steps: { title: string; detail: string; category: string; permissionLevel: '1' | '2' | '3' }[];
      suggestedTasks: { type: AgentTaskType; title: string; description: string; priority: AgentTaskPriority }[];
    }>('agentPlan', { prompt, userContext, memories: relevantMemories(prompt, memories) });
    const steps = d.steps.map((s, i) => ({
      id: uid('step'),
      stepNumber: i + 1,
      title: s.title,
      detail: s.detail,
      category: s.category,
      status: 'pending' as const,
      permissionLevel: Number(s.permissionLevel) as 1 | 2 | 3,
    }));
    const permissionLevel = steps.reduce<1 | 2 | 3>((m, s) => (s.permissionLevel > m ? s.permissionLevel : m), 1);
    return {
      id: uid('plan'),
      intent: d.intent,
      summary: d.summary,
      steps,
      estimatedBudget: orUndef(d.estimatedBudget),
      recommendedDate: orUndef(d.recommendedDate),
      requiresConfirmation: permissionLevel >= 2,
      permissionLevel,
      suggestedTasks: d.suggestedTasks,
      createdAt: new Date().toISOString(),
    };
  }

  // 21. Copilot answer
  static async generateCopilotResponse(
    query: string,
    userContext: { name: string; partnerName?: string; preferredLanguage?: Language },
    activeTab: string = 'copilot',
    memories: UserMemoryItem[] = []
  ): Promise<{ text: string; suggestedActions: { label: string; tab?: string; actionType?: string }[] }> {
    if (!(await live())) return super.generateCopilotResponse(query, userContext, activeTab, memories);
    const d = await runTask<{ text: string; suggestedActions: { label: string; tab: string | null }[] }>('copilot', {
      query,
      userContext,
      memories: relevantMemories(query, memories),
    });
    return { text: d.text, suggestedActions: d.suggestedActions.map((a) => ({ label: a.label, tab: orUndef(a.tab) })) };
  }

  // 22. Couple AI in Our Space
  static async generateCoupleAIAdvice(query: string, sharedMemories: SharedMemory[] = [], sharedGoals: SharedGoal[] = []): Promise<string> {
    if (!(await live())) return super.generateCoupleAIAdvice(query, sharedMemories, sharedGoals);
    const d = await runTask<{ advice: string }>('coupleAdvice', {
      query,
      sharedMemories: sharedMemories.map((m) => m.title),
      sharedGoals: sharedGoals.map((g) => g.title),
    });
    return d.advice;
  }
}
