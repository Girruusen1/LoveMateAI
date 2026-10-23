// Content banks for planning generators: gifts, trips, surprise plans, couples coach, detective.

export type BudgetTier = 'low' | 'mid' | 'high' | 'lux';

/** Parse a free-text budget like "Under ₹1,000", "₹1,500 – ₹3,000", "₹6,000+" into a tier. */
export const toBudgetTier = (budget: string): BudgetTier => {
  const b = budget.toLowerCase();
  if (b.includes('luxury') || b.includes('lux')) return 'lux';
  const nums = (budget.match(/\d[\d,]*/g) ?? []).map((n) => parseInt(n.replace(/,/g, ''), 10)).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return b.includes('low') || b.includes('cheap') ? 'low' : 'mid';
  const top = b.includes('+') ? nums[nums.length - 1] * 1.5 : nums[nums.length - 1];
  if (b.includes('under') && top <= 1500) return 'low';
  if (top <= 1200) return 'low';
  if (top <= 3500) return 'mid';
  if (top <= 7000) return 'high';
  return 'lux';
};

// ------------------------------
// Gifts
// ------------------------------

export type OccasionKey = 'anniversary' | 'birthday' | 'justbecause' | 'reconciliation' | 'milestone';

export const toOccasionKey = (occasion: string): OccasionKey => {
  const o = occasion.toLowerCase();
  if (o.includes('anniv')) return 'anniversary';
  if (o.includes('birth')) return 'birthday';
  if (o.includes('fight') || o.includes('reconcil') || o.includes('sorry') || o.includes('apolog')) return 'reconciliation';
  if (o.includes('milestone') || o.includes('promotion') || o.includes('graduat')) return 'milestone';
  return 'justbecause';
};

export const OCCASION_LINES: Record<OccasionKey, string[]> = {
  anniversary: ['marks how far you have come together', 'turns your anniversary into something they can hold onto'],
  birthday: ['makes their birthday feel planned entirely around them', 'says "I pay attention to you" on their big day'],
  justbecause: ['says "I thought of you" with zero occasion needed', 'is a surprise that feels personal, not obligatory'],
  reconciliation: ['shows effort and humility without becoming a grand performance', 'opens the door to a calmer conversation after the fight'],
  milestone: ['celebrates their win with something they can keep', 'shows you are proud of how far they have come'],
};

export type StageKey = 'early' | 'dating' | 'longterm' | 'ldr';

export const toStageKey = (stage: string): StageKey => {
  const s = stage.toLowerCase();
  if (s.includes('distance')) return 'ldr';
  if (s.includes('long term') || s.includes('committed') || s.includes('married')) return 'longterm';
  if (s.includes('talking') || s.includes('early') || s.includes('crush') || s.includes('first')) return 'early';
  return 'dating';
};

export interface GiftItem {
  title: string;
  category: string;
  facet: 'sentimental' | 'practical' | 'experience';
  tags: string[];
  occasions: OccasionKey[];
  stages: StageKey[];
  price: Partial<Record<BudgetTier, string>>;
  why: string;
  where: string;
}

export const GIFT_CATALOG: GiftItem[] = [
  { title: 'Custom "Coordinates & Star Map" Print', category: 'Sentimental Keepsake', facet: 'sentimental', tags: ['memories', 'stars', 'night', 'photo', 'art'], occasions: ['anniversary', 'milestone'], stages: ['dating', 'longterm', 'ldr'], price: { low: '₹600 – ₹900 (digital print)', mid: '₹1,200 – ₹1,800 (framed)', high: '₹3,200 (premium frame + engraving)' }, why: 'Captures the exact night and place your story started', where: 'Bespoke online art studios or Amazon Handmade' },
  { title: 'Curated Coffee Tasting Flight + Handwritten Tasting Cards', category: 'Experience & Practical', facet: 'experience', tags: ['coffee', 'cafe', 'cafes', 'morning', 'tea', 'chai'], occasions: ['justbecause', 'birthday', 'anniversary'], stages: ['early', 'dating', 'longterm', 'ldr'], price: { low: '₹650 (sampler pack)', mid: '₹950 – ₹1,500', high: '₹3,500 (home brewing kit)' }, why: 'Turns their daily coffee habit into a shared tasting ritual', where: 'Specialty roasters (Blue Tokai / Third Wave)' },
  { title: 'Leather Travel Journal with a Secret Pocket Note', category: 'Romantic & Meaningful', facet: 'sentimental', tags: ['journal', 'journaling', 'writing', 'travel', 'stationery'], occasions: ['anniversary', 'birthday', 'milestone'], stages: ['dating', 'longterm', 'ldr'], price: { low: '₹800', mid: '₹1,400', high: '₹3,000 (embossed initials)' }, why: 'Pre-filled on page one with three favourite memories and blank pages for what comes next', where: 'Handcrafted stationery stores' },
  { title: '"Open When..." Letter Bundle', category: 'Handmade & Heartfelt', facet: 'sentimental', tags: ['letters', 'writing', 'notes', 'distance', 'words'], occasions: ['justbecause', 'reconciliation', 'anniversary', 'birthday'], stages: ['early', 'dating', 'longterm', 'ldr'], price: { low: '₹200 – ₹400 (DIY)', mid: '₹1,200 (with keepsake box)' }, why: 'Gives them something comforting to open on hard, happy or lonely days', where: 'DIY with a stationery shop kit' },
  { title: 'Instant Camera + Film Pack Kit', category: 'Memory Maker', facet: 'experience', tags: ['photo', 'photography', 'film', 'camera', 'polaroid'], occasions: ['birthday', 'anniversary', 'milestone'], stages: ['dating', 'longterm'], price: { mid: '₹2,500 (film packs + mini album)', high: '₹5,500 (Instax Mini + film)', lux: '₹9,000 (camera + film + printed album)' }, why: 'Lets you collect candid moments together instead of camera-roll clutter', where: 'Fujifilm stores / Amazon' },
  { title: 'Film Roll Developing + "Our Year" Photo Book', category: 'Sentimental Keepsake', facet: 'sentimental', tags: ['film', 'photography', 'photo', 'memories', 'album'], occasions: ['anniversary', 'birthday'], stages: ['dating', 'longterm', 'ldr'], price: { low: '₹900', mid: '₹1,800 (hardcover)', high: '₹3,500 (layflat premium)' }, why: 'Turns scattered photos into a story they can flip through', where: 'Local photo labs or online photo-book printers' },
  { title: 'Pottery Workshop for Two', category: 'Shared Experience', facet: 'experience', tags: ['art', 'craft', 'creative', 'pottery', 'hands', 'painting'], occasions: ['justbecause', 'anniversary', 'birthday'], stages: ['early', 'dating', 'longterm'], price: { mid: '₹2,400 for two', high: '₹4,000 (private session)' }, why: 'You both walk away with something you made together, plus a lot of laughs', where: 'Local studios via Insider / Instagram workshops' },
  { title: 'Rooftop Dinner Reservation with a Handwritten Menu Card', category: 'Experience', facet: 'experience', tags: ['food', 'dinner', 'rooftop', 'rooftops', 'cafe', 'foodie'], occasions: ['anniversary', 'birthday', 'milestone', 'reconciliation'], stages: ['early', 'dating', 'longterm'], price: { mid: '₹2,500', high: '₹4,500', lux: "₹8,000 (chef's tasting menu)" }, why: 'Gives you an evening of undivided attention in a setting they love', where: 'Zomato / EazyDiner reservations' },
  { title: 'Concert or Stand-up Comedy Tickets', category: 'Experience', facet: 'experience', tags: ['music', 'concert', 'comedy', 'standup', 'live', 'gigs'], occasions: ['birthday', 'justbecause', 'milestone'], stages: ['early', 'dating', 'longterm'], price: { mid: '₹2,000 – ₹3,000', high: '₹5,000', lux: '₹10,000 (premium seats)' }, why: 'A shared night out that gives you inside jokes for months', where: 'BookMyShow / District' },
  { title: 'Weekend Staycation Getaway', category: 'Luxury Experience', facet: 'experience', tags: ['travel', 'adventure', 'getaway', 'trips', 'beach', 'mountains'], occasions: ['anniversary', 'milestone', 'birthday'], stages: ['dating', 'longterm', 'ldr'], price: { high: '₹5,500 (one night)', lux: '₹12,000 – ₹18,000 (boutique stay)' }, why: 'Two days away from routine to just be together', where: 'MakeMyTrip / boutique stays' },
  { title: 'Couples Spa or Self-care Box', category: 'Relax & Recharge', facet: 'practical', tags: ['relax', 'selfcare', 'skincare', 'wellness', 'spa', 'tired'], occasions: ['birthday', 'reconciliation', 'justbecause'], stages: ['dating', 'longterm', 'ldr'], price: { low: '₹900 (self-care box)', mid: '₹2,800', high: '₹5,000 (couples spa)', lux: '₹9,000 (full-day spa)' }, why: 'Says "rest, I have got you" — perfect after a stressful stretch', where: 'Nykaa / local spas' },
  { title: 'Fitness Upgrade (Engraved Band or Smart Band)', category: 'Practical & Personal', facet: 'practical', tags: ['gym', 'fitness', 'running', 'tech', 'sports', 'yoga'], occasions: ['birthday', 'milestone'], stages: ['dating', 'longterm'], price: { low: '₹700 (engraved band)', mid: '₹2,500 (smart band)', high: '₹5,500 (smartwatch)' }, why: 'Supports a goal they genuinely care about', where: 'Amazon / brand stores' },
  { title: 'Annotated Book Bundle', category: 'Thoughtful & Personal', facet: 'sentimental', tags: ['books', 'reading', 'novels', 'poetry', 'kindle'], occasions: ['justbecause', 'birthday', 'reconciliation'], stages: ['early', 'dating', 'longterm', 'ldr'], price: { low: '₹500 (one annotated paperback)', mid: '₹1,800 (three-book bundle)', lux: '₹10,000 (Kindle + annotated favourites)' }, why: 'Your notes in the margins turn a book into a love letter', where: 'Local bookstores / Amazon' },
  { title: 'Plant + Handwritten Care Card', category: 'Small & Sweet', facet: 'sentimental', tags: ['plants', 'nature', 'home', 'garden', 'green'], occasions: ['justbecause', 'reconciliation'], stages: ['early', 'dating', 'longterm'], price: { low: '₹400', mid: '₹1,500 (planter set)' }, why: 'Something living that grows, just like the two of you', where: 'Ugaoo / local nurseries' },
  { title: 'Cook-Together Kit or Masterclass', category: 'Shared Experience', facet: 'experience', tags: ['cooking', 'food', 'baking', 'foodie', 'kitchen'], occasions: ['justbecause', 'anniversary', 'reconciliation'], stages: ['dating', 'longterm'], price: { low: '₹900 (ingredient kit)', mid: '₹2,200 (masterclass for two)' }, why: 'A messy, fun evening that ends with something delicious', where: 'Local cooking studios / meal-kit brands' },
  { title: 'Peace-Offering Box (favourite snacks + note + flowers)', category: 'Apology & Repair', facet: 'sentimental', tags: ['snacks', 'flowers', 'sweet', 'chocolate'], occasions: ['reconciliation', 'justbecause'], stages: ['early', 'dating', 'longterm', 'ldr'], price: { low: '₹600', mid: '₹1,500' }, why: 'Small, specific and humble — it shows you know them', where: 'Local florist + their favourite snack shop' },
  { title: 'Custom Playlist Card + Vinyl Record', category: 'Music & Memory', facet: 'sentimental', tags: ['music', 'vinyl', 'songs', 'playlist', 'records'], occasions: ['anniversary', 'birthday', 'justbecause'], stages: ['early', 'dating', 'longterm', 'ldr'], price: { low: '₹300 (playlist QR card)', mid: '₹2,500 (vinyl)', high: '₹4,500 (vinyl + mini player)' }, why: 'Every song is a memory you can replay', where: 'Record stores / Spotify + print shop' },
  { title: 'Long-Distance Touch Lamps (pair)', category: 'Connection Tech', facet: 'practical', tags: ['distance', 'ldr', 'tech', 'lamp'], occasions: ['anniversary', 'birthday', 'justbecause'], stages: ['ldr'], price: { mid: '₹2,800 (pair)', high: '₹4,800 (premium pair)' }, why: 'One touch lights up their lamp — a tiny "thinking of you" across any distance', where: 'Amazon / Etsy' },
];

export const PERSONALITY_FACETS: Record<'sentimental' | 'practical' | 'experience', string[]> = {
  sentimental: ['journal', 'letter', 'photo', 'memor', 'poetry', 'writing', 'film', 'handmade', 'emotional', 'romantic'],
  practical: ['gym', 'tech', 'work', 'organis', 'organiz', 'cook', 'fitness', 'skincare', 'minimal', 'useful'],
  experience: ['travel', 'concert', 'food', 'cafe', 'adventure', 'rooftop', 'music', 'trip', 'explore', 'comedy'],
};

// ------------------------------
// Trips
// ------------------------------

export type TripThemeKey = 'heritage' | 'beach' | 'mountains' | 'food' | 'adventure' | 'wellness' | 'romance';

export interface TripActivity {
  activity: string;
  tip: string;
}

export interface TripTheme {
  keywords: string[];
  dayThemes: string[];
  morning: TripActivity[];
  afternoon: TripActivity[];
  evening: TripActivity[];
  night: TripActivity[];
  surprises: string[];
  packing: string[];
  backup: string[];
}

export const TRIP_THEMES: Record<TripThemeKey, TripTheme> = {
  heritage: {
    keywords: ['heritage', 'history', 'palace', 'fort', 'culture', 'temple', 'museum', 'old city'],
    dayThemes: ['Palaces & Old-City Lanes', 'Stories in Stone', 'Heritage Walk & Hidden Courtyards'],
    morning: [{ activity: 'Guided heritage walk through the old quarter of {dest}', tip: 'Hire a storyteller guide — the legends make it.' }, { activity: 'Early palace or fort visit before the crowds', tip: 'Gates open early; golden light makes for great photos.' }],
    afternoon: [{ activity: 'Artisan workshop: block printing or miniature painting', tip: 'Make one small piece together to take home.' }, { activity: 'Museum hop with a long lunch in a heritage courtyard', tip: 'Ask for the regional thali.' }],
    evening: [{ activity: 'Sunset from the highest rampart or viewpoint in {dest}', tip: 'Carry a light shawl; it gets breezy.' }, { activity: 'Folk music performance in an old haveli', tip: 'Book front seats in advance.' }],
    night: [{ activity: 'Candlelit courtyard dinner', tip: 'Pre-order dessert so it arrives as a surprise.' }],
    surprises: ['Slip a handwritten note into their bag before the sunset walk.', 'Buy a tiny handmade trinket while they are not looking and gift it at dinner.'],
    packing: ['Breathable cottons for day walks', 'Comfortable walking shoes', 'A light shawl for evenings'],
    backup: ['If it rains, spend the afternoon in a heritage-hotel library with chai and board games.'],
  },
  beach: {
    keywords: ['beach', 'sea', 'ocean', 'coast', 'island', 'goa', 'surf', 'sunset'],
    dayThemes: ['Salt Air & Slow Mornings', 'Sun, Sand & Seafood', 'Island Time'],
    morning: [{ activity: 'Barefoot sunrise walk on the quietest beach in {dest}', tip: 'Go before 7 AM for an empty shoreline.' }, { activity: 'Beginner surf or paddleboard lesson for two', tip: 'Book the earliest slot for calm water.' }],
    afternoon: [{ activity: 'Beach-shack seafood lunch with your feet in the sand', tip: 'Ask what was caught that morning.' }, { activity: 'Hammock nap and books in a shaded cafe', tip: 'Swap books halfway through.' }],
    evening: [{ activity: 'Sunset cruise along the coast', tip: 'Sit at the bow for the best view.' }, { activity: 'Sunset picnic on the sand', tip: 'Bring a speaker with your shared playlist.' }],
    night: [{ activity: 'Dinner at a lantern-lit beach cafe', tip: 'Request a table closest to the water.' }, { activity: 'Night stroll and stargazing by the waves', tip: 'Download a star-map app beforehand.' }],
    surprises: ['Write a message in the sand before they wake up.', 'Arrange a small cake at the sunset cruise.'],
    packing: ['Reef-safe sunscreen', 'Quick-dry clothes', 'Flip-flops and a light cover-up'],
    backup: ['If the sea is rough, book a couples spa and a cooking class instead.'],
  },
  mountains: {
    keywords: ['mountain', 'hill', 'trek', 'snow', 'himalaya', 'manali', 'nature', 'forest', 'valley'],
    dayThemes: ['Pine Trails & Mountain Air', 'Above the Clouds', 'Valley Views & Cosy Cafes'],
    morning: [{ activity: 'Sunrise hike to a viewpoint above {dest}', tip: 'Carry a flask of hot chocolate for the top.' }, { activity: 'Forest trail walk with a local guide', tip: 'Start early to beat the afternoon clouds.' }],
    afternoon: [{ activity: 'Cafe-hopping in the old village with mountain views', tip: 'Order the local trout or Himalayan tea.' }, { activity: 'Riverside picnic', tip: 'Pack a blanket — the rocks get cold.' }],
    evening: [{ activity: 'Bonfire with music under the stars', tip: 'Ask your stay to arrange one.' }, { activity: 'Sunset at a monastery or ridge viewpoint', tip: 'Stay quiet for the last ten minutes; it is magical.' }],
    night: [{ activity: 'Cosy dinner by a fireplace', tip: 'Ask for a corner table near the fire.' }],
    surprises: ['Pack their favourite snack for the summit.', 'Leave a note in their jacket pocket for the hike.'],
    packing: ['Warm layers and a windproof jacket', 'Trekking shoes', 'Lip balm and moisturiser'],
    backup: ['If it snows or rains, stay in with board games, Maggi and a movie marathon.'],
  },
  food: {
    keywords: ['food', 'foodie', 'street food', 'cafe', 'city', 'shopping', 'markets', 'eat'],
    dayThemes: ['Street Food Safari', 'Cafes, Markets & City Lights', 'Eat Your Way Through {dest}'],
    morning: [{ activity: 'Breakfast crawl at the most famous local spots in {dest}', tip: 'Share every dish so you can try more.' }, { activity: 'Morning market walk', tip: 'Go hungry and with cash.' }],
    afternoon: [{ activity: 'Cooking class for two featuring local recipes', tip: 'Ask for the recipe card to recreate at home.' }, { activity: 'Cafe-hopping through the artsy quarter', tip: 'Rate each cafe — winner gets dessert.' }],
    evening: [{ activity: 'Street food trail with a local guide', tip: 'Start mild and work up to the spicy stuff.' }, { activity: 'Rooftop sundowner with city views', tip: 'Reserve a table for sunset.' }],
    night: [{ activity: 'Late-night dessert run', tip: 'Ask a local where they go after midnight.' }],
    surprises: ['Book a surprise tasting menu for the last night.', 'Make a tiny "food passport" and stamp every place you eat.'],
    packing: ['Comfortable sneakers', 'Antacids, just in case', 'A tote bag for market finds'],
    backup: ['If plans fall through, order a feast from the best-rated local place and picnic in your room.'],
  },
  adventure: {
    keywords: ['adventure', 'rafting', 'paragliding', 'scuba', 'thrill', 'camping', 'bike', 'road trip'],
    dayThemes: ['Adrenaline Day', 'Wild & Free', 'Road Trip Chapters'],
    morning: [{ activity: 'Paragliding or zipline near {dest}', tip: 'Go early when the winds are calmer.' }, { activity: 'White-water rafting session', tip: 'Waterproof pouch for phones is a must.' }],
    afternoon: [{ activity: 'Scenic bike or scooter ride to a hidden viewpoint', tip: 'Download offline maps.' }, { activity: 'Rock climbing or bouldering intro class', tip: 'Cheer each other on loudly.' }],
    evening: [{ activity: 'Campsite set-up and sunset', tip: 'Pick a spot facing west.' }, { activity: 'Dhaba dinner on the highway', tip: 'Try whatever the truckers are ordering.' }],
    night: [{ activity: 'Stargazing from the campsite', tip: 'Bring a blanket and a shared playlist.' }],
    surprises: ['Get your adventure photos printed and hand them over at dinner.', 'Bring a medal or "bravery award" for whoever was more scared.'],
    packing: ['Sports shoes and quick-dry clothes', 'Power bank', 'First-aid kit'],
    backup: ['If weather cancels activities, do an indoor trampoline park or go-karting.'],
  },
  wellness: {
    keywords: ['relax', 'wellness', 'spa', 'yoga', 'slow', 'calm', 'peace', 'retreat'],
    dayThemes: ['Slow Mornings & Soft Evenings', 'Reset Together', 'Breathe, Rest, Repeat'],
    morning: [{ activity: 'Sunrise yoga session for two', tip: 'Ask for a beginner-friendly instructor.' }, { activity: 'Slow breakfast in bed', tip: 'Phones away until 10 AM.' }],
    afternoon: [{ activity: 'Couples massage at the best spa in {dest}', tip: 'Book the longest session you can.' }, { activity: 'Reading and nap by the pool', tip: 'Bring a book you both want to discuss.' }],
    evening: [{ activity: 'Sound bath or meditation circle', tip: 'Wear comfortable layers.' }, { activity: 'Garden walk at golden hour', tip: 'Walk without a destination.' }],
    night: [{ activity: 'Light, healthy dinner with herbal tea', tip: 'Ask the chef for a local speciality.' }],
    surprises: ['Leave a "you deserve rest" note on their pillow.', 'Arrange a fruit platter after the spa.'],
    packing: ['Comfortable loungewear', 'Yoga mat (or ask the stay)', 'A journal'],
    backup: ['If anything is closed, a long bath, face masks and a movie in bed work just as well.'],
  },
  romance: {
    keywords: ['romantic', 'romance', 'rooftop', 'candle', 'honeymoon', 'lake', 'sunset', 'couple'],
    dayThemes: ['Arrival & Golden Hour', 'Just the Two of Us', 'Love Notes & Long Dinners'],
    morning: [{ activity: 'Late breakfast on a terrace overlooking {dest}', tip: 'Ask for the corner table.' }, { activity: 'Couple photoshoot with a local photographer', tip: 'Shoot in the first hour of light.' }],
    afternoon: [{ activity: 'Private boat ride or garden stroll', tip: 'Golden hour light is breathtaking for photos.' }, { activity: 'Browse local boutiques and pick a gift for each other', tip: 'Set a small budget to make it fun.' }],
    evening: [{ activity: 'Rooftop sunset with mocktails or cocktails', tip: 'Reserve the best sunset seats.' }, { activity: 'Live music by the water', tip: 'Request your song.' }],
    night: [{ activity: 'Candlelight dinner', tip: 'Pre-order a dessert with a message on the plate.' }],
    surprises: ['Hide a handwritten letter in their travel bag.', 'Book a surprise flower decoration in the room.'],
    packing: ['One dressy outfit for dinner', 'Light jacket for evenings', 'Polaroid camera'],
    backup: ['If it rains, book an in-room candlelit dinner and a movie.'],
  },
};

// ------------------------------
// Surprise Me
// ------------------------------

export type SurpriseMood = 'romantic' | 'playful' | 'cozy' | 'nostalgic';

export const toSurpriseMood = (mood: string): SurpriseMood => {
  const m = mood.toLowerCase();
  if (m.includes('play') || m.includes('advent') || m.includes('fun')) return 'playful';
  if (m.includes('cozy') || m.includes('cosy') || m.includes('low') || m.includes('calm')) return 'cozy';
  if (m.includes('nostal') || m.includes('throw') || m.includes('memor')) return 'nostalgic';
  return 'romantic';
};

export const SURPRISE_BANK: Record<SurpriseMood, {
  titles: { together: string[]; long_distance: string[] };
  steps: { together: string[]; long_distance: string[] };
  playlists: string[];
}> = {
  romantic: {
    titles: { together: ['Sunset Rooftop & Polaroid Mystery', 'Golden Hour Love Letter Date'], long_distance: ['Synchronized Candlelit Dinner Call', 'Stargazing Across the Miles'] },
    steps: {
      together: ['Send a mystery teaser telling them what to wear', 'Arrive with a single-stem flower and their favourite drink', 'Golden-hour viewpoint with five deep curiosity questions', 'Dinner with a handwritten note slipped under their glass', 'Slow walk home with your shared playlist'],
      long_distance: ['Send a mystery teaser: "Be online at 8, dress nicely"', 'Their favourite food arrives at their door right on time', 'Video dinner with candles on both ends', 'Read each other a letter you wrote that afternoon', 'Fall asleep on call while stargazing from your windows'],
    },
    playlists: ['Acoustic Warmth & Indie Romance (about 45 mins)', 'Old Bollywood Love Songs Remastered', 'Slow Jazz for Two'],
  },
  playful: {
    titles: { together: ['City Scavenger Hunt Date', 'Arcade, Street Food & Dares'], long_distance: ['Online Game Night Showdown', 'Two-City Scavenger Hunt'] },
    steps: {
      together: ['Send clue #1 — a riddle that leads to the first stop', 'Arcade or bowling battle; loser buys dessert', 'Street food challenge: each picks a dish for the other', 'Photo dare list around the neighbourhood', 'End at a dessert spot with a "winner" certificate'],
      long_distance: ['Send a riddle that reveals the game plan', 'Online multiplayer game or quiz battle', 'Simultaneous snack delivery with a dare inside', 'Video call cook-off with a 20-minute timer', 'Crown the champion with a virtual trophy GIF'],
    },
    playlists: ['Upbeat Throwback Bangers', 'Feel-Good Indie Pop', 'Road-Trip Singalongs'],
  },
  cozy: {
    titles: { together: ['Blanket Fort Movie Night', 'Slow Sunday Cook-Together'], long_distance: ['Cozy Watch Party Night', 'Matching Hot Chocolate Call'] },
    steps: {
      together: ['Text them: "Wear your comfiest clothes tonight"', 'Build a blanket fort with fairy lights', 'Cook a simple pasta together with music on', 'Movie marathon with homemade popcorn', 'Handwritten "reasons I love you" jar to open over the week'],
      long_distance: ['Send a cozy care package to arrive that afternoon', 'Matching hot chocolates on video call', 'Synchronised movie watch party', 'Read a short story aloud to each other', 'Goodnight voice note playlist'],
    },
    playlists: ['Lo-fi Rainy Evening', 'Soft Acoustic Covers', 'Calm Piano Nights'],
  },
  nostalgic: {
    titles: { together: ['Recreate Our First Date', 'Memory Lane Tour'], long_distance: ['Throwback Photo Night', 'Our Story Slideshow Call'] },
    steps: {
      together: ['Send a photo from your first date as the teaser', 'Revisit the place you first met', 'Order exactly what you had on your first date', 'Gift a printed mini photo album of your favourite moments', 'Write one-line memories for each other on the walk home'],
      long_distance: ['Send an old photo with "remember this?"', 'Screen-share a slideshow of your favourite memories', 'Order the same meal from your first date on both ends', 'Play "guess the date" with old screenshots', 'Plan your next "first" together before hanging up'],
    },
    playlists: ['Songs From the Year We Met', 'Early 2000s Throwbacks', 'Our Story Soundtrack'],
  },
};

export const SURPRISE_FOOD: Record<BudgetTier, { together: string[]; long_distance: string[] }> = {
  low: { together: ['Homemade Maggi upgrade and street-side chai', 'Pani puri crawl and kulfi'], long_distance: ['Matching instant-noodle night with fancy toppings', 'Chai and pakora on both ends'] },
  mid: { together: ['Woodfired pizza with dark chocolate gelato', 'Cafe brunch platter and cold coffee'], long_distance: ['Synchronised biryani delivery', 'Matching sushi or pasta delivery'] },
  high: { together: ['Rooftop tasting plates and dessert flight', 'Chef-curated dinner for two'], long_distance: ['Gourmet dinner kits on both ends', 'Premium dessert boxes delivered simultaneously'] },
  lux: { together: ["Chef's tasting menu with a private table", 'Private dining with a custom dessert'], long_distance: ['Private chef cooking on video call', 'Luxury hamper with champagne-style mocktails'] },
};

export const SURPRISE_GESTURES: Record<BudgetTier, string[]> = {
  low: ['Slip a handwritten note with a date code into their pocket.', 'Leave ten sticky notes with things you love about them around their room.'],
  mid: ['Slip a mini Polaroid with a handwritten date code into their jacket pocket.', 'Gift a small engraved keychain with your date on it.'],
  high: ['Present a framed photo of your favourite memory with a letter on the back.', 'Hand them tickets to something they mentioned wanting to see.'],
  lux: ['Reveal a weekend getaway booking in an envelope at dessert.', 'Gift a custom piece of jewellery with your initials.'],
};

// ------------------------------
// Couples Coach
// ------------------------------

export const COACH_TOPICS: Record<string, { label: string; base: string[]; prompts: string[]; steps: string[] }> = {
  communication: {
    label: 'communication',
    base: ['Both of you want to feel understood, especially over text.', 'Neither of you wants small misunderstandings to snowball.'],
    prompts: ['"When a message lands wrong, how should we flag it without starting a fight?"', '"Which topics are better for calls than texts?"', '"What tone helps you hear me best when I am upset?"', '"What is one thing I say that you wish I said differently?"'],
    steps: ['Agree on a "tone check" phrase: either of you can text "tone check?" and the other rephrases kindly — Person A needs {needA}, Person B needs {needB}.', 'Move one recurring text conversation to a weekly 15-minute call, so Person A gets {needA} and Person B gets {needB}.'],
  },
  fighting: {
    label: 'fighting or tension',
    base: ['Both of you care more about the relationship than winning.', 'Both of you feel worn down by recent tension.'],
    prompts: ['"When we feel a fight starting, how can we signal a 20-minute breather without the other feeling abandoned?"', '"What is one small gesture that reassures you during tough talks?"', '"What do you need to hear from me after an argument?"', '"Which fights keep repeating, and what is underneath them?"'],
    steps: ['Use the "Pause & Return" rule: either partner can call a 20-minute timeout and promises to return with tea and open ears. It respects that Person A needs {needA} and Person B needs {needB}.', 'After each disagreement, each of you names one thing you could have done better — Person A focuses on {needA}, Person B on {needB}.'],
  },
  disconnected: {
    label: 'feeling disconnected',
    base: ['Both of you miss the closeness you had before things got busy.', 'Both of you are tired, not uninterested.'],
    prompts: ['"When did you last feel really close to me?"', '"What is one tiny daily ritual we could add back?"', '"What drains you most during the week, and how can I help?"', '"What does quality time actually look like for you?"'],
    steps: ['Start a 10-minute phone-free check-in every night: Person A gets {needA}, Person B gets {needB}.', 'Block one sacred date night this week — Person A plans it around {needA}, Person B adds something for {needB}.'],
  },
  expectations: {
    label: 'different expectations',
    base: ['Both of you want the same relationship, just at different paces.', 'Both of you are willing to meet somewhere in the middle.'],
    prompts: ['"What does an ideal week together look like to you?"', '"Which expectation of mine feels hardest to meet?"', '"What is non-negotiable for you, and what is flexible?"', '"How do you want me to tell you when I need more?"'],
    steps: ['Each of you writes your ideal week, then circle the overlap — Person A protects {needA}, Person B protects {needB}.', 'Agree on one weekly "yes" for each person: Person A asks for {needA}, Person B asks for {needB}.'],
  },
  future: {
    label: 'future planning',
    base: ['Both of you see a future together, even if the details differ.', 'Both of you want clarity without pressure.'],
    prompts: ['"Where do you see us in two years, honestly?"', '"What scares you most about the next big step?"', '"Which decisions do we need to make this year, and which can wait?"', '"What does financial teamwork look like for us?"'],
    steps: ['Schedule a relaxed "future date" once a month to talk one topic at a time — Person A brings {needA}, Person B brings {needB}.', 'Write a shared one-page "next 12 months" list, with space for Person A\'s {needA} and Person B\'s {needB}.'],
  },
};

export const NEED_DETECTORS: { keys: string[]; need: string }[] = [
  { keys: ['space', 'alone', 'quiet', 'breather', 'cool down', 'calm down'], need: 'some quiet space before talking' },
  { keys: ['talk', 'discuss', 'listen', 'heard', 'communicat', 'ignore'], need: 'to talk it through and feel heard' },
  { keys: ['time', 'together', 'date', 'weekend', 'busy'], need: 'more intentional time together' },
  { keys: ['phone', 'text', 'reply', 'call', 'message'], need: 'more consistent texting and check-ins' },
  { keys: ['future', 'marry', 'marriage', 'move', 'career', 'plan'], need: 'clarity about where things are heading' },
  { keys: ['money', 'spend', 'budget', 'expens'], need: 'agreement on money and spending' },
  { keys: ['appreciat', 'effort', 'notice', 'thank', 'credit'], need: 'to feel their effort is noticed' },
  { keys: ['family', 'parents', 'mom', 'dad', 'in-law'], need: 'support around family expectations' },
  { keys: ['trust', 'jealous', 'ex ', 'insecure'], need: 'reassurance and trust' },
  { keys: ['tired', 'stress', 'work', 'exhaust', 'overwhelm'], need: 'patience while they are stretched thin' },
];

// ------------------------------
// Relationship Detective
// ------------------------------

export const ASSUMPTION_MARKERS = [
  'i think', 'i feel like', 'feels like', 'maybe', 'probably', 'must be', 'must have', 'i guess', 'seems', 'obviously',
  'i bet', 'definitely', 'i know they', "doesn't care", 'doesnt care', 'hates me', 'not interested', 'losing interest',
  'mad at me', 'angry at me', 'cheating', 'ignoring me', 'over me', 'lagta', 'shayad', 'pakka', 'i assume', 'might',
];

export const DETECTIVE_THEMES: { keys: string[]; happening: string[]; actions: string[] }[] = [
  { keys: ['reply', 'text', 'seen', 'message', 'dry', 'ignore'], happening: ['Text lacks tone and timing context, so slow or short replies often read colder than they are meant.', 'They may be replying in between other things and saving the "real" conversation for later.'], actions: ['Send one light, no-pressure message and then pause for 12–24 hours.', 'Avoid "Are you mad at me?" — it puts them on the defensive.'] },
  { keys: ['busy', 'work', 'exam', 'tired', 'office', 'college'], happening: ['Work or study pressure may be draining their bandwidth for conversation.', 'Busy people often go quiet without realising how it lands.'], actions: ['Acknowledge their busy week and suggest something small for when it eases up.', 'Offer support rather than asking for more attention right now.'] },
  { keys: ['ex', 'old friend', 'someone else'], happening: ['Insecurity about someone else may be colouring how you read neutral behaviour.', 'There may be history here that neither of you has talked about openly.'], actions: ['Talk about how you feel, not about what they did: "I felt unsure when..."', 'Ask for reassurance directly instead of testing them.'] },
  { keys: ['fight', 'argument', 'angry', 'upset', 'gussa'], happening: ['They may still be processing the argument and need time before reconnecting.', 'Both of you may be waiting for the other to make the first move.'], actions: ['Make the first repair attempt with one line of ownership.', 'Suggest talking in person rather than resolving it over text.'] },
  { keys: ['cancel', 'plan', 'reschedul', 'postpone'], happening: ['A cancelled plan does not always mean low interest; watch whether they suggest another time.', 'They may be overcommitted and embarrassed about it.'], actions: ['Let them propose the next plan — it shows you where their interest is.', 'Keep the next suggestion low-effort, like a short coffee.'] },
];

export const DETECTIVE_GENERIC = {
  happening: ['They might be overthinking their response rather than intentionally ignoring you.', 'Stress, mood or timing outside your relationship could be playing a bigger role than you think.', 'Both of you may want closeness but express it in different ways.'],
  unknowns: ['Their exact thoughts or emotional state right now.', 'Whether offline responsibilities occupied their day.', 'How they personally perceive the current rhythm between you.'],
  actions: ['Next time you connect, suggest a casual voice call or in-person coffee.', 'Write down what you actually know before deciding how to react.', 'Ask one open, curious question instead of drawing a conclusion.'],
  conversations: [
    '"Hey! No rush at all — just wanted to say I hope your week is going okay. Would love to catch up about {topic} when you have some time."',
    '"I noticed things felt a little different around {topic} lately. No pressure, but I would love to hear how you are doing."',
    '"Thinking of you today. Whenever you are free, want to grab a coffee and talk properly about {topic}?"',
  ],
};
