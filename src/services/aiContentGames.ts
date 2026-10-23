// Question bank for the Infinite AI Game generator, keyed by stage group and mood.
// {them} is replaced with "them" for 2 players or "the player on your left" for groups.

export type GameMood = 'funny' | 'spicy' | 'deep' | 'nostalgic';
export type StageGroup = 'early' | 'dating' | 'longterm' | 'ldr';
export type GameQuestionType = 'guess' | 'rapid' | 'choice' | 'open';

export interface GameQuestionTemplate {
  p: string;
  t: GameQuestionType;
  o?: [string, string];
}

export const toGameMood = (mood: string): GameMood => {
  const m = mood.toLowerCase();
  if (m.includes('spic') || m.includes('flirt')) return 'spicy';
  if (m.includes('deep') || m.includes('vulnerab')) return 'deep';
  if (m.includes('nostal') || m.includes('memor')) return 'nostalgic';
  return 'funny';
};

export const toStageGroup = (stage: string): StageGroup => {
  const s = stage.toLowerCase();
  if (s.includes('distance')) return 'ldr';
  if (s.includes('long term') || s.includes('married') || s.includes('committed')) return 'longterm';
  if (s.includes('talking') || s.includes('crush') || s.includes('flirt') || s.includes('first')) return 'early';
  return 'dating';
};

export const GAME_BANK: Record<StageGroup, Record<GameMood, GameQuestionTemplate[]>> = {
  early: {
    funny: [
      { p: `What's the most embarrassing song you secretly know every word of? {them} gets to request a line.`, t: 'open' },
      { p: `Guess {them}'s most-used emoji. Wrong guess = you send it to them five times.`, t: 'guess' },
      { p: `Would you rather: always reply in voice notes OR only in GIFs for a week?`, t: 'choice', o: ['Voice notes only 🎙️', 'GIFs only 🎞️'] },
      { p: `Rapid fire, five seconds each: pineapple pizza, morning person, cats or dogs, mountains or beaches.`, t: 'rapid' },
      { p: `What's the worst pickup line you've ever heard (or used)? Deliver it to {them} with full confidence.`, t: 'open' },
      { p: `Guess how many unread notifications {them} has right now. Closest guess wins.`, t: 'guess' },
    ],
    spicy: [
      { p: `What's one thing {them} did that made you think "oh wait, I might like this person"?`, t: 'open' },
      { p: `Would you rather: a slow walk with no destination OR a dimly lit dessert bar?`, t: 'choice', o: ['Slow walk 🌙', 'Dessert bar 🍫'] },
      { p: `Rapid fire: best feature on {them}, in one word. Go.`, t: 'rapid' },
      { p: `Describe your idea of a perfect first-kiss setting in three words.`, t: 'open' },
      { p: `Guess: has {them} ever scrolled your profile all the way back to the old posts?`, t: 'guess' },
      { p: `Which text from {them} has made you smile the most so far?`, t: 'open' },
    ],
    deep: [
      { p: `What's something people usually get wrong about you on first impression?`, t: 'open' },
      { p: `What does a genuinely good day look like for you, start to finish?`, t: 'open' },
      { p: `Would you rather be deeply understood by one person OR liked by everyone?`, t: 'choice', o: ['Understood by one 💛', 'Liked by everyone 🌍'] },
      { p: `What's a small thing that instantly makes you feel safe around someone?`, t: 'open' },
      { p: `Guess {them}'s love language. Then they reveal the real one.`, t: 'guess' },
      { p: `What are you quietly proud of this year that nobody really knows about?`, t: 'open' },
    ],
    nostalgic: [
      { p: `What's your favourite childhood snack that you'd still fight for?`, t: 'open' },
      { p: `Which song instantly takes you back to being 16?`, t: 'open' },
      { p: `Guess what {them} wanted to become as a kid.`, t: 'guess' },
      { p: `Would you rather relive your school trips OR your first year of college?`, t: 'choice', o: ['School trips 🚌', 'First year of college 🎓'] },
      { p: `What's the first conversation you remember having with {them}?`, t: 'open' },
      { p: `Rapid fire: first phone, first crush, first concert, first heartbreak song.`, t: 'rapid' },
    ],
  },
  dating: {
    funny: [
      { p: `If we were trapped in an escape room, who panics first and who solves the riddle? Answer at the same time.`, t: 'guess' },
      { p: `Which habit of {them}'s do you pretend to hate but secretly find adorable?`, t: 'open' },
      { p: `Would you rather: share one phone for a week OR share one wardrobe for a week?`, t: 'choice', o: ['One phone 📱', 'One wardrobe 👕'] },
      { p: `Rapid fire: who's the better driver, cook, dancer, liar, apologiser?`, t: 'rapid' },
      { p: `Do your best impression of {them} when they're hungry.`, t: 'open' },
      { p: `Guess {them}'s go-to order at your usual place. Wrong = you pay next time.`, t: 'guess' },
    ],
    spicy: [
      { p: `Which outfit of {them}'s should honestly be illegal?`, t: 'open' },
      { p: `Would you rather: a spontaneous midnight drive OR a planned candlelit dinner?`, t: 'choice', o: ['Midnight drive 🌙', 'Candlelit dinner 🕯️'] },
      { p: `Tell {them} the exact moment you knew you were attracted to them.`, t: 'open' },
      { p: `Rapid fire: favourite compliment, favourite scent on {them}, favourite way to say hello.`, t: 'rapid' },
      { p: `Guess what {them} finds most attractive about you. Then they reveal.`, t: 'guess' },
      { p: `What's a date idea you've been too shy to suggest?`, t: 'open' },
    ],
    deep: [
      { p: `Finish honestly: "One thing I wish we did together more often is..."`, t: 'open' },
      { p: `When do you feel most loved by {them}? Be specific.`, t: 'open' },
      { p: `What's something you've been scared to bring up but want to?`, t: 'open' },
      { p: `When we disagree, do you need space first OR to talk it out right away?`, t: 'choice', o: ['Space first 🌿', 'Talk it out 🗣️'] },
      { p: `Guess {them}'s biggest worry right now. Then let them gently correct you.`, t: 'guess' },
      { p: `What does commitment mean to you at this point in your life?`, t: 'open' },
    ],
    nostalgic: [
      { p: `What was your honest first impression of {them} in the first 60 seconds?`, t: 'open' },
      { p: `Which of your dates would you relive exactly as it happened?`, t: 'open' },
      { p: `Guess the date of your first proper conversation. Closest wins.`, t: 'guess' },
      { p: `What's a tiny early moment {them} probably doesn't remember but you do?`, t: 'open' },
      { p: `Best memory so far: the first date OR the first trip together?`, t: 'choice', o: ['First date ☕', 'First trip 🚗'] },
      { p: `Rapid fire: first gift, first fight, first inside joke, first selfie together.`, t: 'rapid' },
    ],
  },
  longterm: {
    funny: [
      { p: `Which of {them}'s "I'll do it tomorrow" tasks has been pending the longest?`, t: 'open' },
      { p: `Guess what {them} would grab first in a fire drill (people and pets already safe).`, t: 'guess' },
      { p: `Would you rather never argue about the AC temperature again OR never argue about what to eat again?`, t: 'choice', o: ['AC peace ❄️', 'Food peace 🍕'] },
      { p: `Rapid fire: who snores louder, steals the blanket, forgets birthdays, cries at ads?`, t: 'rapid' },
      { p: `Re-enact your most ridiculous argument ever, but swap roles.`, t: 'open' },
      { p: `What's an inside joke of yours that would make zero sense to anyone else?`, t: 'open' },
    ],
    spicy: [
      { p: `What's something new you'd like to try together this year?`, t: 'open' },
      { p: `When did {them} look most attractive to you recently, and why?`, t: 'open' },
      { p: `Would you rather: a surprise weekend getaway OR a phone-free night at home?`, t: 'choice', o: ['Surprise getaway 🧳', 'Phone-free night 🕯️'] },
      { p: `Rapid fire: favourite thing {them} wears, favourite way to be woken up, favourite slow song.`, t: 'rapid' },
      { p: `Guess the compliment {them} secretly wants to hear more often.`, t: 'guess' },
      { p: `Describe your ideal anniversary night in one sentence, no holding back.`, t: 'open' },
    ],
    deep: [
      { p: `How has {them} changed you for the better since you got together?`, t: 'open' },
      { p: `What's one need of yours that you feel has been overlooked lately?`, t: 'open' },
      { p: `What does life look like in five years, in your happiest version?`, t: 'open' },
      { p: `What matters more right now: more adventure OR more stability?`, t: 'choice', o: ['More adventure 🧭', 'More stability 🏡'] },
      { p: `Guess what {them} has been stressed about this month. Then listen without fixing.`, t: 'guess' },
      { p: `Which tradition do you want to keep forever?`, t: 'open' },
    ],
    nostalgic: [
      { p: `What's a memory from your first year together that still makes you smile?`, t: 'open' },
      { p: `Which version of you two would you visit for a day: year one, or the hardest year you got through?`, t: 'open' },
      { p: `Guess the song {them} associates most with the two of you.`, t: 'guess' },
      { p: `What was the moment you realised this was long term?`, t: 'open' },
      { p: `Best era: the nervous early days OR the comfortable now?`, t: 'choice', o: ['Nervous early days 🦋', 'Comfortable now 🛋️'] },
      { p: `Rapid fire: best trip, best meal, best gift, best surprise, best night in.`, t: 'rapid' },
    ],
  },
  ldr: {
    funny: [
      { p: `What's the funniest thing that's gone wrong on one of your video calls?`, t: 'open' },
      { p: `Guess what {them} is wearing right now. Camera reveal after.`, t: 'guess' },
      { p: `Would you rather: a 12-hour flight to meet tomorrow OR a 3-day train ride with unlimited snacks?`, t: 'choice', o: ['12-hour flight ✈️', '3-day train 🚆'] },
      { p: `Rapid fire: worst timezone moment, longest call, most dramatic goodbye, best delivery surprise.`, t: 'rapid' },
      { p: `Show the weirdest thing within arm's reach and invent a romantic backstory for it.`, t: 'open' },
      { p: `Guess what {them} had for dinner. Loser sends the winner a snack delivery.`, t: 'guess' },
    ],
    spicy: [
      { p: `What's the first thing you want to do when you're finally in the same city?`, t: 'open' },
      { p: `Which text from {them} have you reread the most?`, t: 'open' },
      { p: `Next reunion: airport movie-scene hug OR surprise knock on the door?`, t: 'choice', o: ['Airport hug ✈️', 'Surprise knock 🚪'] },
      { p: `Rapid fire: favourite photo of {them}, favourite voice note, favourite way they say goodnight.`, t: 'rapid' },
      { p: `Guess which outfit {them} wants you to wear on your next date.`, t: 'guess' },
      { p: `Describe the perfect reunion day, hour by hour.`, t: 'open' },
    ],
    deep: [
      { p: `What's the hardest part of distance that you don't always say out loud?`, t: 'open' },
      { p: `What makes you feel close to {them} even when you're far apart?`, t: 'open' },
      { p: `On hard days, do you need a call OR a long message?`, t: 'choice', o: ['A call 📞', 'A long message 💌'] },
      { p: `What's one thing you could do weekly to feel more connected?`, t: 'open' },
      { p: `Guess what {them} misses most about being together in person.`, t: 'guess' },
      { p: `When the distance ends, what's one thing you're scared might change?`, t: 'open' },
    ],
    nostalgic: [
      { p: `What do you remember about the last time you said goodbye in person?`, t: 'open' },
      { p: `What was your best visit so far, and why?`, t: 'open' },
      { p: `Guess the exact date of your next meeting. Closest one plans the first meal.`, t: 'guess' },
      { p: `Which place in your city would you show {them} first?`, t: 'open' },
      { p: `Most special memory: the first visit OR the longest call you ever had?`, t: 'choice', o: ['First visit 🧳', 'Longest call 📞'] },
      { p: `Rapid fire: first video call, first parcel, first "I miss you", first countdown.`, t: 'rapid' },
    ],
  },
};

/** Extra prompts that work for any stage, used for padding and for groups of 3+. */
export const GAME_GROUP_EXTRAS: Record<GameMood, GameQuestionTemplate[]> = {
  funny: [
    { p: `Everyone points at once: who here would survive longest in a zombie movie?`, t: 'guess' },
    { p: `Two truths and a lie — go around the circle, everyone guesses the lie.`, t: 'guess' },
    { p: `Rapid fire round: everyone names a celebrity they'd swap lives with for a day.`, t: 'rapid' },
    { p: `Would you rather lose your phone for a week OR your sense of taste for a week?`, t: 'choice', o: ['Lose phone 📵', 'Lose taste 🍽️'] },
  ],
  spicy: [
    { p: `Everyone shares the best compliment they've ever received.`, t: 'open' },
    { p: `Point at the person most likely to send a risky text tonight.`, t: 'guess' },
    { p: `Would you rather go on a blind date OR let your friends pick your date?`, t: 'choice', o: ['Blind date 🙈', 'Friends pick 👯'] },
    { p: `Rapid fire: celebrity crush, worst date story, best flirting move.`, t: 'rapid' },
  ],
  deep: [
    { p: `What's one thing you wish people asked you about more often?`, t: 'open' },
    { p: `Go around: name one person who changed your life and why.`, t: 'open' },
    { p: `Would you rather know the future OR be able to change one thing in the past?`, t: 'choice', o: ['Know the future 🔮', 'Change the past ⏪'] },
    { p: `Guess {them}'s happiest memory from this year.`, t: 'guess' },
  ],
  nostalgic: [
    { p: `Everyone shares the most iconic cartoon from their childhood.`, t: 'open' },
    { p: `Guess {them}'s first ever screen name or username.`, t: 'guess' },
    { p: `Rapid fire: best year of school, worst haircut, favourite old show.`, t: 'rapid' },
    { p: `Would you rather go back to age 10 for a day OR fast-forward to age 60 for a day?`, t: 'choice', o: ['Back to 10 🧒', 'Forward to 60 👵'] },
  ],
};

export const GAME_TYPES: Record<GameMood, { duo: string[]; group: string[] }> = {
  funny: { duo: ['Rapid Fire Roasts', 'Giggle Gauntlet', 'Couple Comedy Hour'], group: ['Party Roast Circle', 'Group Giggle Gauntlet'] },
  spicy: { duo: ['Secret Truths', 'Spark Sprint', 'Flirt or Forfeit'], group: ['Spicy Truth Circle', 'Hot Seat'] },
  deep: { duo: ['Guess My Mind', 'Heart-to-Heart Ladder', 'Vulnerability Deck'], group: ['Deep Talk Circle', 'Story Swap'] },
  nostalgic: { duo: ['Memory Lane Quiz', 'Throwback Trivia', 'Rewind Together'], group: ['Throwback Circle', 'Nostalgia Showdown'] },
};

export const GAME_TITLE_ADJ: Record<GameMood, string[]> = {
  funny: ['Chaotic', 'Giggly', 'Ridiculous'],
  spicy: ['Flirty', 'Sizzling', 'Daring'],
  deep: ['Honest', 'Heartfelt', 'Soulful'],
  nostalgic: ['Throwback', 'Memory Lane', 'Rewind'],
};
