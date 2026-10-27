/**
 * Structured generation tasks. Each task owns its prompt and a Zod schema; the model is
 * constrained to that schema via structured outputs, and the SDK validates the result.
 * The browser can only pick a task name and send inputs: prompts live on the server.
 */
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { MAX_TEXT_CHARS } from './config.ts';
import { languageLabel } from './prompts.ts';

type Effort = 'low' | 'medium' | 'high';
type UserContent = string | Anthropic.Beta.BetaContentBlockParam[];

export interface TaskDef<S extends z.ZodType = z.ZodType> {
  schema: S;
  effort: Effort;
  build: (input: Record<string, unknown>) => UserContent;
}

/* ---------- input sanitising (browser input is untrusted) ---------- */
const str = (v: unknown, max = MAX_TEXT_CHARS) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max).trim();
const num = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dflt;
};
const list = (v: unknown, maxItems = 20, maxChars = 400) =>
  (Array.isArray(v) ? v : []).slice(0, maxItems).map((x) => str(x, maxChars)).filter(Boolean);
const quote = (label: string, text: string) => (text ? `${label}:\n"""\n${text}\n"""` : `${label}: (not provided)`);

const NAV_TABS = [
  'decode', 'reply', 'confession', 'message-transformer', 'date-planner', 'gift-intelligence', 'trip-together',
  'couple-calendar', 'wishlist', 'important-dates', 'our-space', 'games', 'infinite-games', 'chemistry-mode',
  'conversation-coach', 'couple-coach', 'communication-coach', 'detective', 'what-if', 'should-confess',
  'crush-analyzer', 'memory-center', 'relationship-dashboard', 'long-distance', 'love-cards', 'agent-activity',
] as const;

/* ---------- schemas ---------- */
/**
 * Enum that degrades gracefully. The SDK passes enum lists to the model as guidance (in the
 * field description) rather than as a hard constraint, so an off-list value falls back to a
 * sensible default instead of failing the whole answer.
 */
const oneOf = <const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) => z.enum(values).catch(fallback);

const level = oneOf(['Low', 'Medium', 'High'], 'Medium');

/* ---------- language ---------- */
/**
 * Tasks whose prompt already states the answer language themselves. Every other task gets a
 * "Reply in <language>" line appended (see `withLanguage` below), driven by `input.language`,
 * which the browser client fills in from the user's preferredLanguage when the caller omits it.
 */
const LANGUAGE_AWARE_TASKS = new Set<string>(['confession', 'copilot']);

/** Human-readable values follow the user's language; keys and enum-like values stay English so the Zod schemas still match. */
export function languageInstruction(language: unknown): string {
  return `Reply in ${languageLabel(language)}: write every human-readable value (sentences, suggestions, explanations, titles, scripts) in that language. Keep all JSON keys exactly as specified, in English. Values described as a fixed set of options (labels, levels, statuses, recommendation codes, tab or type names) must stay exactly as listed in English. Fields explicitly described as Hinglish stay Hinglish. Keep people's names, emoji and proper nouns as they are.`;
}

function withLanguage<T extends Record<string, TaskDef>>(tasks: T): T {
  const out: Record<string, TaskDef> = {};
  for (const [name, def] of Object.entries(tasks)) {
    if (LANGUAGE_AWARE_TASKS.has(name)) {
      out[name] = def;
      continue;
    }
    out[name] = {
      ...def,
      build: (input) => {
        const content = def.build(input);
        const note = languageInstruction(input.language);
        return typeof content === 'string' ? `${content}\n\n${note}` : [...content, { type: 'text', text: note }];
      },
    };
  }
  return out as T;
}

const RAW_TASKS = {
  decode: {
    effort: 'low',
    schema: z.object({
      tone: z.string().describe('2-4 word description of the tone'),
      mood: z.string().describe('2-4 word description of the mood'),
      interestSignal: oneOf(['Unclear', 'Subtle Interest', 'Promising', 'Platonic'], 'Unclear'),
      conversationOpportunity: level,
      momentum: z.object({ level, explanation: z.string() }),
      whatItMightMean: z.array(z.string()).describe('2-4 plausible readings, each one sentence'),
      whatNotToAssume: z.string(),
      responses: z
        .array(z.object({ label: oneOf(['Casual', 'Playful', 'Flirty'], 'Casual'), text: z.string(), hinglishText: z.string(), explanation: z.string() }))
        .describe('exactly three replies: one Casual, one Playful, one Flirty'),
    }),
    build: (i) =>
      `Decode this message someone received and suggest replies. Give replies in the requested language in "text" and Hinglish versions in "hinglishText".\n\n${quote('Message they received', str(i.message))}\n\n${quote('Context from before the message', str(i.context))}`,
  },

  screenshot: {
    effort: 'low',
    schema: z.object({
      extractedSnippet: z.string().describe('The visible chat transcribed as lines like "Them: ..." and "You: ...". If unreadable, say so.'),
      conversationTone: z.string(),
      energyLevel: oneOf(['Low', 'Balanced', 'High'], 'Balanced'),
      momentum: z.string(),
      potentialMisunderstandings: z.array(z.string()),
      suggestedReplies: z.array(z.object({ vibe: z.string(), reply: z.string(), hinglishReply: z.string(), why: z.string() })).describe('three replies with different vibes'),
    }),
    build: (i) => {
      const dataUrl = str(i.imageDataUrl, 8_000_000);
      const match = /^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      const text = `This is a screenshot of a chat conversation (WhatsApp, Instagram or similar). Read it carefully, transcribe the visible messages, analyse the dynamic, and suggest replies the user could send next. The user's own messages are usually on the right. File name: ${str(i.fileName, 200) || 'screenshot'}.`;
      if (!match) return `${text}\n\nNo readable image was attached. Say that the screenshot could not be read and suggest the user paste the text instead.`;
      return [
        { type: 'image', source: { type: 'base64', media_type: match[1] as 'image/png', data: match[2] } },
        { type: 'text', text },
      ];
    },
  },

  replies: {
    effort: 'low',
    schema: z.object({
      replies: z.array(z.object({ text: z.string(), vibe: z.string(), explanation: z.string().describe('why this reply works, one sentence') })).describe('exactly three different replies'),
    }),
    build: (i) => `Write three replies the user could send back. The vibe they want: ${str(i.intent, 80) || 'friendly'}. Each reply must respond to what was actually said.\n\n${quote('Message they received', str(i.inputMessage))}`,
  },

  confession: {
    effort: 'low',
    schema: z.object({ confession: z.string() }),
    build: (i) =>
      `Write a heartfelt confession message the user can send.\nWho it's for: ${str(i.recipient, 80) || 'someone special'}\nTone: ${str(i.tone, 60) || 'sincere'}\nLength: ${str(i.length, 20) || 'medium'} (short = 1-2 sentences, medium = 3-5, long = a short paragraph)\nLanguage: ${languageLabel(i.language)}\nIt should feel genuine, low-pressure, and leave the other person room to respond however they feel.`,
  },

  transform: {
    effort: 'low',
    schema: z.object({
      variations: z.array(z.object({ text: z.string(), hinglish: z.string(), explanation: z.string() })).describe('three rewritten versions'),
    }),
    build: (i) => `Rewrite the user's draft message in a ${str(i.style, 60) || 'better'} style. Keep their meaning. Give three distinct versions with the requested language in "text" and a Hinglish version in "hinglish".\n\n${quote('Their draft', str(i.originalText))}`,
  },

  whatIf: {
    effort: 'low',
    schema: z.object({
      paths: z
        .array(z.object({ pathType: oneOf(['A', 'B', 'C'], 'B'), label: z.string(), scenarioDescription: z.string(), whatToSay: z.string(), whatToAvoid: z.string(), respectfulResponse: z.string() }))
        .describe('three paths: A = goes well, B = uncertain response, C = not interested. These are possibilities, not predictions.'),
    }),
    build: (i) => `The user is considering a step in their love life. Map out three possible ways it could go and how to handle each with dignity.\n\n${quote('What they are considering', str(i.scenarioText))}`,
  },

  datePlan: {
    effort: 'low',
    schema: z.object({
      title: z.string(),
      budgetEst: z.string(),
      schedule: z.array(z.object({ time: z.string(), activity: z.string(), description: z.string(), locationTip: z.string().nullable() })),
      conversationTopics: z.array(z.string()),
      cuteMoments: z.array(z.string()),
      thingsToAvoid: z.array(z.string()),
      backupPlan: z.string(),
      budgetBreakdown: z.array(z.object({ item: z.string(), cost: z.string() })),
    }),
    build: (i) =>
      `Plan a date with a timed schedule (4-6 stops).\nRelationship stage: ${str(i.stage, 80)}\nBudget: ${str(i.budget, 80)}\nCity / area: ${str(i.location, 120)}\nVibe: ${str(i.vibe, 80)}\nUse realistic kinds of places for that city; don't invent specific business names unless they are well known. Costs in Indian rupees unless the location is outside India.`,
  },

  detective: {
    effort: 'medium',
    schema: z.object({
      whatWeKnow: z.array(z.string()).describe('facts stated by the user'),
      whatMightBeHappening: z.array(z.string()).describe('possible explanations, clearly framed as possibilities'),
      whatWeDontKnow: z.array(z.string()),
      whatYouCanDoNext: z.array(z.string()),
      suggestedConversation: z.string().describe('a calm opener the user could use to talk about it'),
    }),
    build: (i) => `Help the user separate facts from assumptions about a relationship situation, without mind-reading.\n\n${quote('What happened', str(i.situation))}\n\n${quote('Background context', str(i.context))}`,
  },

  conversationCoach: {
    effort: 'low',
    schema: z.object({
      scenarioGoal: z.string(),
      steps: z.array(z.object({ step: z.string(), phase: oneOf(['Opening', 'Main Point', 'Example', 'Listen', 'Respond', 'Next Step'], 'Main Point'), script: z.string(), tip: z.string() })).describe('5-6 steps covering each phase in order'),
    }),
    build: (i) => `Build a step-by-step script for a difficult relationship conversation using "I" statements.\nGoal: ${str(i.goal, 200)}\n\n${quote('The conversation they need to have', str(i.scenario))}`,
  },

  replyCopilot: {
    effort: 'low',
    schema: z.object({
      bestReply: z.string(),
      playfulReply: z.string(),
      flirtyReply: z.string(),
      safeReply: z.string(),
      conversationExtender: z.string().describe('a reply with a question that keeps the chat going'),
      changeTopic: z.string(),
      hinglishBonus: z.string().describe('the best reply rewritten in Hinglish'),
    }),
    build: (i) => `Suggest replies to the latest message, taking the whole thread into account.\n\n${quote('Conversation so far', str(i.ongoingThread))}\n\n${quote('Latest message to reply to', str(i.lastMessage))}`,
  },

  voiceAudit: {
    effort: 'low',
    schema: z.object({
      clarityScore: z.number().describe('0-10, how clear and non-defensive the message is'),
      confrontationalTriggerWords: z.array(z.string()).describe('exact words or phrases from the text that may trigger defensiveness'),
      constructiveAlternative: z.string().describe('the same message rewritten with I-statements'),
      coachAdvice: z.string(),
    }),
    build: (i) => `Review how the user plans to say something to their partner. Spot phrasing likely to make the partner defensive (blame, "always/never", sarcasm) and rewrite it constructively.\n\n${quote('What they plan to say', str(i.spokenText))}`,
  },

  wantToText: {
    effort: 'low',
    schema: z.object({
      whatHappened: z.string().describe('one-sentence neutral summary of the situation'),
      recommendation: oneOf(['send', 'wait', 'rewrite', 'dont_send'], 'wait'),
      reasoning: z.string(),
      polishedText: z.string().nullable().describe('an improved version if they should send or rewrite, else null'),
      delayHours: z.number().nullable().describe('hours to wait if recommendation is wait, else null'),
    }),
    build: (i) => `The user wants to text someone and is unsure. Decide whether they should send it, wait, rewrite it or not send it, protecting their dignity and the other person's boundaries.\n\n${quote('Situation', str(i.situation))}\n\n${quote('Draft text', str(i.draftText))}`,
  },

  giftIdeas: {
    effort: 'low',
    schema: z.object({
      giftPersonality: z.object({ sentimental: level, practical: level, experienceOriented: level }),
      recommendations: z.array(z.object({ title: z.string(), category: z.string(), estimatedPrice: z.string(), whyTheyLoveIt: z.string(), whereToFind: z.string() })).describe('4-5 gift ideas within budget'),
    }),
    build: (i) =>
      `Suggest thoughtful gifts.\nRelationship stage: ${str(i.stage, 80)}\nOccasion: ${str(i.occasion, 80)}\nBudget: ${str(i.budget, 80)}\nPartner's interests and quirks: ${str(i.personality, 800)}\nGift style preference: ${str(i.style, 80)}\nTie each idea to their stated interests.`,
  },

  trip: {
    effort: 'low',
    schema: z.object({
      totalEstimatedBudget: z.string(),
      dailyPlans: z.array(
        z.object({ dayNumber: z.number(), theme: z.string(), schedule: z.array(z.object({ time: z.string(), activity: z.string(), tip: z.string() })), coupleSurprise: z.string() })
      ),
      packingTips: z.array(z.string()),
      backupPlan: z.string(),
    }),
    build: (i) =>
      `Plan a couple's trip with one entry per day.\nDestination: ${str(i.destination, 120)}\nDays: ${num(i.durationDays, 1, 10, 3)}\nBudget: ${str(i.budget, 80)}\nVibe and shared interests: ${str(i.vibe, 300)}`,
  },

  game: {
    effort: 'low',
    schema: z.object({
      title: z.string(),
      gameType: z.string(),
      questions: z
        .array(z.object({ prompt: z.string(), type: oneOf(['guess', 'rapid', 'choice', 'open'], 'open'), options: z.array(z.string()).nullable().describe('2-4 options for choice questions, else null') }))
        .describe('one question per ~2 minutes of play'),
    }),
    build: (i) =>
      `Create a fresh couple's question game. Make the questions original, specific and fun, not generic.\nRelationship stage: ${str(i.stage, 60)}\nMood: ${str(i.mood, 60)}\nDuration: ${num(i.duration, 5, 60, 10)} minutes\nPlayers: ${num(i.players, 2, 8, 2)}`,
  },

  roleplayStep: {
    effort: 'low',
    schema: z.object({ reply: z.string().describe('the character\'s next message, 1-3 sentences, in character') }),
    build: (i) => {
      const sc = (i.scenario ?? {}) as Record<string, unknown>;
      const transcript = (Array.isArray(i.transcript) ? i.transcript : [])
        .slice(-20)
        .map((t) => {
          const m = t as Record<string, unknown>;
          return `${m.sender === 'user' ? 'User' : 'You'}: ${str(m.text, 600)}`;
        })
        .join('\n');
      return `You are role-playing so the user can practise a real conversation. Stay in character and react realistically, neither too easy nor hostile.\nScenario: ${str(sc.title, 120)}\nYour character: ${str(sc.characterRole, 300)}\nContext: ${str(sc.context, 600)}\n\nConversation so far:\n${transcript || '(none yet)'}\n\nWrite your character's next message.`;
    },
  },

  copilot: {
    effort: 'low',
    schema: z.object({
      text: z.string().describe('your answer to the user, 2-6 short paragraphs or a short list'),
      suggestedActions: z
        .array(z.object({ label: z.string().describe('short button label, no emoji'), tab: z.enum(NAV_TABS).nullable().catch(null).describe('app screen to open, or null') }))
        .describe('0-3 relevant app screens the user could open next'),
    }),
    build: (i) => {
      const u = (i.userContext ?? {}) as Record<string, unknown>;
      return `You are the in-app assistant. Answer the user's request and, where useful, point them to screens in the app.\nUser: ${str(u.name, 60) || 'the user'}; partner: ${str(u.partnerName, 60) || 'not specified'}.\nReply in ${languageLabel(i.language ?? u.preferredLanguage)}. Keep the JSON keys and "tab" values exactly as specified; button labels may be in that language.\n\n${list(i.memories, 12).length ? `What you remember about them:\n- ${list(i.memories, 12).join('\n- ')}\n\n` : ''}${quote('Their request', str(i.query))}`;
    },
  },

  coupleAdvice: {
    effort: 'low',
    schema: z.object({ advice: z.string() }),
    build: (i) =>
      `A couple is asking you together, in their shared space. Answer warmly and practically, addressing both of them.\n${list(i.sharedMemories, 12).length ? `Their shared memories: ${list(i.sharedMemories, 12).join('; ')}\n` : ''}${list(i.sharedGoals, 12).length ? `Their shared goals: ${list(i.sharedGoals, 12).join('; ')}\n` : ''}\n${quote('Their question', str(i.query))}`,
  },

  couplesCoach: {
    effort: 'medium',
    schema: z.object({
      commonGround: z.array(z.string()),
      differences: z.array(z.string()),
      discussionPrompts: z.array(z.string()),
      agreedNextStep: z.string().describe('one small concrete step both could agree to'),
    }),
    build: (i) => `Mediate between two partners fairly, without taking sides or diagnosing anyone.\nTopic: ${str(i.topic, 120)}\n\n${quote('Partner A says', str(i.personAInput))}\n\n${quote('Partner B says', str(i.personBInput))}`,
  },

  timelineSummary: {
    effort: 'low',
    schema: z.object({ summary: z.string().describe('a warm 3-5 sentence story of their journey') }),
    build: (i) => {
      const items = (Array.isArray(i.milestones) ? i.milestones : []).slice(0, 40).map((m) => {
        const x = m as Record<string, unknown>;
        return `- ${str(x.date, 40)}: ${str(x.title, 200)}`;
      });
      return `Summarise this couple's relationship timeline as a short, warm story.\n${items.join('\n') || '(no milestones yet)'}`;
    },
  },

  agentPlan: {
    effort: 'medium',
    schema: z.object({
      intent: z.string().describe('snake_case intent, e.g. anniversary_plan'),
      summary: z.string(),
      estimatedBudget: z.string().nullable(),
      recommendedDate: z.string().nullable(),
      steps: z
        .array(z.object({ title: z.string(), detail: z.string(), category: z.string(), permissionLevel: oneOf(['1', '2', '3'], '2').describe('1 safe to do automatically, 2 needs confirmation, 3 needs explicit approval (money, messaging the partner)') }))
        .describe('3-6 concrete steps'),
      suggestedTasks: z.array(
        z.object({
          type: oneOf(['reminder', 'date_plan', 'gift_plan', 'message_plan', 'anniversary_plan', 'birthday_plan', 'relationship_checkin', 'challenge', 'calendar_event', 'trip_plan', 'surprise_plan', 'reflection', 'follow_up'], 'reminder'),
          title: z.string(),
          description: z.string(),
          priority: oneOf(['low', 'medium', 'high', 'urgent'], 'medium'),
        })
      ),
    }),
    build: (i) => {
      const u = (i.userContext ?? {}) as Record<string, unknown>;
      return `Turn the user's goal into an action plan the app can track. The app can add calendar events, wishlist items and reminders, but never sends messages, spends money or books anything without the user's explicit confirmation.\nUser: ${str(u.name, 60)}; partner: ${str(u.partnerName, 60) || 'not specified'}.\n${list(i.memories, 12).length ? `What you remember:\n- ${list(i.memories, 12).join('\n- ')}\n` : ''}\n${quote('Goal', str(i.prompt))}`;
    },
  },
} satisfies Record<string, TaskDef>;

export const TASKS = withLanguage(RAW_TASKS);

export type TaskName = keyof typeof TASKS;
export const isTaskName = (n: string): n is TaskName => Object.prototype.hasOwnProperty.call(TASKS, n);
