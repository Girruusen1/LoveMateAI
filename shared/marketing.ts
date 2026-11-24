/**
 * Marketing emails (one-off campaigns the team sends from the admin page), separate from the
 * notification emails in notifications.ts. Pure functions: everything here runs on the server and
 * can be previewed in the browser.
 *
 * Every claim in these templates matches the real product: Free plan with daily allowances,
 * Plus ₹149/month (₹999/year) for one person, Couple ₹249/month (₹1,799/year) for two, and
 * 7 days of Plus free for every new account, no card needed.
 */

import { SOCIAL } from './links.ts';

export type MarketingLanguage = 'hinglish' | 'english';

export interface MarketingTemplate {
  id: string;
  name: string;
  language: MarketingLanguage;
  /** Who it is written for. "new": people who have not signed up yet. "users": existing accounts. */
  audience: 'new' | 'users';
  subject: string;
  description: string;
}

export interface MarketingRenderOptions {
  appUrl: string;
  unsubscribeUrl: string;
  /** First name, when known. Cold emails usually have none. */
  name?: string;
}

export interface RenderedMarketingEmail {
  subject: string;
  html: string;
  text: string;
}

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    id: 'launch_hinglish',
    name: 'Dil ki baat (launch)',
    language: 'hinglish',
    audience: 'new',
    subject: "Uske 'hmm' ka asli matlab kya tha? 💗",
    description: 'Introduces LoveMate with three moments everyone recognises, then the four main tools.',
  },
  {
    id: 'launch_english',
    name: 'Say the part (launch)',
    language: 'english',
    audience: 'new',
    subject: "Say the part you haven't found the words for yet 💗",
    description: 'English version of the launch email: decode, reply, plan dates, kundli.',
  },
  {
    id: 'busy_life',
    name: 'Life thodi busy ho gayi?',
    language: 'hinglish',
    audience: 'new',
    subject: 'Life thodi busy ho gayi hai na? 🥺',
    description: 'For couples who have lost their daily talk. Leads with the daily sealed question.',
  },
  {
    id: 'weekend_dates',
    name: 'Weekend date ideas',
    language: 'hinglish',
    audience: 'new',
    subject: 'Wahi Netflix & scroll se bore ho gaye? 🍷✨',
    description: 'Three simple date ideas for this weekend, then the Date & Gift Planner.',
  },
  {
    id: 'couple_quiz',
    name: 'Couple quiz',
    language: 'hinglish',
    audience: 'new',
    subject: 'Kya aap unhe sach mein 100% samajhte ho? 🤫',
    description: 'Three questions most partners cannot answer, then Couple mode games.',
  },
  {
    id: 'plans',
    name: 'Plus & Couple plans',
    language: 'hinglish',
    audience: 'new',
    subject: 'Apne rishte ke liye ek chhota sa upgrade 💗',
    description: 'What Free includes, what Plus and Couple add, and the 7-day free trial. Real prices.',
  },
];

export const marketingTemplate = (id: string) => MARKETING_TEMPLATES.find((t) => t.id === id) ?? null;

// ------------------------------------------------------------------ building blocks

const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
const SERIF = "font-family:Georgia,'Times New Roman',serif;";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tile = (emoji: string, title: string, text: string) => `
  <td width="50%" valign="top" style="padding:6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7f8;border:1px solid #ffe0e7;border-radius:16px;">
      <tr><td style="padding:16px 16px 14px;">
        <div style="font-size:26px;line-height:1;">${emoji}</div>
        <div style="margin-top:10px;font-size:15px;font-weight:700;color:#111827;${FONT}">${title}</div>
        <div style="margin-top:4px;font-size:13px;line-height:1.55;color:#6b7280;${FONT}">${text}</div>
      </td></tr>
    </table>
  </td>`;

const quoteRow = (emoji: string, line: string) => `
  <tr><td style="padding:5px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top" style="font-size:18px;line-height:1.3;padding-right:10px;">${emoji}</td>
      <td style="font-size:15px;line-height:1.5;color:#374151;font-style:italic;${FONT}">${line}</td>
    </tr></table>
  </td></tr>`;

/** A numbered or icon list item in a soft bordered row. */
const listRow = (icon: string, title: string, text: string) => `
  <tr><td style="padding:5px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #ffe0e7;border-radius:14px;">
      <tr>
        <td valign="top" width="44" style="padding:14px 0 14px 16px;font-size:22px;line-height:1.2;">${icon}</td>
        <td style="padding:14px 16px 14px 8px;">
          <div style="font-size:15px;font-weight:700;color:#111827;${FONT}">${title}</div>
          <div style="margin-top:3px;font-size:13px;line-height:1.55;color:#6b7280;${FONT}">${text}</div>
        </td>
      </tr>
    </table>
  </td></tr>`;

const noteBox = (eyebrow: string, inner: string, tone: 'amber' | 'rose' = 'amber') => {
  const c = tone === 'amber' ? { bg: '#fffbeb', border: '#fde68a', eyebrow: '#b45309' } : { bg: '#fff1f3', border: '#fecdd3', eyebrow: '#be123c' };
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.bg};border:1px solid ${c.border};border-radius:16px;">
    <tr><td style="padding:16px 20px 14px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;color:${c.eyebrow};${FONT}">${eyebrow}</div>
      ${inner}
    </td></tr>
  </table>`;
};

const para = (text: string, extra = '') => `<p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#4b5563;${FONT}${extra}">${text}</p>`;
const quote = (text: string) => `<p style="margin:0 0 16px;font-size:17px;line-height:1.65;color:#1f2937;font-style:italic;${SERIF}">&ldquo;${text}&rdquo;</p>`;

const button = (label: string, url: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
    <td style="border-radius:999px;background:#e11d48;background-image:linear-gradient(90deg,#e11d48,#f43f5e);">
      <a href="${url}" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;${FONT}">${label} &rarr;</a>
    </td>
  </tr></table>`;

interface ShellInput {
  lang: 'hi' | 'en';
  title: string;
  preheader: string;
  /** Photo header with text on top. Without it the card opens with a pill + headline. */
  hero?: { image: string; eyebrow: string; title: string };
  /** Used when there is no hero. */
  pill?: string;
  headline?: string;
  body: string;
  cta: { label: string; url: string };
  under: string;
  ps?: string;
  privacy: string;
  footer: { open: string; plans: string; privacy: string; unsubscribe: string; why: string; disclaimer: string; made: string };
  appUrl: string;
  unsubscribeUrl: string;
}

function shell(o: ShellInput): string {
  const top = o.hero
    ? `<tr><td style="background-color:#27272a;background-image:url('${o.hero.image}');background-size:cover;background-position:center;border-radius:24px 24px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:rgba(24,24,27,0.52);border-radius:24px 24px 0 0;padding:150px 28px 24px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:#fcd34d;${FONT}">${o.hero.eyebrow}</div>
          <div style="margin-top:8px;font-size:30px;line-height:1.2;font-weight:700;color:#ffffff;${SERIF}">${o.hero.title}</div>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:28px 32px 0;"></td></tr>`
    : `<tr><td style="height:6px;background:#e11d48;background-image:linear-gradient(90deg,#e11d48,#f43f5e,#fb7185);font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td align="center" style="padding:40px 32px 8px;">
        <div style="display:inline-block;padding:6px 14px;border-radius:999px;background:#fff1f3;border:1px solid #fecdd3;font-size:12px;font-weight:700;color:#be123c;letter-spacing:0.3px;${FONT}">${o.pill ?? ''}</div>
        <h1 style="margin:18px 0 12px;font-size:30px;line-height:1.2;font-weight:800;letter-spacing:-0.5px;color:#111827;${FONT}">${o.headline ?? ''}</h1>
      </td></tr>`;

  return `<!doctype html><html lang="${o.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:#fff1f4;${FONT}color:#18181b;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff1f4;"><tr><td align="center" style="padding:32px 12px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td align="center" style="padding:0 0 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:44px;height:44px;"><img src="${o.appUrl}/brand/email-mark.png" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border:0;"></td>
      <td style="padding-left:9px;font-size:22px;font-weight:800;letter-spacing:-0.4px;color:#18181b;${FONT}">Love<span style="color:#f43f5e;">Mate</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#ffffff;border-radius:24px;border:1px solid #ffd9e1;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${top}
      <tr><td style="padding:0 32px;">${o.body}</td></tr>
      <tr><td align="center" style="padding:22px 32px 10px;">
        ${button(o.cta.label, o.cta.url)}
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b7280;${FONT}">${o.under}</p>
      </td></tr>
      ${o.ps ? `<tr><td style="padding:14px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:14px;"><tr><td style="padding:12px 16px;font-size:13px;line-height:1.6;color:#4b5563;${FONT}"><strong style="color:#111827;">P.S.</strong> ${o.ps}</td></tr></table></td></tr>` : ''}
      <tr><td style="padding:26px 0 0;"></td></tr>
      <tr><td style="background:#fff7f8;border-top:1px solid #ffe0e7;border-radius:0 0 24px 24px;padding:18px 32px;font-size:13px;line-height:1.6;color:#6b7280;${FONT}">&#128274; ${o.privacy}</td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:24px 16px 0;font-size:12px;line-height:1.7;color:#9ca3af;${FONT}">
    <p style="margin:0 0 8px;"><a href="${o.appUrl}" style="color:#be123c;">${o.footer.open}</a><span style="color:#d4d4d8;">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="${o.appUrl}/#/pro" style="color:#be123c;">${o.footer.plans}</a><span style="color:#d4d4d8;">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="${o.appUrl}/#/privacy" style="color:#be123c;">${o.footer.privacy}</a><span style="color:#d4d4d8;">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="${SOCIAL.instagram}" style="color:#be123c;">Instagram</a><span style="color:#d4d4d8;">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="${o.unsubscribeUrl}" style="color:#be123c;">${o.footer.unsubscribe}</a></p>
    <p style="margin:0 0 6px;">${o.footer.why}</p>
    <p style="margin:0;">${o.footer.disclaimer}</p>
    <p style="margin:10px 0 0;color:#be123c;">${o.footer.made}</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

const FOOTER_HI = {
  open: 'LoveMate kholo',
  plans: 'Plans',
  privacy: 'Privacy',
  unsubscribe: 'Unsubscribe',
  why: 'Yeh email tumhe isliye mila kyunki tumne LoveMate ke baare mein jaanna chaha.',
  disclaimer: 'LoveMate relationship suggestions deta hai, professional counselling nahi.',
  made: 'Made with &#128151; in India',
};
const FOOTER_EN = {
  open: 'Open LoveMate',
  plans: 'Plans',
  privacy: 'Privacy',
  unsubscribe: 'Unsubscribe',
  why: "You're receiving this because you asked to hear about LoveMate.",
  disclaimer: 'LoveMate offers relationship suggestions, not professional counselling.',
  made: 'Made with &#128151; in India',
};
const PRIVACY_HI = '<strong style="color:#374151;">Bilkul private.</strong> Tumhari chats sirf tumhari hain. Hum kabhi post, share ya sell nahi karte.';
const PRIVACY_EN = '<strong style="color:#374151;">Private by default.</strong> Your chats are yours. We never post, share or sell them.';
const TEXT_FOOT_HI = (app: string, unsub: string) =>
  `\n\nFree mein shuru karo: ${app}\nHar naye account ko 7 din ka Plus milta hai, card ki zaroorat nahi. Uske baad Plus Rs 149 / mahina, Couple Rs 249 / mahina.\n\nUnsubscribe: ${unsub}`;

const hi = (name?: string) => (name ? `Hey ${esc(name)}, ` : '');

// ------------------------------------------------------------------ templates

type Builder = (o: MarketingRenderOptions) => RenderedMarketingEmail;

const link = (app: string, path: string, campaign: string) => `${app}/${path}${path.includes('?') ? '&' : '?'}utm_source=email&utm_medium=marketing&utm_campaign=${campaign}`;

const builders: Record<string, Builder> = {
  launch_hinglish: ({ appUrl, unsubscribeUrl, name }) => {
    const cta = link(appUrl, '', 'launch_hinglish');
    const body = `
      ${para(`${hi(name)}Woh text jo tum baar-baar padh rahe ho. Woh reply jo teen baar type karke delete kiya. Woh date jo plan karni hai, par samajh nahi aata kahan se shuru karein. LoveMate in sab mein tumhara saath deta hai. Bilkul private, Hinglish ya English mein.`, 'text-align:center;')}
      <div style="height:6px;"></div>
      ${noteBox(
        'YEH TUMHARE SAATH BHI HUA HAI?',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
          ${quoteRow('&#128566;', '&ldquo;Seen kar diya&hellip; par reply nahi aaya.&rdquo;')}
          ${quoteRow('&#129300;', '&ldquo;Uske &lsquo;hmm&rsquo; ka asli matlab kya tha?&rdquo;')}
          ${quoteRow('&#128148;', '&ldquo;Sorry bolna hai, par shuru kahan se karun?&rdquo;')}
        </table>
        <div style="margin-top:10px;font-size:14px;line-height:1.6;color:#4b5563;${FONT}">Har baar guess karna zaroori nahi. LoveMate se poochho, aur <strong style="color:#111827;">sahi jawab</strong> ke saath aage badho.</div>`
      )}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
        <tr>${tile('&#128269;', 'Message decode karo', 'Confusing text paste karo aur jaano woh actually kya kehna chahte the, aur kis mood mein.')}${tile('&#128172;', 'Sahi reply pao', 'Har situation ke liye 3 replies: sweet, playful ya seedha honest. Ek choose karo, send karo.')}</tr>
        <tr>${tile('&#127881;', 'Dates aur special days', 'Tumhare city aur budget ke hisaab se date ideas, plus birthday aur anniversary reminders.')}${tile('&#10024;', 'Kundli aur rashifal', 'Guna milan score, Manglik check aur daily rashifal, bilkul free.')}</tr>
      </table>`;
    return {
      subject: "Uske 'hmm' ka asli matlab kya tha? 💗",
      html: shell({
        lang: 'hi',
        title: 'Dil ki baat kehna chahte ho, par words nahi mil rahe?',
        preheader: 'Confusing text ka asli matlab, sahi reply aur perfect date plan. Free start, 7 din ka Plus trial saath mein.',
        pill: 'PYAAR KA AI WINGMAN',
        headline: 'Dil ki baat kehna chahte ho, par <span style="color:#e11d48;">words</span> nahi mil rahe?',
        body,
        cta: { label: 'Free mein shuru karo', url: cta },
        under: 'Shuru karna free hai. Har naye account ko <strong style="color:#111827;">7 din ka Plus</strong> milta hai, card ki zaroorat nahi.<br>Uske baad Plus &#8377;149 / mahina. Kabhi bhi cancel karo.',
        privacy: PRIVACY_HI,
        footer: FOOTER_HI,
        appUrl,
        unsubscribeUrl,
      }),
      text: `Dil ki baat kehna chahte ho, par words nahi mil rahe?\n\nLoveMate tumhara private AI wingman hai, pyaar aur relationships ke liye.\n- Confusing text decode karo aur jaano woh actually kya kehna chahte the\n- Sahi reply pao: sweet, playful ya honest\n- Dates plan karo, birthday aur anniversary kabhi miss na ho\n- Kundli matching aur daily rashifal, free${TEXT_FOOT_HI(cta, unsubscribeUrl)}`,
    };
  },

  launch_english: ({ appUrl, unsubscribeUrl, name }) => {
    const cta = link(appUrl, '', 'launch_english');
    const body = `
      ${para(`${hi(name)}That text you keep re-reading. The reply you've typed and deleted three times. The date you want to plan but don't know where to start. LoveMate helps with all of it, privately, in English or Hinglish.`, 'text-align:center;')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
        <tr>${tile('&#128269;', 'Decode a message', 'Paste a confusing text and see what they really meant, with the tone they used.')}${tile('&#128172;', 'Find the right reply', 'Three replies for any situation: warm, playful or honest. Pick one and go.')}</tr>
        <tr>${tile('&#127881;', 'Plan dates and days', 'Date ideas for your city and budget, plus reminders for birthdays and anniversaries.')}${tile('&#10024;', 'Kundli and rashifal', 'Guna milan score, Manglik check and your daily rashifal, included free.')}</tr>
      </table>`;
    return {
      subject: "Say the part you haven't found the words for yet 💗",
      html: shell({
        lang: 'en',
        title: "Say the part you haven't found the words for yet",
        preheader: 'Decode confusing texts, get the right reply and plan better dates. Free to start, 7-day Plus trial included.',
        pill: 'YOUR AI WINGMAN FOR LOVE',
        headline: 'Say the part you haven\'t found the <span style="color:#e11d48;">words</span> for yet.',
        body,
        cta: { label: 'Start free', url: cta },
        under: 'Free to start. Every new account gets <strong style="color:#111827;">7 days of Plus</strong>, no card needed.<br>Plus is &#8377;149 a month after that. Cancel anytime.',
        privacy: PRIVACY_EN,
        footer: FOOTER_EN,
        appUrl,
        unsubscribeUrl,
      }),
      text: `Say the part you haven't found the words for yet.\n\nLoveMate is your private AI wingman for love and relationships.\n- Decode a confusing text and see what they really meant\n- Find the right reply: warm, playful or honest\n- Plan dates, and never miss a birthday or anniversary\n- Kundli matching and daily rashifal, included\n\nStart free: ${cta}\nEvery new account gets 7 days of Plus, no card needed. Plus is Rs 149 a month after that.\n\nUnsubscribe: ${unsubscribeUrl}`,
    };
  },

  busy_life: ({ appUrl, unsubscribeUrl, name }) => {
    const cta = link(appUrl, '#/couple', 'busy_life');
    const body = `
      ${quote(`${hi(name)}hum samajhte hain. Office ke deadlines, traffic, WhatsApp family groups, aur roz ke chores&hellip; in sab mein sabse pehle kya compromise hota hai? Aap dono ka quality time.`)}
      ${para(`Kabhi kabhi partner se <em>baat</em> toh ho jaati hai (&ldquo;Doodh le aana&rdquo;, &ldquo;Dinner mein kya banega?&rdquo;), par wo purani <strong style="color:#111827;">dil ki baatein</strong> thodi peeche chhoot jaati hain.`)}
      ${noteBox(
        'AAJ KA SEALED QUESTION',
        `<div style="margin-top:8px;font-size:18px;line-height:1.5;color:#1f2937;font-style:italic;${SERIF}">&ldquo;Pichle 7 dino mein aisi kaunsi choti si cheez thi jo tumhare partner ne ki, aur tumhe bohot pyaar aaya?&rdquo;</div>
         <div style="margin-top:10px;font-size:13px;line-height:1.6;color:#4b5563;${FONT}">&#128274; Dono alag-alag jawab likhte ho. Kisi ka jawab tab tak nahi dikhta jab tak dono ne apna seal na kar diya ho.</div>`,
        'rose'
      )}
      ${para('LoveMate par roz ek naya sawaal aata hai. 45 second lagte hain, aur din ki sabse achhi baat wahi ban jaati hai.', 'margin-top:14px;')}`;
    return {
      subject: 'Life thodi busy ho gayi hai na? 🥺',
      html: shell({
        lang: 'hi',
        title: 'Life thodi busy ho gayi hai na?',
        preheader: 'Roz ek sealed question, 45 second, aur wo purani dil ki baatein wapas. Free mein shuru karo.',
        hero: { image: `${appUrl}/images/couple_cozy_talk.jpg`, eyebrow: 'QUICK HEART-TO-HEART', title: 'Life thodi busy ho gayi hai na? &#129402;' },
        body,
        cta: { label: 'Aaj ka sawaal kholo &#128140;', url: cta },
        under: 'Free mein shuru karo. Har naye account ko <strong style="color:#111827;">7 din ka Plus</strong> milta hai, card ki zaroorat nahi.',
        ps: 'Partner abhi LoveMate par nahi hai? Koi baat nahi. App ke andar se ek tap mein invite link bhej sakte ho, aur tab tak sawaal tumhari private memories mein save rehte hain.',
        privacy: PRIVACY_HI,
        footer: FOOTER_HI,
        appUrl,
        unsubscribeUrl,
      }),
      text: `Life thodi busy ho gayi hai na?\n\nOffice, traffic, family groups, chores... sabse pehle compromise hota hai aap dono ka quality time.\n\nLoveMate par roz ek sealed question aata hai: dono alag-alag jawab likhte ho, aur jawab tab tak nahi dikhta jab tak dono ne seal na kar diya ho. 45 second, aur din ki sabse achhi baat wahi ban jaati hai.\n\nAaj ka sawaal kholo: ${cta}${TEXT_FOOT_HI(appUrl, unsubscribeUrl)}`,
    };
  },

  weekend_dates: ({ appUrl, unsubscribeUrl, name }) => {
    const cta = link(appUrl, '#/plan-date', 'weekend_dates');
    const body = `
      ${quote(`${hi(name)}Friday night aate hi wahi purana sawaal: &lsquo;Aaj kya karein?&rsquo; aur &lsquo;Tu bol, nahi tu bol!&rsquo; Aur end result? Wahi 40 minute Zomato pe scroll aur sofa pe so jaana.`)}
      ${para('Iss weekend thoda effort aur thoda romance wapas laate hain. Shuru karne ke liye <strong style="color:#111827;">3 simple ideas</strong>, bina kharche ke:')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${listRow('&#127861;', '1. Balcony candlelight chai & 90s songs', 'Phone side mein rakho, lights dim karo, aur un kisson ki baat karo jo kabhi pure nahi hue.')}
        ${listRow('&#128663;', '2. Midnight drive & secret ice-cream run', 'Bina kisi destination ke nikal jao, window neeche, aur ek dusre ke college ke kisse suno.')}
        ${listRow('&#127829;', '3. Blindfold snack challenge', 'Aankhein band karke ek dusre ko favourite snacks guess karwao. Laughs guaranteed.')}
      </table>
      ${para('Aur agar in teeno ka mood nahi hai? LoveMate ka <strong style="color:#111827;">Date &amp; Gift Planner</strong> tumhare city, budget aur mood ke hisaab se ideas banata hai. Weekday evening ho ya anniversary, plan 1 minute mein ready.', 'margin-top:14px;')}`;
    return {
      subject: 'Wahi Netflix & scroll se bore ho gaye? 🍷✨',
      html: shell({
        lang: 'hi',
        title: 'Wahi Netflix & scroll se bore ho gaye?',
        preheader: '3 simple date ideas iss weekend ke liye, aur ek planner jo tumhare city aur budget ke hisaab se ideas banata hai.',
        hero: { image: `${appUrl}/images/couple_date_night.jpg`, eyebrow: 'NO MORE BORING WEEKENDS', title: 'Wahi Netflix &amp; scroll se bore ho gaye? &#127863;&#10024;' },
        body,
        cta: { label: 'Apne city ke liye date ideas pao &#129346;', url: cta },
        under: 'Date &amp; Gift Planner tumhare <strong style="color:#111827;">7 din ke free Plus trial</strong> mein shaamil hai. Card ki zaroorat nahi.',
        ps: 'Partner ko yeh email forward karke likhna: &ldquo;Iss weekend ka plan ready hai, no excuses!&rdquo; &#128133;',
        privacy: PRIVACY_HI,
        footer: FOOTER_HI,
        appUrl,
        unsubscribeUrl,
      }),
      text: `Wahi Netflix & scroll se bore ho gaye?\n\nIss weekend ke liye 3 simple ideas:\n1. Balcony candlelight chai & 90s songs\n2. Midnight drive & secret ice-cream run\n3. Blindfold snack challenge\n\nAur agar in teeno ka mood nahi hai? LoveMate ka Date & Gift Planner tumhare city, budget aur mood ke hisaab se ideas banata hai.\n\nDate ideas pao: ${cta}${TEXT_FOOT_HI(appUrl, unsubscribeUrl)}`,
    };
  },

  couple_quiz: ({ appUrl, unsubscribeUrl, name }) => {
    const cta = link(appUrl, '#/couple', 'couple_quiz');
    const body = `
      ${quote(`${hi(name)}chahe aap 6 mahine se saath ho ya 6 saal se, har insaan thoda thoda badalta rehta hai. Kya aapko sach mein pata hai:`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #ffe0e7;border-radius:16px;">
        <tr><td style="padding:8px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${quoteRow('<span style="display:inline-block;width:24px;height:24px;border-radius:12px;background:#fff1f3;color:#e11d48;font-size:13px;font-weight:700;line-height:24px;text-align:center;font-style:normal;">?</span>', 'Unka iss hafte ka sabse bada silent stress kya tha?')}
            ${quoteRow('<span style="display:inline-block;width:24px;height:24px;border-radius:12px;background:#fff1f3;color:#e11d48;font-size:13px;font-weight:700;line-height:24px;text-align:center;font-style:normal;">?</span>', 'Aapki aisi kaunsi baat hai jo unhe bina bole sabse cute lagti hai?')}
            ${quoteRow('<span style="display:inline-block;width:24px;height:24px;border-radius:12px;background:#fff1f3;color:#e11d48;font-size:13px;font-weight:700;line-height:24px;text-align:center;font-style:normal;">?</span>', 'Unka next secret dream vacation spot kaunsa hai?')}
          </table>
        </td></tr>
      </table>
      <div style="height:14px;"></div>
      ${noteBox(
        'COUPLE MODE PAR KHELO',
        `<div style="margin-top:6px;font-size:14px;line-height:1.65;color:#4b5563;${FONT}">LoveMate ke couple games dono apne-apne phone se khelte ho: quiz, would-you-rather, aur roz ka <strong style="color:#111827;">sealed question</strong> jiska jawab tabhi khulta hai jab dono likh chuke hon. Games free plan mein shaamil hain.</div>`,
        'rose'
      )}`;
    return {
      subject: 'Kya aap unhe sach mein 100% samajhte ho? 🤫',
      html: shell({
        lang: 'hi',
        title: 'Kya aap unhe sach mein 100% samajhte ho?',
        preheader: '3 sawaal jinke jawab zyadatar partners ko nahi pata. Couple mode mein khelo, free.',
        hero: { image: `${appUrl}/images/couple_playful.jpg`, eyebrow: 'PLAYFUL PSYCHOLOGY', title: 'Kya aap unhe sach mein 100% samajhte ho? &#129323;' },
        body,
        cta: { label: 'Couple games kholo &#127922;', url: cta },
        under: 'Free mein shuru karo. Har naye account ko <strong style="color:#111827;">7 din ka Plus</strong> bhi milta hai, card ki zaroorat nahi.',
        ps: 'Warning: kuch jawab bohot funny aur bohot shocking hone wale hain. &#128514;',
        privacy: PRIVACY_HI,
        footer: FOOTER_HI,
        appUrl,
        unsubscribeUrl,
      }),
      text: `Kya aap unhe sach mein 100% samajhte ho?\n\nKya aapko pata hai:\n- Unka iss hafte ka sabse bada silent stress kya tha?\n- Aapki aisi kaunsi baat hai jo unhe bina bole sabse cute lagti hai?\n- Unka next secret dream vacation spot kaunsa hai?\n\nLoveMate ke couple games dono apne phone se khelte ho: quiz, would-you-rather, aur roz ka sealed question. Free plan mein shaamil.\n\nCouple games kholo: ${cta}${TEXT_FOOT_HI(appUrl, unsubscribeUrl)}`,
    };
  },

  plans: ({ appUrl, unsubscribeUrl, name }) => {
    const cta = link(appUrl, '', 'plans');
    const planTile = (name: string, price: string, per: string, text: string, accent: string) => `
      <td width="50%" valign="top" style="padding:6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:2px solid ${accent};border-radius:16px;">
          <tr><td style="padding:16px 16px 14px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.6px;color:${accent};${FONT}">${name}</div>
            <div style="margin-top:6px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#111827;${FONT}">${price}<span style="font-size:13px;font-weight:600;color:#6b7280;"> ${per}</span></div>
            <div style="margin-top:8px;font-size:13px;line-height:1.55;color:#4b5563;${FONT}">${text}</div>
          </td></tr>
        </table>
      </td>`;
    const body = `
      ${para(`${hi(name)}LoveMate <strong style="color:#111827;">free mein shuru hota hai</strong>: roz ke decodes, replies, confessions, couple games aur Kundli. Jab aur chahiye ho, do plans hain:`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${planTile('PLUS', '&#8377;149', '/ mahina', 'Ek insaan ke liye. Har AI tool unlimited: decode, reply, Date &amp; Gift Planner, practice, insights, voice chat.', '#e11d48')}
          ${planTile('COUPLE', '&#8377;249', '/ mahina', 'Ek payment, dono partners ko Plus. Saath mein shared calendar, wishlist, scrapbook aur challenges.', '#7c3aed')}
        </tr>
      </table>
      <div style="height:14px;"></div>
      ${noteBox(
        'PEHLE 7 DIN FREE',
        `<div style="margin-top:6px;font-size:15px;line-height:1.6;color:#1f2937;${FONT}">Har naye account ko <strong>7 din ka Plus bilkul free</strong> milta hai. Card ki zaroorat nahi, trial ke baad apne aap koi charge nahi.</div>`
      )}
      ${para('Yearly lena ho toh aur sasta: Plus &#8377;999 / saal, Couple &#8377;1,799 / saal. Kabhi bhi cancel karo, bina kisi sawaal ke.', 'margin-top:14px;font-size:14px;')}`;
    return {
      subject: 'Apne rishte ke liye ek chhota sa upgrade 💗',
      html: shell({
        lang: 'hi',
        title: 'Apne rishte ke liye ek chhota sa upgrade',
        preheader: 'Free mein shuru karo. Plus Rs 149 / mahina, Couple Rs 249 / mahina dono ke liye. Pehle 7 din Plus free, card nahi chahiye.',
        hero: { image: `${appUrl}/images/couple_hero.jpg`, eyebrow: 'PLUS &amp; COUPLE', title: 'Apne rishte ke liye ek chhota sa upgrade &#128151;' },
        body,
        cta: { label: '7 din free try karo', url: cta },
        under: 'Sign up free hai. Plus trial apne aap shuru hota hai, card ki zaroorat nahi.',
        privacy: PRIVACY_HI,
        footer: FOOTER_HI,
        appUrl,
        unsubscribeUrl,
      }),
      text: `Apne rishte ke liye ek chhota sa upgrade\n\nLoveMate free mein shuru hota hai: roz ke decodes, replies, confessions, couple games aur Kundli.\n\nPlus - Rs 149 / mahina (Rs 999 / saal): ek insaan ke liye, har AI tool unlimited.\nCouple - Rs 249 / mahina (Rs 1,799 / saal): ek payment, dono partners ko Plus, plus shared calendar, wishlist, scrapbook aur challenges.\n\nHar naye account ko 7 din ka Plus free milta hai. Card ki zaroorat nahi.\n\n7 din free try karo: ${cta}\n\nUnsubscribe: ${unsubscribeUrl}`,
    };
  },
};

export function renderMarketingEmail(id: string, options: MarketingRenderOptions): RenderedMarketingEmail | null {
  const build = builders[id];
  if (!build) return null;
  return build({ ...options, appUrl: options.appUrl.replace(/\/$/, '') });
}
