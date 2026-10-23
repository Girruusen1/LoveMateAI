// Content banks for writing generators: confessions, love cards, Our Story chapters, story episodes.

export type LangKey = 'en' | 'hi' | 'dev';
type ByLang = Record<LangKey, string[]>;

export type RecipientKey = 'crush' | 'bestfriend' | 'partner' | 'special';
export type ToneKey = 'cute' | 'romantic' | 'funny' | 'emotional' | 'confident' | 'shy' | 'deep';

export const toRecipientKey = (recipient: string): RecipientKey => {
  const r = recipient.toLowerCase();
  if (r.includes('best') || r.includes('friend')) return 'bestfriend';
  if (r.includes('partner') || r.includes('wife') || r.includes('husband') || r.includes('girlfriend') || r.includes('boyfriend')) return 'partner';
  if (r.includes('crush')) return 'crush';
  return 'special';
};

export const toToneKey = (tone: string): ToneKey => {
  const t = tone.toLowerCase();
  const keys: ToneKey[] = ['cute', 'romantic', 'funny', 'emotional', 'confident', 'shy', 'deep'];
  return keys.find((k) => t.includes(k)) ?? 'romantic';
};

export const CONFESSION_OPENINGS: Record<RecipientKey, ByLang> = {
  crush: {
    en: [`I've rewritten this message more times than I'd like to admit.`, `Okay, I'm just going to say it before I lose my nerve.`],
    hi: [`Ye message maine kitni baar likh ke delete kiya hai, tujhe andaza bhi nahi.`, `Theek hai, himmat toote usse pehle bol hi deta/deti hu.`],
    dev: [`ये मैसेज मैंने कितनी बार लिखकर मिटाया है, तुम्हें अंदाज़ा भी नहीं।`, `ठीक है, हिम्मत टूटने से पहले कह ही देता हूँ।`],
  },
  bestfriend: {
    en: [`You've been my person through everything, which is exactly why this is so hard to type.`, `Best friend to best friend — I owe you honesty, even the scary kind.`],
    hi: [`Tu meri har cheez mein saath raha/rahi hai, isliye ye type karna itna mushkil hai.`, `Best friend hone ke naate tujhse sach chhupana galat lagta hai, chahe darr lage.`],
    dev: [`तुम हर हाल में मेरे साथ रहे हो, इसीलिए ये लिखना इतना मुश्किल है।`, `सबसे अच्छे दोस्त होने के नाते तुमसे सच छुपाना ग़लत लगता है।`],
  },
  partner: {
    en: [`We say "love you" all the time, but I don't think I've ever told you properly what you mean to me.`, `Some things deserve more than a quick text between meetings, so here it is.`],
    hi: [`Hum roz "love you" bolte hain, par maine kabhi theek se nahi bataya ki tu mere liye kya hai.`, `Kuch baatein jaldi-jaldi wale text se zyada deserve karti hain, toh suno.`],
    dev: [`हम रोज़ "आई लव यू" कहते हैं, पर मैंने कभी ठीक से नहीं बताया कि तुम मेरे लिए क्या हो।`, `कुछ बातें जल्दबाज़ी वाले मैसेज से ज़्यादा की हक़दार होती हैं, तो सुनो।`],
  },
  special: {
    en: [`I don't really have a label for what you are to me yet, and maybe that's the point.`, `Someone has been on my mind a lot lately, and spoiler: it's you.`],
    hi: [`Tu mere liye kya hai, iska koi label nahi hai abhi, aur shayad wahi baat hai.`, `Aajkal koi mere dimaag se ja hi nahi raha, aur spoiler: wo tu hai.`],
    dev: [`तुम मेरे लिए क्या हो, इसका अभी कोई नाम नहीं है, और शायद यही बात है।`, `आजकल कोई मेरे ख़्यालों से जाता ही नहीं, और वो तुम हो।`],
  },
};

export const CONFESSION_CORES: Record<ToneKey, ByLang> = {
  cute: {
    en: [`Every time your name pops up on my screen I do this ridiculous little smile, and I've stopped pretending it's about anything else. I like you. A lot ❤️`, `You're my favourite notification, my favourite distraction and honestly my favourite person to annoy. I really, really like you 🥺`],
    hi: [`Jab bhi tera naam screen pe aata hai na, ek silly si smile aa jati hai, aur ab main pretend nahi kar sakta/sakti. I like you, bohot zyada ❤️`, `Tu meri favourite notification hai, favourite distraction bhi. Seedhi baat — mujhe tu bohot pasand hai 🥺`],
    dev: [`जब भी स्क्रीन पर तुम्हारा नाम आता है, एक प्यारी-सी मुस्कान आ जाती है। अब छुपा नहीं सकता — तुम मुझे बहुत पसंद हो ❤️`, `तुम मेरी सबसे प्यारी आदत बन गए हो। सीधी बात — मुझे तुम बहुत अच्छे लगते हो 🥺`],
  },
  romantic: {
    en: [`Somewhere between our late-night talks and the way you laugh at your own jokes, I fell for you. Completely.`, `Being around you feels like coming home to a place I didn't know I was looking for. I'm falling for you.`],
    hi: [`Late-night baaton aur teri hasi ke beech kahin, main tujhpe fall kar gaya/gayi. Poori tarah.`, `Tere saath hona aisa lagta hai jaise ghar aa gaya/gayi hu. I think I'm falling for you ❤️`],
    dev: [`देर रात की बातों और तुम्हारी हँसी के बीच कहीं, मुझे तुमसे प्यार हो गया।`, `तुम्हारे साथ होना ऐसा लगता है जैसे घर लौट आया हूँ। मुझे तुमसे मोहब्बत है ❤️`],
  },
  funny: {
    en: [`I ran a very scientific study (I stared at the ceiling for three nights) and the results are in: I like you. Peer review welcome 😂`, `Breaking news: local idiot catches feelings for you. More at 11. Please respond before I move to another city 😅`],
    hi: [`Maine bohot scientific research ki (teen raat chhat ko ghoorta raha/rahi) aur result aa gaya: mujhe tu pasand hai 😂`, `Breaking news: ek bewakoof insaan ko tujhse feelings ho gayi hain. Jaldi reply kar warna main sheher chhod dunga/dungi 😅`],
    dev: [`मैंने बहुत वैज्ञानिक रिसर्च की (तीन रात छत को घूरता रहा) और नतीजा आ गया: तुम मुझे पसंद हो 😂`, `ताज़ा ख़बर: एक भोले इंसान को तुमसे प्यार हो गया है। जल्दी जवाब देना 😅`],
  },
  emotional: {
    en: [`You've been there on days I couldn't explain to anyone else, and somewhere along the way you became the person I want to share everything with.`, `I've carried this quietly for a long time because losing what we have scared me. But you deserve the truth: I have feelings for you.`],
    hi: [`Jin dino main kisi ko kuch samjha nahi pata tha, tab tu tha/thi. Aur pata hi nahi chala kab tu wo insaan ban gaya/gayi jisse sab share karna hai.`, `Bohot time se ye chhupa ke rakha kyunki jo hai usse khone ka darr tha. Par tu sach deserve karta/karti hai: mujhe tujhse feelings hain.`],
    dev: [`जिन दिनों मैं किसी को कुछ समझा नहीं पाता था, तब तुम थे। और पता ही नहीं चला कब तुम वो इंसान बन गए जिससे सब कुछ बाँटना है।`, `बहुत समय से ये छुपाकर रखा क्योंकि जो है उसे खोने का डर था। पर तुम सच के हक़दार हो: मुझे तुमसे प्यार है।`],
  },
  confident: {
    en: [`I like you, and I'd love to take you out properly. No pressure on the answer — I just didn't want to keep it to myself.`, `I'm not great at hinting, so here's the direct version: I'm into you, and I think we'd be really good together.`],
    hi: [`Mujhe tu pasand hai, aur main tujhe properly date pe le jaana chahta/chahti hu. Jawab ka koi pressure nahi, bas chhupana nahi tha.`, `Hints dena mujhe aata nahi, toh seedha bolta/bolti hu: I'm into you, aur mujhe lagta hai hum saath mein kamaal lagenge.`],
    dev: [`तुम मुझे पसंद हो, और मैं तुम्हें एक अच्छी डेट पर ले जाना चाहता हूँ। जवाब का कोई दबाव नहीं।`, `इशारे करना मुझे नहीं आता, तो सीधे कहता हूँ: तुम मुझे अच्छे लगते हो, और हम साथ में बहुत अच्छे लगेंगे।`],
  },
  shy: {
    en: [`Um. So. This is awkward to type, but I think I kind of really like you. Okay. Sent before I chicken out 🙈`, `I'm better at saying things over text than in person, which is probably obvious now — I like you. Please be gentle 🙈`],
    hi: [`Umm... ye type karna awkward hai, par I think mujhe tu sach mein pasand hai. Bas. Bhej diya darr ke maare 🙈`, `Face-to-face toh bol hi nahi paata/paati, isliye text pe: tu mujhe acha lagta/lagti hai. Please hasna mat 🙈`],
    dev: [`अम्म... ये लिखना थोड़ा अजीब है, पर शायद तुम मुझे सच में पसंद हो। बस। डर के मारे भेज दिया 🙈`, `सामने तो कह ही नहीं पाता, इसलिए लिख रहा हूँ: तुम मुझे अच्छे लगते हो। प्लीज़ हँसना मत 🙈`],
  },
  deep: {
    en: [`I've realised that the version of me that shows up around you is the one I like most. That isn't small. I have real feelings for you.`, `Life is too unpredictable to keep real feelings tucked away in a drafts folder. I care about you deeply — more than as a friend.`],
    hi: [`Maine notice kiya ki tere saath jo main hota/hoti hu, wo mera sabse acha version hai. Ye choti baat nahi hai. Mujhe tujhse sachi feelings hain.`, `Zindagi itni unpredictable hai ki sachi feelings ko drafts mein chhupana bekaar hai. Tu mere liye dost se kahin zyada hai.`],
    dev: [`मैंने महसूस किया कि तुम्हारे साथ जो मैं होता हूँ, वही मेरा सबसे अच्छा रूप है। ये छोटी बात नहीं। मुझे तुमसे सच्चा लगाव है।`, `ज़िंदगी इतनी अनिश्चित है कि सच्चे जज़्बात छुपाकर रखना बेकार है। तुम मेरे लिए दोस्त से कहीं ज़्यादा हो।`],
  },
};

export const CONFESSION_EXTRAS: Record<RecipientKey, ByLang> = {
  crush: {
    en: [`It started with tiny things — the way you remember small details, how easy it is to talk to you — and it quietly snowballed.`],
    hi: [`Shuru mein choti cheezein thi — tu chhoti details yaad rakhta/rakhti hai, baat karna itna easy hai — aur dheere-dheere ye sab bada ho gaya.`],
    dev: [`शुरुआत छोटी चीज़ों से हुई — तुम्हारा छोटी बातें याद रखना, तुमसे बात करना कितना आसान है — और धीरे-धीरे ये बढ़ता गया।`],
  },
  bestfriend: {
    en: [`Whatever you feel, our friendship comes first. If this isn't mutual, I promise nothing changes — I'll still steal your fries.`],
    hi: [`Tu jo bhi feel kare, hamari dosti sabse pehle hai. Agar ye mutual nahi hai toh kuch nahi badlega — main phir bhi tere fries churaunga/churaungi.`],
    dev: [`तुम जो भी महसूस करो, हमारी दोस्ती सबसे पहले है। अगर ये दोनों तरफ़ से नहीं है, तो कुछ नहीं बदलेगा।`],
  },
  partner: {
    en: [`Thank you for the quiet stuff — the chai you make without asking, the way you calm me down without saying much.`],
    hi: [`Thank you un choti cheezon ke liye — bina pooche chai bana dena, bina zyada bole mujhe shaant kar dena.`],
    dev: [`उन छोटी चीज़ों के लिए शुक्रिया — बिना पूछे चाय बना देना, बिना ज़्यादा कहे मुझे शांत कर देना।`],
  },
  special: {
    en: [`I don't need an answer today. I just wanted you to know that you matter to me, more than I've let on.`],
    hi: [`Aaj hi jawab nahi chahiye. Bas itna jaan le ki tu mere liye important hai, jitna maine dikhaya usse kahin zyada.`],
    dev: [`आज ही जवाब नहीं चाहिए। बस इतना जान लो कि तुम मेरे लिए ज़रूरी हो, जितना मैंने दिखाया उससे कहीं ज़्यादा।`],
  },
};

export const CONFESSION_CLOSINGS: ByLang = {
  en: [`Take your time — whatever you feel is okay with me ❤️`, `No pressure at all. I just didn't want to keep wondering "what if".`, `Coffee soon? Either way, I'm glad I said it ✨`],
  hi: [`Apna time le — tu jo bhi feel kare, mere liye theek hai ❤️`, `Koi pressure nahi. Bas "kya hota agar" sochte rehna nahi tha.`, `Jaldi coffee pe chalein? Jo bhi ho, bol ke acha laga ✨`],
  dev: [`अपना समय लो — तुम जो भी महसूस करो, मेरे लिए ठीक है ❤️`, `कोई दबाव नहीं। बस "काश कह दिया होता" सोचते रहना नहीं था।`, `जल्दी कॉफ़ी पर चलें? जो भी हो, कहकर अच्छा लगा ✨`],
};

export const CONFESSION_PS: ByLang = {
  en: [`P.S. You can reply with just an emoji if words feel like too much.`, `P.S. I'm smiling (and slightly panicking) while sending this.`, `P.S. Whatever happens, thank you for being you.`],
  hi: [`P.S. Words zyada lage toh sirf ek emoji bhi chalega.`, `P.S. Ye bhejte hue smile bhi aa rahi hai aur thoda darr bhi 😅`, `P.S. Jo bhi ho, tu jaisa/jaisi hai waisa/waisi rehna.`],
  dev: [`पुनश्च: शब्द ज़्यादा लगें तो बस एक इमोजी भी चलेगा।`, `पुनश्च: ये भेजते हुए मुस्कान भी है और थोड़ा डर भी 😅`, `पुनश्च: जो भी हो, तुम जैसे हो वैसे ही रहना।`],
};

// ------------------------------
// Love cards
// ------------------------------

export const CARD_CONTENT: Record<string, { quotes: string[]; notes: string[] }> = {
  Anniversary: {
    quotes: [`Loving you has been the calmest adventure and the wildest peace.`, `Every year with you rewrites my idea of forever.`, `Of all the roads I could have taken, every one of them led to you.`],
    notes: [`Happy Anniversary, {name}! Every ordinary day with you feels like a chapter worth saving forever.`, `{name}, another year of choosing each other — and I'd choose you again in a heartbeat.`, `To {name}: thank you for the laughter, the patience and the thousand small kindnesses this year.`],
  },
  Birthday: {
    quotes: [`The world got a little brighter the day you arrived in it.`, `Here's to another year of you being wonderfully, unapologetically you.`, `Some people make birthdays special; you make every day feel like one.`],
    notes: [`Happy Birthday, {name}! I hope today spoils you as much as you deserve.`, `{name}, may this year bring you everything you've been quietly wishing for.`, `Cake, candles and a whole lot of love for you today, {name} 🎂`],
  },
  'Good Morning': {
    quotes: [`You are the very first gentle thought that wakes up in my heart.`, `Mornings are better when the first thought is you.`, `Rise and shine — the world needs your smile today.`],
    notes: [`Good morning, {name}! Hope your coffee is warm and your day is easy ❤️`, `Morning, {name}. Sending you a little extra energy for whatever today brings.`, `{name}, just wanted to be the first thing that makes you smile today.`],
  },
  'Good Night': {
    quotes: [`Even the stars seem softer when I think of you.`, `Sleep well — tomorrow we get to do this all over again.`, `The best part of my day is the last thought of it: you.`],
    notes: [`Good night, {name}. Rest easy, you did enough today 🌙`, `{name}, sweet dreams. I'll see you in the morning (in my thoughts, at least).`, `Sleep tight, {name}. Tomorrow is lucky to have you.`],
  },
  'I Miss You': {
    quotes: [`Distance only proves how far love can travel without losing its warmth.`, `Missing you is just my heart reminding me how lucky I am.`, `Miles apart, but you're never far from my thoughts.`],
    notes: [`Counting down the hours until I see your smile in person, {name}.`, `{name}, the city feels a little too quiet without you.`, `Miss you more than words, {name}. Soon, okay?`],
  },
  Apology: {
    quotes: [`Pride wins arguments; humility and love heal relationships.`, `I'd rather lose an argument than lose a moment with you.`, `Sorry is just the first word of a better conversation.`],
    notes: [`I'm truly sorry for my impatience earlier, {name}. You deserve my gentleness, not my frustration.`, `{name}, I was wrong, and I'd love the chance to make it right.`, `I care about you way too much to let distance grow between us, {name}. I'm sorry.`],
  },
  "Valentine's Day": {
    quotes: [`You are my favourite love story.`, `Every day is Valentine's when it's spent with you.`, `If love had a face, it would look a lot like yours.`],
    notes: [`Happy Valentine's Day, {name}! You make love feel easy.`, `{name}, thank you for being my person — today and every day ❤️`, `To my Valentine, {name}: you're my favourite plan, always.`],
  },
  'Just Because': {
    quotes: [`You make the ordinary moments feel miraculous just by being in them.`, `No reason, no occasion — just you.`, `Some days I just need to say it: I'm glad you exist.`],
    notes: [`Just a random little reminder of how deeply you are appreciated, {name} ❤️`, `{name}, no special reason for this card. You're the reason.`, `Thinking of you, {name}. That's all. That's the card.`],
  },
};

export const CARD_THEME_LINES: Record<string, string[]> = {
  'soft-rose': [`Wrapped in soft rose and all my love.`, `Softly, sweetly, always yours.`],
  'lavender-dream': [`Like a lavender dream I never want to wake up from.`, `Calm, dreamy and full of you.`],
  'golden-sunset': [`Golden like every sunset I want to watch with you.`, `Warm as golden hour, bright as your smile.`],
  'midnight-romance': [`Written under tonight's stars, just for you.`, `For the late nights and the quiet moments.`],
  'minimal-ivory': [`Simple words, sincere heart.`, `Nothing fancy — just true.`],
};

// ------------------------------
// Our Story (real memories)
// ------------------------------

export type StoryStyle = 'romantic' | 'funny' | 'cinematic';

export interface ChapterTemplate {
  titles: string[];
  subtitles: string[];
  bodies: string[];
}

export const STORY_DEFAULTS = [
  'A shared glance in a crowded room',
  'Sitting opposite each other over steaming cups',
  'Laughing till our stomachs hurt over the most ridiculous mishap',
  'Our favourite quiet corner',
  'Your kindness, your heart, and the warmth you bring into my ordinary days',
];

export const STORY_CHAPTERS: Record<StoryStyle, ChapterTemplate[]> = {
  romantic: [
    { titles: ['The Accidental Beginning', 'Where It All Began'], subtitles: ['Where everything shifted', 'The day the world tilted'], bodies: [`Before they were {names}, there was an ordinary day that had no idea it was about to become historic. {memory}. In a world moving at lightning speed, something made them both slow down.`, `Some stories start with fireworks; theirs started quietly. {memory}. Neither of them knew it yet, but that moment was the first line of everything {names} would become.`] },
    { titles: ['The First Date & Unspoken Electricity', 'Two Cups, One Conversation'], subtitles: ['When pretence evaporated', 'Nerves into laughter'], bodies: [`{memory}. That was the moment nerves turned into effortless laughter, and being together stopped feeling like performing — it felt like exhaling.`, `{memory}. Hours slipped by unnoticed, and somewhere between sentences they both realised they didn't want the evening to end.`] },
    { titles: ['The Chaos & The Comedy', 'Laughing Through It'], subtitles: ['Our favourite ridiculous memory', 'Love, but make it messy'], bodies: [`Real love isn't just sunsets; it's forged in absurd moments. {memory}. If you can laugh until you cry in the middle of a mess, you can weather anything.`, `{memory}. It wasn't perfect, and that was exactly what made it theirs.`] },
    { titles: ['Our Sacred Corner of the World', 'The Place That Knows Us'], subtitles: ['Where time stands still', 'Home in a place'], bodies: [`{memory}. Every couple has an invisible landmark where memories cling to the air, and this one belongs to {names}.`, `Whenever they return to it — {memory} — they're reminded that home isn't four walls; it's the person beside you.`] },
    { titles: ['The Tapestry of Now & Tomorrow', 'Why I Choose You'], subtitles: ['Every single day', 'Today, tomorrow, always'], bodies: [`{memory}. Love isn't a milestone you tick off; it's a choice renewed every morning — and choosing each other remains the easiest decision {names} make.`, `If there's one thing to write in the margins of this story, it's this: {memory}. And the best chapters haven't been written yet.`] },
  ],
  funny: [
    { titles: ['Plot Twist: We Met', 'Nobody Saw This Coming'], subtitles: ['Absolutely zero planning involved', 'The universe has jokes'], bodies: [`Experts agree the meeting of {names} was statistically unlikely and mildly chaotic. {memory}. Somewhere, a romcom writer felt a disturbance in the force.`, `{memory}. If you'd told either of them that day where this was going, they'd have laughed — then probably tripped over something.`] },
    { titles: ['The First Date (Survived)', 'Small Talk, Big Snacks'], subtitles: ['Nobody spilled anything. Almost.', 'Awkward, then awesome'], bodies: [`{memory}. Approximately four minutes of awkwardness, followed by three hours of not checking their phones. A personal record for both.`, `{memory}. Reviews from both parties: "would do again", "ten out of ten, the fries were great".`] },
    { titles: ['The Legendary Incident', 'We Do Not Speak Of This (We Do)'], subtitles: ['Still laughing, honestly', 'Peak comedy'], bodies: [`{memory}. To this day, one of them can't tell this story without wheezing, and the other pretends to be embarrassed.`, `{memory}. Historians will study this moment. Mostly to figure out how two adults managed it.`] },
    { titles: ['Our Spot (Do Not Steal)', 'Reserved for {names}'], subtitles: ['Unofficially ours', 'The staff know our order'], bodies: [`{memory}. They have unofficially claimed it, and anyone else sitting there gets a polite but intense stare.`, `{memory}. It's not on any map, but it's the most important location in their shared universe.`] },
    { titles: ['Why I Keep You Around', 'Terms & Conditions of Loving You'], subtitles: ['Besides the snacks', 'Non-negotiable'], bodies: [`{memory}. Also you laugh at my worst jokes, which is honestly the bar, and you cleared it.`, `{memory}. Contract renewed indefinitely. No refunds, no returns, lots of hugs.`] },
  ],
  cinematic: [
    { titles: ['Scene One: Fade In', 'Cold Open'], subtitles: ['EXT. An ordinary day — continuous', 'The camera finds them'], bodies: [`FADE IN. The city hums. Two strangers, one moment. {memory}. A beat. The music swells, quietly, for {names}.`, `Wide shot: the world in motion. Close-up: {names}. {memory}. Somewhere off-screen, a story begins to breathe.`] },
    { titles: ['Scene Two: The First Date', 'Montage: Getting to Know You'], subtitles: ['INT. Warm light — evening', 'Slow motion, soft focus'], bodies: [`{memory}. Cut to laughter. Cut to hands almost touching. The score rises — and neither of them notices the time.`, `MONTAGE: shared stories, stolen glances, a waiter refilling glasses twice. {memory}. Hold on their smiles.`] },
    { titles: ['Scene Three: Comic Relief', 'The Blooper Reel'], subtitles: ['Every great film needs one', 'Unscripted and perfect'], bodies: [`{memory}. The director yells cut, but nobody can stop laughing. They keep it in the final edit.`, `Handheld camera, chaotic energy. {memory}. Freeze frame on two people who have stopped caring how they look.`] },
    { titles: ['Scene Four: The Location', 'Establishing Shot'], subtitles: ['The set they keep returning to', 'Golden hour'], bodies: [`Aerial shot, golden light. {memory}. Every return visit is a callback the audience is waiting for.`, `{memory}. The camera lingers here longer than anywhere else in the film, because this is where {names} feel most themselves.`] },
    { titles: ['Final Scene: To Be Continued', 'Closing Credits (Not Yet)'], subtitles: ['The sequel is already in production', 'Roll credits... almost'], bodies: [`{memory}. The music softens. The frame widens. Text on screen: "And this is only the beginning."`, `Voice-over: {memory}. Fade to warm white. The credits roll, but {names} are still talking.`] },
  ],
};

// ------------------------------
// AI Love Story episodes
// ------------------------------

export interface EpisodeArc {
  titles: string[];
  bodies: string[];
}

export const EPISODE_ARCS: EpisodeArc[] = [
  { titles: ['The Meet-Cute', 'A Moment Nobody Planned', 'First Glance'], bodies: [`In {setting}, {p} wasn't looking for anything special — until {met}. {q} laughed, {p} laughed back, and the evening quietly tilted on its axis.`, `It happened in {setting}: {met}. Neither {p} nor {q} could explain why that small moment felt like the start of something.`] },
  { titles: ['The Spark', 'Texts at 2 AM', 'Getting Closer'], bodies: [`After {met}, {p} and {q} couldn't stop talking. Late-night messages turned into inside jokes, and {setting} started to feel like their own secret map.`, `The days after {met} were full of small firsts: first voice note, first shared song, first "are you awake?". {setting} had never felt so alive.`] },
  { titles: ['Weathering The Storm', 'The First Misunderstanding', 'Rain and Repair'], bodies: [`Not every chapter is easy. In {setting}, a small misunderstanding grew louder than it should have. But {p} and {q} learned that love isn't avoiding storms — it's choosing each other with patience inside them.`, `A missed call, a sharp word, a long silence. Then {p} remembered {met}, picked up the phone, and said the hardest easy thing: "I'm sorry. Can we talk?"`] },
  { titles: ['The Grand Gesture', 'A Surprise in {setting}', 'Showing Up'], bodies: [`{q} had no idea what {p} had planned — a quiet recreation of {met}, right there in {setting}. Some gestures don't need to be big; they just need to be remembered.`, `{p} showed up with nothing fancy, just a handwritten note about {met}. {q} read it twice and didn't say anything for a while. Then: "You remembered all of this?"`] },
  { titles: ['Meeting The World', 'Friends, Family & Us', 'Making It Real'], bodies: [`Introducing {q} to the people who mattered made it real for {p}. Somewhere between awkward hellos and shared dinners in {setting}, they stopped being "you and me" and became "us".`, `Group photos, teasing friends, a parent asking one question too many. {p} and {q} survived it all and laughed about it walking home through {setting}.`] },
  { titles: ['Choosing Forever', 'The Quiet Promise', 'Every Day After'], bodies: [`Looking back at {met}, {p} realised the best love stories aren't loud. They're made of ordinary days in {setting}, and {q} choosing to stay in every single one.`, `No fireworks, no crowd — just {p} and {q} in {setting}, promising to keep choosing each other. The story keeps going.`] },
];
