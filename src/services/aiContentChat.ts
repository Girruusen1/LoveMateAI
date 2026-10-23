// Content banks for chat-style generators (reply generator, love chat, reply copilot).
// Placeholders are filled with fill() from aiVariation.ts: {quote}, {topic}, {name}.

export type ReplyIntent = 'flirty' | 'cute' | 'funny' | 'casual' | 'romantic' | 'savage' | 'keep-going';

export interface ReplyTemplate {
  vibe: string;
  en: string;
  hi: string;
  why: string;
}

export const toReplyIntent = (intent: string): ReplyIntent | null => {
  const i = intent.toLowerCase();
  if (i.includes('flirt')) return 'flirty';
  if (i.includes('cute') || i.includes('sweet')) return 'cute';
  if (i.includes('fun') || i.includes('banter') || i.includes('meme')) return 'funny';
  if (i.includes('romantic') || i.includes('deep') || i.includes('sincere')) return 'romantic';
  if (i.includes('savage') || i.includes('roast')) return 'savage';
  if (i.includes('keep') || i.includes('going') || i.includes('revive')) return 'keep-going';
  if (i.includes('casual') || i.includes('chill')) return 'casual';
  return null;
};

export const REPLY_BANK: Record<ReplyIntent, ReplyTemplate[]> = {
  flirty: [
    { vibe: 'Teasing Callback', en: `"{quote}" — bold of you to text me that and expect me to stay calm 😏`, hi: `"{quote}" — itna cute text bhej ke expect kar rahe ho main normal reply karu? 😏`, why: 'Quotes their own words back with playful tension, so it feels personal, not copy-pasted.' },
    { vibe: 'Confident Invite', en: `Okay, {topic} talk is officially more fun with you. Say all this to me in person over coffee?`, hi: `{topic} wali baat tere saath hi mazedaar lagti hai. Coffee pe face-to-face bolna ye sab? ☕`, why: 'Turns the topic they raised into a low-pressure plan.' },
    { vibe: 'Playful Challenge', en: `You can't just say "{quote}" and leave me guessing. Explain yourself 😌`, hi: `Aise "{quote}" bol ke chup nahi ho sakte, explain karo abhi 😌`, why: 'Invites them to say more while keeping the spark.' },
    { vibe: 'Smooth Compliment', en: `Not gonna lie, I smiled at "{quote}" way more than I should have.`, hi: `Sach bolu? "{quote}" padh ke zyada hi smile aa gayi 🙈`, why: 'Shows the message landed without overplaying it.' },
    { vibe: 'Spark Builder', en: `Careful — keep texting me about {topic} like this and I'll start looking forward to your messages a little too much 😉`, hi: `Aise hi {topic} ke baare mein text karte rahe toh mujhe tere texts ki aadat lag jayegi 😉`, why: 'Admits interest lightly and hands the next move back to them.' },
  ],
  cute: [
    { vibe: 'Soft & Warm', en: `"{quote}" is genuinely the nicest thing on my screen today 🥺`, hi: `"{quote}" — aaj ka sabse pyaara text yahi hai 🥺`, why: 'Simple warmth that makes them feel appreciated for what they wrote.' },
    { vibe: 'Sweet Curiosity', en: `Wait, tell me more about {topic}! I like hearing you talk about stuff like this ✨`, hi: `Ruko, {topic} ke baare mein aur batao na! Tujhe aise baatein karte sunna acha lagta hai ✨`, why: 'Shows interest in their world, which is the cutest thing you can do.' },
    { vibe: 'Tiny Confession', en: `Okay this made me smile like an idiot. You're kind of the best, you know that?`, hi: `Isne mujhe pagalon ki tarah smile karwa di. Tu na, kaafi best hai, pata hai? 😊`, why: 'A small, honest compliment with zero pressure.' },
    { vibe: 'Wholesome Callback', en: `Saving "{quote}" in my mental folder of reasons today was a good day ❤️`, hi: `"{quote}" ko main apne 'aaj ka din acha tha' folder mein save kar raha/rahi hu ❤️`, why: 'Turns their message into a sweet keepsake moment.' },
    { vibe: 'Gentle Check-in', en: `Aww. Also — have you eaten yet? Asking for a friend (the friend is me, I care).`, hi: `Aww. Vaise khana khaya? Bas pooch raha/rahi hu, care karta/karti hu thoda 🙂`, why: 'Care plus a light joke keeps it sweet, not intense.' },
  ],
  funny: [
    { vibe: 'Dramatic Overreaction', en: `"{quote}"?? I need to sit down. Someone get me a glass of water and a lawyer 😂`, hi: `"{quote}"?? Mujhe baithna padega. Koi paani lao aur ek vakeel bhi 😂`, why: 'Exaggeration makes even a small message feel like a fun moment.' },
    { vibe: 'Mock Investigation', en: `Hold on, opening an official investigation into this {topic} situation. Please state your alibi.`, hi: `Ruko, is {topic} wale case ki official investigation shuru. Apna alibi batao 🕵️`, why: 'Playful role-play invites them to banter back.' },
    { vibe: 'Meme Energy', en: `Me reading "{quote}": 👁️👄👁️`, hi: `"{quote}" padhte hue mera face: 👁️👄👁️`, why: 'Short meme-style reaction, effortless and funny.' },
    { vibe: 'Rating System', en: `Rating this text: 9/10. Would have been 10 but you didn't mention me 😌`, hi: `Is text ki rating: 9/10. 10 hota agar mera zikr hota 😌`, why: 'Cheeky self-insert keeps attention on the two of you.' },
    { vibe: 'Plot Twist', en: `Plot twist: I was literally about to text you about {topic}. Are you reading my mind again?`, hi: `Plot twist: main bhi abhi {topic} ke baare mein text karne wala/wali tha. Mind read kar rahe ho kya? 😂`, why: 'Creates a fun "we are in sync" moment.' },
  ],
  casual: [
    { vibe: 'Easy Follow-up', en: `Haha fair. What's the rest of your day looking like?`, hi: `Haha fair. Aaj baaki din ka kya scene hai?`, why: 'Low-effort, low-pressure way to keep the chat alive.' },
    { vibe: 'Topic Pick-up', en: `Ooh {topic}, nice. How did that go?`, hi: `Ooh {topic}, nice. Kaisa raha wo?`, why: 'Picks up the thread they offered without overthinking it.' },
    { vibe: 'Relaxed Agreement', en: `Honestly same. "{quote}" is a whole mood.`, hi: `Sach mein same. "{quote}" — pura mood hai ye.`, why: 'Mirrors their vibe, which builds comfort.' },
    { vibe: 'Chill Plan Hint', en: `Sounds good. We should grab chai sometime this week, no big deal.`, hi: `Sahi hai. Is hafte kabhi chai pe chalte hain, koi tension nahi.`, why: 'Floats a plan casually so it is easy to say yes to.' },
    { vibe: 'Open Door', en: `Ha, makes sense. Ping me when you're free, I've got a story for you.`, hi: `Haha samajh gaya/gayi. Free ho toh ping karna, ek story sunani hai.`, why: 'Leaves a hook so they come back to you.' },
  ],
  romantic: [
    { vibe: 'Sincere Warmth', en: `I read "{quote}" twice. Messages like this are why I look forward to talking to you.`, hi: `"{quote}" maine do baar padha. Aise messages ki wajah se hi tujhse baat karne ka intezaar rehta hai.`, why: 'Honest appreciation that deepens the connection.' },
    { vibe: 'Meaningful Question', en: `I love that you shared that about {topic}. What does it mean to you?`, hi: `Acha laga tune {topic} ke baare mein share kiya. Tere liye iska kya matlab hai?`, why: 'Invites emotional depth instead of small talk.' },
    { vibe: 'Quiet Affection', en: `Somehow you always make an ordinary day feel a little softer ❤️`, hi: `Pata nahi kaise, par tu har normal din ko thoda pyaara bana deta/deti hai ❤️`, why: 'Gentle affection without heavy pressure.' },
    { vibe: 'Presence', en: `Wish I was there to hear you say that in person. Soon?`, hi: `Kaash ye tere muh se sunta/sunti. Jaldi milte hain?`, why: 'Expresses longing and nudges toward real time together.' },
    { vibe: 'Grateful Note', en: `Thank you for telling me that. I really like who I am when we talk.`, hi: `Mujhe ye batane ke liye thank you. Tujhse baat karke main khud ko bhi acha lagta/lagti hu.`, why: 'Emotionally mature and genuine without being clingy.' },
  ],
  savage: [
    { vibe: 'Dry-Text Roast', en: `"{quote}"? Wow, the effort is overwhelming. Should I give you a minute to recover? 😂`, hi: `"{quote}"? Wah, itni mehnat! Thoda aaram kar le, thak gaya/gayi hoga 😂`, why: 'Calls out low effort with humour instead of hurt.' },
    { vibe: 'Energy Match', en: `Cool. Matching your energy now: k.`, hi: `Theek hai. Teri energy match kar raha/rahi hu: k.`, why: 'Playfully mirrors dryness so they notice it.' },
    { vibe: 'Confident Exit', en: `Haha alright, text me when you're in a more interesting mood 😌`, hi: `Haha theek hai, jab mood interesting ho tab text karna 😌`, why: 'Shows you are not chasing — very attractive.' },
    { vibe: 'Playful Jab', en: `Imagine having {topic} to talk about and choosing this reply. Couldn't be me.`, hi: `{topic} jaisa topic hai aur reply ye? Main toh kabhi na karu 💀`, why: 'Teasing roast that still invites a better reply.' },
    { vibe: 'Challenge Accepted', en: `That's the best you've got? I expected a plot twist, not a summary 💀`, hi: `Bas itna hi? Mujhe plot twist chahiye tha, summary nahi 💀`, why: 'Raises the bar with a smile.' },
  ],
  'keep-going': [
    { vibe: 'Thread Puller', en: `Wait, go back to {topic} — I feel like there's a story there.`, hi: `Ruko, {topic} pe wapas aao — lagta hai iske peeche koi story hai.`, why: 'Pulls on a detail they mentioned, which is the easiest way to revive a chat.' },
    { vibe: 'Open Question', en: `Okay but real question: what's been the best part of your week so far?`, hi: `Acha seedha sawaal: is hafte ka best moment kya tha?`, why: 'Open-ended questions are hard to answer with one word.' },
    { vibe: 'This or That', en: `Quick, settle this: mountains or beaches for a weekend escape?`, hi: `Jaldi bata: weekend ke liye pahad ya beach?`, why: 'Easy game format gets a reply and gives you a new topic.' },
    { vibe: 'Callback Hook', en: `"{quote}" reminds me — did you ever finish that thing you were telling me about?`, hi: `"{quote}" se yaad aaya — wo cheez jo tu bata raha/rahi tha, complete hui?`, why: 'Shows you remember earlier details and opens a fresh topic.' },
    { vibe: 'Share First', en: `Random but I just tried something new today and it was a disaster 😂 Want the story?`, hi: `Random hai par aaj kuch naya try kiya aur full disaster hua 😂 Story sunni hai?`, why: 'Sharing first lowers their effort to respond.' },
  ],
};

// ------------------------------
// AI Love Chat
// ------------------------------

export type ChatTopic = 'dry' | 'fight' | 'crush' | 'confess' | 'ex' | 'miss' | 'date' | 'nervous' | 'general';

export const CHAT_BODIES: Record<ChatTopic, { en: string[]; hi: string[] }> = {
  dry: {
    en: [
      `Don't overthink one dry reply yet. People get busy, drained or distracted. Golden rule: match their length and pace — three words from them doesn't deserve a novel from you.`,
      `A short reply is data, not a verdict. Watch the pattern over a week: do they ever start conversations or ask you anything back? If not, pull back and let them lean in.`,
      `Try one light, specific question instead of a paragraph — something only they can answer. If that still gets "haha ok", take a day off texting and see who reaches out first.`,
    ],
    hi: [
      `Bhai, sirf do dry replies se ye mat soch ki game over ho gaya 😅 Ho sakta hai wo busy ho ya mood off ho. Par agar har baar tu hi paragraph likh raha hai aur wo ek word de raha hai, toh match the energy!`,
      `Dry reply ek data point hai, final verdict nahi. Ek hafte ka pattern dekh — kya wo kabhi khud text start karte hain ya sawaal wapas poochte hain? Agar nahi, toh thoda peeche ho ja.`,
      `Lamba paragraph mat bhej. Ek chota, specific sawaal pooch jo sirf wo hi answer kar sake. Phir bhi "hmm ok" aaye toh ek din ka break le aur dekh pehle kaun text karta hai.`,
    ],
  },
  fight: {
    en: [
      `First rule of post-fight repair: stop texting from ego. Send something disarming like: "Hey, I hate how we left things. I care about you more than winning this. Whenever you're ready, I'd love to listen."`,
      `Give it a little time for both nervous systems to calm down, then lead with one sentence of ownership, not a defence. "I was sharp earlier and I'm sorry" goes further than a five-point explanation.`,
      `Ask yourself: do you want to win the argument or keep the relationship? Then open with curiosity: "Can you tell me what hurt the most? I want to actually understand."`,
    ],
    hi: [
      `Deep breath le pehle! 🛑 Fight ke turant baad ego bolti hai, pyaar nahi. Simple message bhej: "Mujhe realise hua ki maine rude way mein bola. I value you more than my temper. Jab tum ready ho, shaanti se baat karte hain."`,
      `Thoda time de dono ko shaant hone ka, phir ek line ownership ki likh, defence ki nahi. "Main pehle thoda harsh tha/thi, sorry" — ye paanch points ki explanation se zyada kaam karta hai.`,
      `Khud se pooch: argument jeetna hai ya rishta bachana hai? Phir curiosity se shuru kar: "Mujhe batao sabse zyada kis baat ka bura laga? Main sach mein samajhna chahta/chahti hu."`,
    ],
  },
  crush: {
    en: [
      `Look for three micro-signals: 1. They recall tiny specifics you mentioned in passing. 2. In groups, their attention drifts toward you first. 3. They revive dead chats or ask open-ended questions. Two out of three is a good sign.`,
      `Interest usually shows up as effort: quick-ish replies, follow-up questions, suggesting plans, remembering details. Which of these have you actually seen from them lately?`,
      `Don't decode one moment — decode the pattern. Do they make time for you, laugh at your jokes, and check in without a reason? If yes, there's real curiosity there.`,
    ],
    hi: [
      `Ye 3 signs check kar: 1. Kya wo choti details yaad rakhte hain jo tune casually boli thi? 2. Group mein hasi aaye toh unki nazar pehle teri taraf aati hai? 3. Kya wo khud naya topic start karte hain? 2 bhi yes hain toh interest pakka hai 😉`,
      `Interest effort mein dikhta hai: reply jaldi, follow-up sawaal, plan suggest karna, details yaad rakhna. Inme se kya kya tune actually notice kiya hai?`,
      `Ek moment ko decode mat kar, pattern dekh. Kya wo tere liye time nikalte hain, tere jokes pe haste hain, bina wajah check-in karte hain? Agar haan, toh kuch toh hai 😏`,
    ],
  },
  confess: {
    en: [
      `If you're thinking of confessing, keep it short, warm and low-pressure: say how you feel, then give them room. "I've really liked spending time with you and I wanted to be honest that I like you. No pressure at all."`,
      `Timing matters more than wording. Pick a calm, private moment — not right after a fight, not over a group chat. Then say it simply and let silence be okay.`,
      `Before confessing, check one thing: have you had real 1-on-1 time together? If yes, you're ready to be honest. If not, build a couple of hangouts first so it doesn't come out of nowhere.`,
    ],
    hi: [
      `Confess karna hai toh chota, warm aur low-pressure rakh: feelings bol aur unhe space de. "Tere saath time spend karna mujhe bohot acha lagta hai, aur sach bolu toh tu mujhe pasand hai. Koi pressure nahi."`,
      `Words se zyada timing matter karti hai. Ek calm, private moment chun — fight ke turant baad nahi, group chat pe toh bilkul nahi. Seedha bol aur thodi chuppi ko bhi okay maan.`,
      `Confess se pehle ek cheez check kar: kya tum dono ne 1-on-1 time spend kiya hai? Haan toh ready hai. Nahi toh pehle do-teen hangouts kar, taaki baat achanak na lage.`,
    ],
  },
  ex: {
    en: [
      `Ex situations are tricky because old feelings mix with new loneliness. Ask yourself: do you miss them, or do you miss being cared for? The answer changes everything.`,
      `If they're reaching out, look at actions, not nostalgia. Have the things that ended it actually changed? If not, protect your peace.`,
      `It's okay to still feel something. Feeling it doesn't mean acting on it — give yourself a few days before replying to anything from them.`,
    ],
    hi: [
      `Ex wala scene tricky hota hai kyunki purani feelings aur nayi loneliness mix ho jaati hain. Khud se pooch: unki yaad aa rahi hai ya bas kisi ki care ki?`,
      `Agar wo wapas text kar rahe hain, toh nostalgia nahi, actions dekh. Jis wajah se break hua tha, kya wo sach mein badla hai? Nahi toh apni peace bacha.`,
      `Abhi bhi kuch feel karna normal hai. Feel karna aur act karna alag cheez hai — reply karne se pehle khud ko do-teen din de.`,
    ],
  },
  miss: {
    en: [
      `Missing someone is a sign of how much they matter. Tell them simply: "Hey, I miss you today." It's vulnerable, but it's honest and easy to respond to.`,
      `For distance, small rituals beat long calls: a good-morning voice note, a shared playlist, a countdown to the next visit. What's one ritual you two could start this week?`,
      `When missing them hurts, plan something concrete — even a virtual dinner date. Having a date on the calendar turns longing into excitement.`,
    ],
    hi: [
      `Kisi ki yaad aana dikhata hai wo kitne important hain. Seedha bol: "Aaj tu bohot yaad aa raha/rahi hai." Vulnerable hai, par sach hai aur reply karna easy hai.`,
      `Distance mein lambi calls se zyada chhote rituals kaam karte hain: good-morning voice note, shared playlist, agli mulaqat ka countdown. Is hafte kaunsa ritual shuru karein?`,
      `Jab yaad zyada aaye toh kuch concrete plan kar — virtual dinner date bhi chalega. Calendar pe date ho toh intezaar excitement ban jaata hai.`,
    ],
  },
  date: {
    en: [
      `For a first or early date, pick something side-by-side: a walk, a market, a dessert crawl. Less eye-contact pressure, more natural conversation.`,
      `Make the ask specific — "Want to try that new cafe on Saturday around 5?" — specific plans are much easier to say yes to than "we should hang out sometime".`,
      `Keep it short and sweet. A 90-minute date that ends on a high is better than a 5-hour one that fizzles. Leave them wanting the next one.`,
    ],
    hi: [
      `Pehli ya early date ke liye side-by-side wala plan chun: walk, market, dessert crawl. Eye contact ka pressure kam, baatein natural.`,
      `Poochna specific rakh — "Saturday 5 baje wo naya cafe try karein?" — "kabhi milte hain" se specific plan pe haan bolna kaafi easy hota hai.`,
      `Date chhoti aur sweet rakh. 90 minute ki date jo high pe khatam ho, wo 5 ghante ki fizzle hui date se behtar hai. Agli date ka intezaar chhod ke aa.`,
    ],
  },
  nervous: {
    en: [
      `Nerves just mean you care. Before the moment, slow your breathing — four seconds in, six out — and remind yourself the goal is connection, not perfection.`,
      `Overthinking loves silence. Write down the worst-case story in your head, then the most likely story. They're usually very different.`,
      `Prepare two easy questions in advance so you never feel stuck. People remember how you made them feel, not whether every sentence was smooth.`,
    ],
    hi: [
      `Nervous hona matlab tu care karta/karti hai. Moment se pehle saans dheere le — chaar second andar, chhe bahar — aur yaad rakh goal connection hai, perfection nahi.`,
      `Overthinking chuppi mein badhti hai. Dimaag wali worst-case story likh, phir most-likely story. Dono mein kaafi fark hota hai.`,
      `Do easy sawaal pehle se ready rakh, taaki kabhi atak na. Log yaad rakhte hain tune unhe kaisa feel karaya, ye nahi ki har line smooth thi ya nahi.`,
    ],
  },
  general: {
    en: [
      `I hear you — "{quote}" sounds like it's been on your mind. Let's figure it out step by step. What happened, and what outcome would feel good to you?`,
      `Okay, about "{quote}": tell me a bit more about who this is and where things stand right now, and I'll help you plan the next move.`,
      `Love can feel like a puzzle with missing pieces, but you're not alone in it ❤️ What's the one thing about "{quote}" you most want an answer to?`,
      `Got it. Before I give advice on "{quote}", is your goal to text them, confess, fix something, or just vent? I'll tailor it.`,
    ],
    hi: [
      `Main samajh raha hu yaar — "{quote}" tere dimaag mein chal raha hai. Thoda aur context de: situation kya hai aur tera goal kya hai?`,
      `Acha, "{quote}" ke baare mein: ye kaun hai aur abhi baat kahan tak pahunchi hai? Phir saath mein next move plan karte hain ❤️`,
      `Dil ke maamle thode complicated hote hain, par sort kar lenge. "{quote}" mein sabse zyada kis baat ka jawab chahiye?`,
      `Samjha. "{quote}" pe advice dene se pehle bata — text karna hai, confess karna hai, kuch fix karna hai ya bas vent karna hai?`,
    ],
  },
};

export const CHAT_OPENERS: Record<'wingman' | 'empath' | 'savage' | 'poet', { en: string[]; hi: string[] }> = {
  wingman: {
    en: [`Alright, wingman mode on.`, `Okay, I've got your back on this.`, `Let's handle this smartly.`],
    hi: [`Chal, wingman mode on.`, `Tension mat le, main hu na.`, `Acha sun, smartly handle karte hain.`],
  },
  empath: {
    en: [`I completely feel you on this.`, `That sounds genuinely hard, and your feelings make sense.`, `Thank you for sharing this with me.`],
    hi: [`I completely feel you yaar 🥺`, `Ye sach mein mushkil lagta hai, aur tera feel karna bilkul valid hai.`, `Share karne ke liye thank you, dil halka kar.`],
  },
  savage: {
    en: [`Real talk, no sugar-coating:`, `Okay, brutal honesty incoming.`, `Listen, you're the prize here.`],
    hi: [`Sidhi baat bolu? No filter:`, `Bhai, brutal honesty incoming 💀`, `Sun, tu prize hai, ye yaad rakh.`],
  },
  poet: {
    en: [`Matters of the heart rarely move in straight lines.`, `Every feeling has its season.`, `Some things are best understood slowly.`],
    hi: [`Dil ke maamlon mein jaldbazi khoobsurti cheen leti hai.`, `Har jazbaat ka ek waqt hota hai ✨`, `Kuch baatein dheere-dheere hi samajh aati hain.`],
  },
};

export const CHAT_REPEAT_ACKS: { en: string[]; hi: string[] } = {
  en: [`Let me come at this from a different angle.`, `Okay, different angle this time:`, `Here's another way to look at it.`],
  hi: [`Chal, is baar doosre angle se dekhte hain.`, `Theek hai, ek naya angle try karte hain:`, `Isko ek alag tarike se dekh:`],
};

export const CHAT_FOLLOWUPS: { en: string[]; hi: string[] } = {
  en: [`What did they say most recently?`, `How long has this been going on?`, `What would a good outcome look like for you?`, `Want me to draft the exact message?`],
  hi: [`Unka last message kya tha?`, `Ye kab se chal raha hai?`, `Tere liye best outcome kya hoga?`, `Exact message draft karke du?`],
};

// ------------------------------
// Reply Copilot
// ------------------------------

export type CopilotSignal = 'busy' | 'maybe' | 'question' | 'laugh' | 'short' | 'neutral';

export const COPILOT_BEST: Record<CopilotSignal, { en: string[]; hi: string[] }> = {
  busy: {
    en: [`No stress at all, work comes first! If {topic} doesn't fit this week, how about early next week?`, `Totally get it. Let's not lose the {topic} plan though — pick a day that works and I'm in.`, `Ha, sounds like a lot. Good luck with it! {topic} whenever you come up for air?`],
    hi: [`Koi tension nahi, kaam pehle! Is hafte {topic} fit na ho toh next week ki shuruaat mein?`, `Samajh gaya/gayi. Par {topic} wala plan cancel mat karna — jo din suit kare bata, main ready.`, `Haha lagta hai bohot kaam hai. All the best! Free ho toh {topic}?`],
  },
  maybe: {
    en: [`Haha I'll take "maybe" as a soft yes. Saturday or Sunday for {topic}?`, `Fair! I'll keep a spot for {topic} open — just tell me which day sounds less chaotic.`, `"We'll see" is my favourite kind of yes 😌 Let me know and I'll sort the {topic} details.`],
    hi: [`Haha "maybe" ko soft yes samajh raha/rahi hu. {topic} ke liye Saturday ya Sunday?`, `Fair! {topic} ke liye jagah khali rakhta/rakhti hu — bas bata kaunsa din kam chaotic hai.`, `"Dekhte hain" mera favourite type ka yes hai 😌 Bata dena, {topic} ki details main sambhal lunga/lungi.`],
  },
  question: {
    en: [`Good question! Honestly, yes — and I was going to ask you the same thing about {topic}.`, `Ha, short answer: definitely. Long answer: over coffee 😄`, `I'd say yes, but I want your take on {topic} first.`],
    hi: [`Acha sawaal! Sach bolu toh haan — aur main bhi {topic} ke baare mein yahi poochne wala/wali tha.`, `Short answer: bilkul. Long answer: coffee pe 😄`, `Haan, par pehle {topic} pe tera opinion chahiye.`],
  },
  laugh: {
    en: [`Haha I knew you'd like that 😂 Okay but seriously, {topic} — are we doing it?`, `Glad I could make you laugh. Now I'm officially owed a {topic} plan.`, `That laugh = you're free this week, right? {topic}?`],
    hi: [`Haha pata tha tujhe pasand aayega 😂 Par seriously, {topic} — kar rahe hain na?`, `Hasaa diya na? Ab ek {topic} plan toh banta hai.`, `Is hasi ka matlab tu is hafte free hai, right? {topic}?`],
  },
  short: {
    en: [`Haha okay. What are you up to right now?`, `Short and sweet. Busy day?`, `Ha, alright. Tell me one good thing about your day.`],
    hi: [`Haha theek hai. Abhi kya kar raha/rahi hai?`, `Short and sweet. Busy din hai?`, `Acha. Aaj ki ek achi baat bata.`],
  },
  neutral: {
    en: [`Haha honestly that made me smile. Are you free this evening by any chance?`, `Love that. So when are we actually doing {topic}?`, `Ha, nice. Tell me more about that later over {topic}?`],
    hi: [`Haha isne smile la di. Aaj shaam free hai kya?`, `Sahi hai. Toh {topic} actually kab kar rahe hain?`, `Nice. Baaki baat {topic} pe karte hain?`],
  },
};

export const COPILOT_PLAYFUL: { en: string[]; hi: string[] } = {
  en: [`Oh really? When did you get so cheeky? 😂 I might forgive you if {topic} is on you.`, `"{quote}" — wow, the suspense. Are you always this mysterious?`, `I'm screenshotting "{quote}" as evidence for later 😂`],
  hi: [`Acha ji? Itna attitude kab se aa gaya? 😂 {topic} tere taraf se ho toh maaf kar dunga/dungi.`, `"{quote}" — wah, kitna suspense. Hamesha itne mysterious rehte ho?`, `"{quote}" ka screenshot le raha/rahi hu, baad mein saboot ke kaam aayega 😂`],
};

export const COPILOT_FLIRTY: { en: string[]; hi: string[] } = {
  en: [`You can act all innocent, but you definitely knew what you were doing with that text 😉`, `Careful, replies like "{quote}" make me want to see you sooner.`, `Busy or not, I'm saving you a seat for {topic} 😏`],
  hi: [`Jitna bhi innocent ban le, mujhe pata hai ye text jaanbujh ke aisa tha 😉`, `Dhyan se, "{quote}" jaise replies se tujhe jaldi milne ka mann karta hai.`, `Busy ho ya nahi, {topic} pe teri seat reserved hai 😏`],
};

export const COPILOT_SAFE: { en: string[]; hi: string[] } = {
  en: [`Totally get that! Hope the rest of your day goes smoothly. Let's catch up when you're free.`, `No worries at all. Talk later!`, `Sounds good, take your time 🙂`],
  hi: [`Makes sense yaar! Hope tera din acha jaa raha ho. Baad mein chill hokar baat karte hain.`, `Koi baat nahi, baad mein baat karte hain!`, `Theek hai, apna time le 🙂`],
};

export const COPILOT_EXTENDERS: { en: string[]; hi: string[] } = {
  en: [`By the way, what's the {topic} you've been wanting to try most?`, `Random question: best thing that happened to you this week?`, `Okay but are you always like this, or do I get special treatment? 😄`],
  hi: [`Vaise, {topic} mein tujhe sabse zyada kya try karna hai?`, `Random sawaal: is hafte ki sabse achi baat kya hui?`, `Tu hamesha aisa hi hai ya mujhe special treatment mil raha hai? 😂`],
};

export const COPILOT_TOPIC_CHANGE: { en: string[]; hi: string[] } = {
  en: [`Anyway, changing topics — have you watched anything good lately?`, `Unrelated, but I need a food recommendation for this weekend. Go.`, `Quick poll: chai or coffee, and defend your answer.`],
  hi: [`Acha chhod ye sab, koi acha show dekha recently?`, `Unrelated, par weekend ke liye khane ka recommendation chahiye. Bata.`, `Quick poll: chai ya coffee, aur defend kar apna answer ☕`],
};

export const COPILOT_HINGLISH_BONUS: string[] = [
  `Sahi hai yaar! Tu bata, kab mil rahe hain fir? Coffee meri taraf se!`,
  `Chal theek hai, par {topic} ka plan pakka karna padega, koi bahana nahi 😄`,
  `Haha tu bhi na! Free hoke ek call kar, baaki baatein tab.`,
];
