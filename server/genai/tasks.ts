/**
 * Structured generation tasks. Each task owns its prompt and a Zod schema; the model is
 * constrained to that schema via structured outputs, and the SDK validates the result.
 * The browser can only pick a task name and send inputs: prompts live on the server.
 */
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { MAX_TEXT_CHARS } from './config.ts';
import { languageLabel } from './prompts.ts';
import { ASTRO_TASKS } from './tasksAstro.ts';

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
  'couple-calendar', 'wishlist', 'important-dates', 'our-space', 'games', 'infinite-games', 'couple-mode',
  'conversation-coach', 'couple-coach', 'communication-coach', 'detective', 'what-if', 'should-confess',
  'crush-analyzer', 'memory-center', 'relationship-dashboard', 'long-distance', 'love-cards', 'health-check',
] as const;

/* ---------- schemas ---------- */
/**
 * Enum that degrades gracefully. The SDK passes enum lists to the model as guidance (in the
 * field description) rather than as a hard constraint, so an off-list value falls back to a
 * sensible default instead of failing the whole answer.
 */
const oneOf = <const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) => z.enum(values).catch(fallback);

const level = oneOf(['Low', 'Medium', 'High'], 'Medium');
const flag = oneOf(['green', 'yellow', 'red'], 'yellow');

/** For tools whose inputs are free text: answer in whatever language the user typed in. */
const MATCH_LANGUAGE =
  'Write in the same language the user wrote their inputs in: natural Roman-script Hinglish if they wrote Hinglish, Devanagari Hindi if they wrote Devanagari, otherwise English.';
const yesNo = (v: unknown) => (v === true || v === 'true' ? 'yes' : 'no');

/** Crush analyser answers arrive as option codes; spell them out so the model reads real observations. */
const CRUSH_ANSWERS: Record<string, { question: string; options: Record<string, string> }> = {
  initiates: { question: 'Who usually starts the conversation', options: { often: 'they initiate often', half: 'roughly 50/50', rarely: 'almost always the user' } },
  replySpeed: { question: 'How fast they reply', options: { instant: 'within minutes', fast: 'within 1-2 hours, and they apologise if late', slow: 'hours or days later, with dry replies' } },
  memory: { question: 'Whether they remember small details the user told them', options: { remembers_everything: 'yes, even tiny things', average: 'only the big topics' } },
  plans: { question: 'Whether they have met or planned to meet one-on-one', options: { yes: 'yes, they hang out or have planned to', no: 'only in groups or online' } },
  length: { question: 'How long their messages are', options: { short: 'short', balanced: 'balanced, similar to the user\'s', long: 'long and detailed' } },
  emojis: { question: 'How much they use emojis', options: { none: 'rarely or never', some: 'sometimes', lots: 'a lot' } },
};

const HEALTH_CATEGORIES = [
  ['comm', 'Communication', 'feeling heard and understood without defensiveness'],
  ['trust', 'Trust', 'confidence in integrity and emotional transparency'],
  ['time', 'Quality Time', 'undivided, phone-free presence and shared rituals'],
  ['emotion', 'Emotional Connection', 'vulnerability and intuitive empathy'],
  ['apprec', 'Appreciation', 'verbalising love for small daily gestures'],
  ['conflict', 'Conflict Resolution', 'fighting the problem rather than each other'],
  ['fun', 'Fun', 'spontaneous laughter, banter and lightness'],
  ['support', 'Support', 'encouraging personal goals and individual growth'],
] as const;

const transcriptText = (v: unknown, userLabel = 'User', otherLabel = 'Other person') =>
  (Array.isArray(v) ? v : [])
    .slice(-30)
    .map((t) => {
      const m = (t ?? {}) as Record<string, unknown>;
      return `${m.sender === 'user' ? userLabel : otherLabel}: ${str(m.text, 600)}`;
    })
    .join('\n');

export const TASKS = {
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
      `Decode this message someone received and suggest replies. Give English replies in "text" and Hinglish versions in "hinglishText".\n\n${quote('Message they received', str(i.message))}\n\n${quote('Context from before the message', str(i.context))}`,
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
    build: (i) => `Rewrite the user's draft message in a ${str(i.style, 60) || 'better'} style. Keep their meaning. Give three distinct versions with English in "text" and a Hinglish version in "hinglish".\n\n${quote('Their draft', str(i.originalText))}`,
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
      return `You are the in-app assistant. Answer the user's request and, where useful, point them to screens in the app.\nUser: ${str(u.name, 60) || 'the user'}; partner: ${str(u.partnerName, 60) || 'not specified'}; preferred language: ${languageLabel(u.preferredLanguage)}.\n\n${list(i.memories, 12).length ? `What you remember about them:\n- ${list(i.memories, 12).join('\n- ')}\n\n` : ''}${quote('Their request', str(i.query))}`;
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

  crushAnalysis: {
    effort: 'medium',
    schema: z.object({
      score: z.number().describe('0-100: how strongly these cues suggest interest. Behaviour never proves feelings, so stay between 15 and 90.'),
      ratingLabel: z.string().describe('short verdict, 3-7 words, may end with one emoji'),
      summary: z.string().describe('1-2 sentences tying the verdict to the answers'),
      signals: z
        .array(z.object({ label: z.string().describe('2-4 word name of the cue'), status: oneOf(['positive', 'neutral', 'watchout'], 'neutral'), detail: z.string().describe('one sentence on what this cue may and may not mean') }))
        .describe('one entry per answered cue, 3-6 entries'),
      aiAdvice: z.string().describe('one or two sentences: a low-pressure way to learn more'),
      nextMove: z.string().describe('one short message the user could actually text them, no quotation marks'),
    }),
    build: (i) => {
      const a = (i.answers ?? {}) as Record<string, unknown>;
      const lines = Object.entries(CRUSH_ANSWERS)
        .map(([key, { question, options }]) => {
          const v = str(a[key], 60);
          return v ? `- ${question}: ${options[v] ?? v}` : '';
        })
        .filter(Boolean);
      return `The user wants to know whether their crush might be interested. Read the behavioural cues they observed. Be encouraging but realistic: these cues are hints, not proof, and you must never promise how the crush feels. Weigh each cue honestly; mixed or one-sided cues deserve a moderate score and a "watchout" where it applies. Base the score only on these answers.\n\nWhat they observed:\n${lines.join('\n') || '(no answers)'}\n\nThe advice and next move should help the user find out directly and respectfully, never test, pressure or play games with the crush.`;
    },
  },

  relationshipSignal: {
    effort: 'medium',
    schema: z.object({
      flagType: flag.describe('green = healthy, yellow = ambiguous / worth discussing, red = concerning pattern'),
      label: z.string().describe('short headline starting with 🟢, 🟡 or 🔴 to match flagType'),
      analysis: z.string().describe('2-3 sentences about this specific behaviour, framed as possibilities'),
      whatToNotice: z.array(z.string()).describe('2-4 concrete things to watch for that would confirm or ease the concern'),
      whatToAsk: z.string().describe('one calm I-statement or question the user could say, in quotation marks'),
      healthyResponse: z.string().describe('1-2 sentences on how to respond in a healthy way'),
    }),
    build: (i) =>
      `Classify a behaviour the user noticed in someone they are dating or close to as a green, yellow or red flag. Judge the behaviour itself, including its context: one-off thoughtfulness or honest explanations lean green, ambiguous habits lean yellow, and control, contempt, coercion, intimidation, isolation or repeated deception are red. Don't diagnose anyone. If it sounds like abuse or the user may be unsafe, say so clearly and include the safety guidance from your instructions in healthyResponse. ${MATCH_LANGUAGE}\n\n${quote('What they observed', str(i.behaviorDescription, 2000))}`,
  },

  roleplayScore: {
    effort: 'medium',
    schema: z.object({
      confidence: z.number().describe('1-10, how confident and self-assured the user sounded'),
      clarity: z.number().describe('1-10, how clearly they said what they wanted'),
      naturalness: z.number().describe('1-10, how natural and human they sounded'),
      pressureLevel: level.describe('how much pressure the user put on the other person: Low is best'),
      whatWorked: z.array(z.string()).describe('2-3 specific things the user did well, quoting or referring to their own words'),
      whatCouldImprove: z.array(z.string()).describe('2-3 specific, kind suggestions'),
      betterScript: z.string().describe('a stronger version of what the user was trying to say, 1-3 sentences in their voice, no quotation marks'),
    }),
    build: (i) => {
      const sc = (i.scenario ?? {}) as Record<string, unknown>;
      const transcript = transcriptText(i.transcript, 'User', 'Practice partner');
      const userTurns = (Array.isArray(i.transcript) ? i.transcript : []).filter((t) => (t as Record<string, unknown>)?.sender === 'user').length;
      return `The user just finished a practice role-play of a real relationship conversation. Score only the user's messages, honestly and kindly. Scores must reflect what they actually wrote: short or vague messages get lower clarity, pushy or guilt-tripping ones get a higher pressure level. ${userTurns === 0 ? 'The user did not send any messages, so give low scores and encourage them to try.' : ''} ${MATCH_LANGUAGE}\nScenario: ${str(sc.title, 120)}\nThe practice partner played: ${str(sc.characterRole, 300)}\nContext: ${str(sc.context, 600)}\n\nTranscript:\n${transcript || '(empty)'}`;
    },
  },

  confessReadiness: {
    effort: 'medium',
    schema: z.object({
      status: flag.describe('green = good time, yellow = build more connection first, red = not yet'),
      statusLabel: z.string().describe('short verdict starting with 🟢, 🟡 or 🔴 to match status'),
      confidencePercent: z.number().describe('0-100: how confident you are in this timing read (not the chance they say yes)'),
      analysis: z.string().describe('1-2 sentences tying the verdict to their situation'),
      reasons: z.array(z.string()).describe('exactly 3 short reasons, each under 15 words'),
      recommendedSteps: z.array(z.string()).describe('2-4 concrete next steps'),
      suggestedScript: z.string().describe('2-3 sentences they could say, honest and low-pressure, leaving the other person free to say no. No quotation marks.'),
    }),
    build: (i) => {
      const s = (i.situation ?? {}) as Record<string, unknown>;
      return `The user is deciding whether now is a good time to confess their feelings. Give an honest timing read: encouraging, but realistic. You cannot know how the other person feels, so never promise an outcome. A close friendship raises the stakes and deserves care, not avoidance. Whatever the verdict, the steps and script must respect the other person's freedom to say no and keep any friendship intact. ${MATCH_LANGUAGE}\nHow long they have known each other: ${str(s.howLongKnown, 60) || 'not specified'}\nThey hang out one-on-one: ${yesNo(s.has1on1Hangouts)}\nThere is noticeable flirting or tension: ${yesNo(s.flirtyVibe)}\nThey are currently close best friends: ${yesNo(s.isCloseFriend)}\n\n${quote('Their situation in their own words', str(s.story, 1500))}`;
    },
  },

  dateAndGift: {
    effort: 'low',
    schema: z.object({
      dateIdeas: z
        .array(z.object({ title: z.string(), description: z.string().describe('1-2 sentences'), estimatedCost: z.string().describe('e.g. "₹800-1,200" or "Free"'), vibe: z.string().describe('1-3 words'), insiderTip: z.string().describe('one practical tip') }))
        .describe('exactly 3 distinct date ideas'),
      giftIdeas: z
        .array(z.object({ item: z.string(), whyTheyWillLoveIt: z.string().describe('one sentence'), priceRange: z.string().describe('in rupees, e.g. "₹500-900"') }))
        .describe('exactly 3 gift ideas'),
    }),
    build: (i) =>
      `Suggest date ideas and matching gifts for this occasion. Fit every idea to the occasion and budget level, and make them doable in an Indian city. Use realistic kinds of places; don't invent business names. Costs in Indian rupees.\nOccasion: ${str(i.occasion, 80) || 'a date'}\nBudget level: ${str(i.budget, 60) || 'moderate'} (Low / Free = under ₹500 total, Moderate = ₹500-3,000, Luxury = above ₹3,000)\nVibe: ${str(i.vibe, 80) || 'romantic'}${/making up|fight/i.test(str(i.occasion, 80)) ? '\nThis is after a fight: keep it gentle, focused on reconnecting and listening, never a way to skip the apology.' : ''}`,
  },

  healthCheck: {
    effort: 'medium',
    schema: z.object({
      notes: z
        .object(Object.fromEntries(HEALTH_CATEGORIES.map(([id, label]) => [id, z.string().describe(`one sentence about ${label} that reflects its rating`)])) as Record<(typeof HEALTH_CATEGORIES)[number][0], z.ZodString>)
        .describe('a note per pillar'),
      strengths: z.array(z.string()).describe('2-3 full sentences, each naming one of the highest-rated pillars and what it says about them'),
      areasWorthDiscussing: z.array(z.string()).describe('2-3 full sentences, each naming one of the lowest-rated pillars and a gentle idea for it'),
      suggestedActions: z.array(z.string()).describe('2-3 small concrete actions for this week, aimed at the lowest-rated pillars'),
      overallHealthLabel: z.string().describe('3-6 word summary that matches the average rating, may end with one emoji'),
    }),
    build: (i) => {
      const a = (i.answers ?? {}) as Record<string, unknown>;
      const rows = HEALTH_CATEGORIES.filter(([id]) => a[id] != null).map(([id, label, desc]) => ({ id, label, desc, score: num(a[id], 0, 100, 50) }));
      const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
      return `A user rated their relationship over the past two weeks on eight pillars (0-100, higher is better). Write a reflection that follows directly from these ratings: praise what is rated high, gently name what is rated low, and never contradict a rating. This is a reflection tool, not a diagnosis.\n\n${rows.map((r) => `- ${r.label} (${r.id}): ${r.score}/100 (${r.desc})`).join('\n') || '(no ratings)'}\nAverage: ${avg}/100\n\nFor the label: 85+ is thriving, 70-84 is healthy with room to grow, 55-69 needs some attention, below 55 needs care and honest conversation.`;
    },
  },

  loveCard: {
    effort: 'low',
    schema: z.object({
      quote: z.string().describe('one original, universal line for the card front, under 20 words. Do not include any name. No quotation marks.'),
      personalNote: z.string().describe('2-3 warm sentences to the recipient by name, fitting the card type'),
    }),
    build: (i) =>
      `Write the text for a digital love card.\nCard type: ${str(i.type, 60) || 'Just Because'}\nRecipient: ${str(i.recipient, 60) || 'my partner'}\nVisual theme (match its mood): ${str(i.theme, 40) || 'soft-rose'}\nMake it feel personal and specific to the card type, not a greeting-card cliche. An apology card should own the mistake without excuses or guilt-tripping. ${MATCH_LANGUAGE}`,
  },

  ourStory: {
    effort: 'medium',
    schema: z.object({
      chapters: z
        .array(z.object({ title: z.string().describe('3-7 words'), subtitle: z.string().describe('3-8 words'), content: z.string().describe('80-130 words') }))
        .describe('exactly 5 chapters, in this order: how they met, first date, funny memory, favourite place, what they love about each other'),
    }),
    build: (i) => {
      const m = (i.memories ?? {}) as Record<string, unknown>;
      const style = str(i.style, 20);
      const styleNote = style === 'funny' ? 'funny and affectionate, with light teasing' : style === 'cinematic' ? 'cinematic, like scenes in a film, with vivid sensory detail' : 'romantic and heartfelt';
      return `Write a five-chapter story of this couple's real relationship, built from their own memories. Each chapter centres on one memory, in order. Keep the facts they gave you exactly, including who did what, and use their names; add only small sensory details, never new events or twists. Style: ${styleNote}. Keep it wholesome. ${MATCH_LANGUAGE}\nThe couple: ${str(i.partners, 120) || 'the two of them'}\n\n${quote('1. How they met', str(m.howMet, 600))}\n\n${quote('2. First date', str(m.firstDate, 600))}\n\n${quote('3. Funny memory', str(m.funnyMemory, 600))}\n\n${quote('4. Favourite place', str(m.favoritePlace, 600))}\n\n${quote('5. What the user loves about their partner (the user\'s own words: "I/my" is the user, "you/he/she" is the partner; keep each quality with the right person)', str(m.whatYouLove, 600))}`;
    },
  },

  scrapbookCaption: {
    effort: 'low',
    schema: z.object({
      romantic: z.string().describe('one romantic caption sentence'),
      funny: z.string().describe('one playful, funny caption sentence'),
      shortStory: z.string().describe('3-4 sentences telling the moment as a tiny story'),
    }),
    build: (i) =>
      `Write captions for a page in a couple's scrapbook. Ground them in the details of this memory; don't invent major events. ${MATCH_LANGUAGE}\nMemory title: ${str(i.title, 200) || 'a memory'}\n${str(i.date, 60) ? `Date: ${str(i.date, 60)}\n` : ''}${str(i.location, 120) ? `Place: ${str(i.location, 120)}\n` : ''}${str(i.tags, 200) ? `Tags: ${str(i.tags, 200)}\n` : ''}\n${quote('Their own description', str(i.detail, 1000))}`,
  },

  storyEpisode: {
    effort: 'low',
    schema: z.object({
      title: z.string().describe('3-7 word chapter title, without the word "Chapter" or a number'),
      content: z.string().describe('130-220 words of story'),
    }),
    build: (i) => {
      const n = num(i.episodeNum, 1, 99, 1);
      const prev = (Array.isArray(i.previousEpisodes) ? i.previousEpisodes : []).slice(-3).map((e) => {
        const x = (e ?? {}) as Record<string, unknown>;
        return `${str(x.title, 120)}: ${str(x.content, 1200)}`;
      });
      return `Write chapter ${n} of an ongoing love story starring the user and their partner. ${n === 1 ? 'Open with how they met.' : 'Continue naturally from the previous chapters: a new moment in their relationship, not a retelling.'} Use their names and the setting. Tone: ${str(i.mood, 60) || 'romantic and heartwarming'}. Keep it wholesome, nothing explicit, and no controlling or possessive behaviour presented as romantic. ${MATCH_LANGUAGE}\nMain character: ${str(i.protagonist, 60) || 'the narrator'}\nPartner: ${str(i.partner, 60) || 'their partner'}\nHow they met: ${str(i.howWeMet, 400)}\nSetting: ${str(i.setting, 200) || 'a city in India'}\n${prev.length ? `\nPrevious chapters (most recent last):\n${prev.join('\n\n')}` : ''}`;
    },
  },

  surprisePlan: {
    effort: 'low',
    schema: z.object({
      title: z.string().describe('a catchy 3-7 word name for the surprise'),
      timeline: z.array(z.object({ time: z.string().describe('24-hour HH:MM'), action: z.string().describe('one sentence') })).describe('4-6 steps in time order'),
      foodIdea: z.string(),
      playlistSuggestion: z.string().describe('a mood or genre with 2-3 example artists or songs, and rough length'),
      secretClosingGesture: z.string().describe('one small, heartfelt finishing touch'),
    }),
    build: (i) => {
      const ld = str(i.locationType, 20) === 'long_distance';
      return `Plan a surprise for the user's partner. ${ld ? 'They are in a long-distance relationship, so every step must work remotely (a scheduled call, a delivery to the partner, a shared online activity).' : 'They are in the same city and will be together.'} Stay within budget (costs in Indian rupees) and fit the mood and duration. The surprise should be something the partner would enjoy and feel comfortable with: nothing public or embarrassing unless the mood asks for it, and nothing that needs access to the partner's phone, accounts or location.\nPartner: ${str(i.partnerName, 60) || 'their partner'}\nBudget: ${str(i.budget, 80) || 'moderate'}\nMood and duration: ${str(i.mood, 120) || 'romantic, one evening'}`;
    },
  },
  ...ASTRO_TASKS,
} satisfies Record<string, TaskDef>;

export type TaskName = keyof typeof TASKS;
export const isTaskName = (n: string): n is TaskName => Object.prototype.hasOwnProperty.call(TASKS, n);
