import React from 'react';
import { AlertTriangle, FileText, Mail, ReceiptIndianRupee, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS, formatAddress, hasPlaceholders } from '../../config/business';
import { Card, Chip, PageContainer, PageHeader } from '../common/UIPrimitives';

export type LegalPage = 'terms' | 'privacy' | 'refund' | 'contact';

interface Section {
  heading: string;
  body: React.ReactNode;
}

const B = BUSINESS;
const G = B.grievanceOfficer;

const PAGES: { id: LegalPage; label: string; title: string; icon: React.ReactNode; subtitle: string }[] = [
  {
    id: 'terms',
    label: 'Terms',
    title: 'Terms & Conditions',
    icon: <FileText />,
    subtitle: `The rules for using ${B.appName}. Please read them before you create an account or buy a plan.`,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    title: 'Privacy Policy',
    icon: <ShieldCheck />,
    subtitle: `What ${B.appName} collects, why, who it is shared with, and the choices you have.`,
  },
  {
    id: 'refund',
    label: 'Refunds',
    title: 'Refund & Cancellation Policy',
    icon: <ReceiptIndianRupee />,
    subtitle: 'How to cancel a plan, and when you can get your money back.',
  },
  {
    id: 'contact',
    label: 'Contact',
    title: 'Contact Us',
    icon: <Mail />,
    subtitle: `How to reach the team behind ${B.appName}.`,
  },
];

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p>{children}</p>;
const UL: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
const Strong: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="font-semibold text-zinc-900">{children}</strong>
);
const MailLink: React.FC<{ email: string }> = ({ email }) =>
  email.includes('[') ? (
    <span>{email}</span>
  ) : (
    <a href={`mailto:${email}`} className="text-rose-600 hover:text-rose-700 underline underline-offset-2">
      {email}
    </a>
  );

const contactLine = (
  <>
    {B.legalName}, {formatAddress()}. Email: <MailLink email={B.email} />. Phone: {B.phone}.
  </>
);

/* -------------------------------------------------------------------------- */
/* Terms & Conditions                                                         */
/* -------------------------------------------------------------------------- */
const TERMS: Section[] = [
  {
    heading: '1. About these terms',
    body: (
      <P>
        {B.appName} is operated by {B.legalName} ("we", "us"). By creating an account or using {B.appName} you agree to
        these Terms & Conditions, our Privacy Policy and our Refund & Cancellation Policy. If you do not agree, please do
        not use the service.
      </P>
    ),
  },
  {
    heading: '2. Who can use LoveMate',
    body: (
      <P>
        You must be at least 18 years old and able to enter into a binding contract under Indian law. By using{' '}
        {B.appName} you confirm that you meet this requirement.
      </P>
    ),
  },
  {
    heading: '3. What LoveMate is, and what it is not',
    body: (
      <>
        <P>
          {B.appName} gives AI-generated suggestions about dating, communication and relationships: reply ideas, date
          plans, message rewrites, games and similar tools. It is meant for ideas and fun.
        </P>
        <P>
          {B.appName} is <Strong>not</Strong> professional counselling, therapy, or legal, medical or financial advice. It
          does not replace a qualified professional.
        </P>
        <P>If you are in distress or danger, please reach out for help right away:</P>
        <UL
          items={[
            <>
              <Strong>Tele-MANAS</Strong> (free 24x7 mental health support, Government of India): 14416 or
              1-800-891-4416
            </>,
            <>
              <Strong>Emergency</Strong> (police, ambulance, fire): 112
            </>,
            <>
              <Strong>National Commission for Women helpline</Strong> (domestic violence and abuse): 7827170170
            </>,
          ]}
        />
      </>
    ),
  },
  {
    heading: '4. Acceptable use',
    body: (
      <>
        <P>You agree not to use {B.appName} to:</P>
        <UL
          items={[
            'harass, threaten, bully, blackmail or stalk anyone, or track a person without their knowledge;',
            'impersonate another person or misrepresent who you are;',
            "upload or share another person's private messages, photos or personal details without their consent;",
            'create or share content that is sexual content involving minors, non-consensual intimate content, hateful, defamatory or otherwise illegal under Indian law;',
            'try to break, overload, reverse-engineer or get around the limits or security of the service;',
            'resell or redistribute the service without our written permission.',
          ]}
        />
        <P>We may remove content or suspend accounts that break these rules.</P>
      </>
    ),
  },
  {
    heading: '5. Your account',
    body: (
      <P>
        You can sign in with email or Google. Keep your login details safe and do not share your account. You are
        responsible for activity under your account. Tell us at <MailLink email={B.email} /> if you think someone else
        has accessed it.
      </P>
    ),
  },
  {
    heading: '6. AI output',
    body: (
      <P>
        Suggestions are generated automatically by AI models. They can be wrong, incomplete, out of date or unsuitable
        for your situation. You decide what to say and do; please use your own judgement before acting on any
        suggestion. You are responsible for messages you choose to send to other people.
      </P>
    ),
  },
  {
    heading: '7. Plans, prices and payments',
    body: (
      <>
        <P>{B.appName} offers the following plans:</P>
        <UL
          items={[
            <>
              <Strong>Free</Strong>: ₹0, with daily usage limits on some tools.
            </>,
            <>
              <Strong>Plus</Strong>: ₹149 per month or ₹999 per year.
            </>,
            <>
              <Strong>Couple</Strong>: ₹249 per month or ₹1,799 per year. One payment covers both linked partners.
            </>,
          ]}
        />
        <P>
          Prices are shown in Indian Rupees (INR). Applicable taxes are as shown at checkout. Payments are processed by
          Razorpay; we do not see or store your full card or UPI details.
        </P>
        <P>
          <Strong>Auto-renewal.</Strong> Paid plans renew automatically at the end of each billing period (monthly or
          yearly) through Razorpay, using UPI AutoPay or your card, until you cancel. You will be charged the plan price
          in force at the time of renewal; if a price changes we will tell you before it applies to you.
        </P>
        <P>
          <Strong>Free trial.</Strong> New accounts get a 7-day free trial of Plus. No payment details are needed for the
          trial, and it ends automatically unless you choose to buy a plan.
        </P>
        <P>
          <Strong>Cancellation.</Strong> You can cancel anytime from the plans window in the app. After you cancel, you
          will not be charged again and your access continues until the end of the period you have already paid for.
          Refunds are covered by our Refund & Cancellation Policy.
        </P>
      </>
    ),
  },
  {
    heading: '8. Suspension and termination',
    body: (
      <P>
        You can stop using {B.appName} and delete your account at any time from Profile. We may suspend or close an
        account that breaks these terms, misuses the service or is required to be closed by law. Where reasonable, we
        will tell you why.
      </P>
    ),
  },
  {
    heading: '9. Our content',
    body: (
      <P>
        The {B.appName} app, name, design and software belong to us. You keep ownership of what you type and save; you
        give us permission to process it only to run the service for you, as described in our Privacy Policy.
      </P>
    ),
  },
  {
    heading: '10. Limitation of liability',
    body: (
      <P>
        {B.appName} is provided "as is". To the extent permitted by law, we are not liable for indirect or consequential
        losses, or for decisions you make based on AI suggestions. Our total liability for any claim relating to the
        service is limited to the amount you paid us in the 3 months before the claim. Nothing in these terms limits any
        rights you have under Indian consumer protection law that cannot be excluded.
      </P>
    ),
  },
  {
    heading: '11. Changes to these terms',
    body: (
      <P>
        We may update these terms from time to time. We will change the "Last updated" date above and, for important
        changes, tell you in the app or by email. Continuing to use {B.appName} after a change means you accept the
        updated terms.
      </P>
    ),
  },
  {
    heading: '12. Governing law',
    body: (
      <P>
        These terms are governed by the laws of India. Courts at {B.jurisdictionCity} will have exclusive jurisdiction
        over any dispute.
      </P>
    ),
  },
  {
    heading: '13. Contact',
    body: <P>{contactLine}</P>,
  },
];

/* -------------------------------------------------------------------------- */
/* Privacy Policy                                                             */
/* -------------------------------------------------------------------------- */
const PRIVACY: Section[] = [
  {
    heading: '1. Who we are',
    body: (
      <P>
        {B.appName} is operated by {B.legalName}, the data fiduciary for the personal data described here. This policy
        explains how we handle your data under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and the
        Information Technology Act, 2000 and its rules.
      </P>
    ),
  },
  {
    heading: '2. Data we collect',
    body: (
      <UL
        items={[
          <>
            <Strong>Account details</Strong>: your name and email address, and your login method (email or Google
            sign-in). Optionally your mobile number, if you choose to add it; we use it for WhatsApp reminders only
            when you tick that option, and you can remove it or turn reminders off anytime in your profile.
          </>,
          <>
            <Strong>What you type into tools</Strong>: messages, questions and descriptions you submit so the AI can
            respond.
          </>,
          <>
            <Strong>What you save</Strong>: memories, plans, dates, notes and other items you choose to keep.
          </>,
          <>
            <Strong>Partner-shared data</Strong>: if you link a partner, the items you choose to share are visible to
            your linked partner (and theirs to you).
          </>,
          <>
            <Strong>Usage counts</Strong>: how many times you have used tools, so we can apply daily free limits.
          </>,
          <>
            <Strong>Payment status</Strong>: which plan you are on, renewal dates and Razorpay payment or subscription
            IDs. Your card and UPI details are handled by Razorpay and are never stored by {B.appName}.
          </>,
        ]}
      />
    ),
  },
  {
    heading: '3. How we use it',
    body: (
      <UL
        items={[
          'to create and secure your account and sign you in;',
          'to generate AI suggestions and run the tools you use;',
          'to save your items and sync shared items with your linked partner;',
          'to manage plans, payments, free limits and the free trial;',
          'to answer support requests and send important service messages;',
          'to prevent abuse and keep the service safe, and to meet legal obligations.',
        ]}
      />
    ),
  },
  {
    heading: '4. AI processing',
    body: (
      <P>
        To generate a reply, the text you submit to a tool is sent to our AI providers, Groq and OpenRouter. They process
        it to return a response. {B.appName} does not use your content to train AI models. Please avoid entering
        sensitive details about yourself or others that you do not need to share.
      </P>
    ),
  },
  {
    heading: '5. Where your data is stored',
    body: (
      <P>
        Your account and saved data are stored with Supabase, a cloud database provider, in its Australia (Sydney) data
        region. By using {B.appName} you understand that your data is processed outside India, as permitted under the
        DPDP Act.
      </P>
    ),
  },
  {
    heading: '6. Cookies and local storage',
    body: (
      <P>
        We use your browser's local storage and similar technology to keep you signed in and remember preferences. We do
        not use advertising or cross-site tracking cookies.
      </P>
    ),
  },
  {
    heading: '7. Who we share data with',
    body: (
      <>
        <P>We do not sell your personal data. We share it only with service providers that help us run {B.appName}:</P>
        <UL
          items={[
            'Supabase: database, sign-in and storage;',
            'Groq and OpenRouter: AI text generation;',
            'Razorpay: payments and subscriptions;',
            'Render: app hosting.',
          ]}
        />
        <P>We may also disclose data when required by law, a court order or a lawful government request.</P>
      </>
    ),
  },
  {
    heading: '8. Your rights',
    body: (
      <>
        <P>Under the DPDP Act, 2023 you have the right to:</P>
        <UL
          items={[
            <>
              <Strong>Access</Strong> a summary of the personal data we hold about you;
            </>,
            <>
              <Strong>Correct</Strong> or update inaccurate data (most details can be edited in Profile);
            </>,
            <>
              <Strong>Delete</Strong> your data: use "Delete account" in Profile, which deletes your account and saved
              data;
            </>,
            <>
              <Strong>Withdraw consent</Strong> at any time, by deleting your account or writing to us (this does not
              affect processing already done);
            </>,
            <>
              <Strong>Raise a grievance</Strong> with our grievance officer (below), and nominate another person to
              exercise your rights if you are unable to.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    heading: '9. How long we keep data',
    body: (
      <P>
        We keep your data while your account is active. When you delete your account, we delete your personal data,
        except records we must keep by law (for example payment and tax records), which are kept only for the period
        the law requires.
      </P>
    ),
  },
  {
    heading: '10. Children',
    body: (
      <P>
        {B.appName} is not meant for anyone under 18. We do not knowingly collect data from children. If you believe a
        child has created an account, contact us and we will delete it.
      </P>
    ),
  },
  {
    heading: '11. Security',
    body: (
      <P>
        Data is encrypted in transit (HTTPS) and access to stored data is restricted to your account and, for shared
        items, your linked partner. No system is perfectly secure; if a breach affects you we will notify you and the
        authorities as required by law.
      </P>
    ),
  },
  {
    heading: '12. Grievance officer',
    body: (
      <P>
        Under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the
        DPDP Act, 2023, you can contact our grievance officer: <Strong>{G.name}</Strong>, <MailLink email={G.email} />.
        We will acknowledge your complaint and aim to resolve it within 30 days.
      </P>
    ),
  },
  {
    heading: '13. Changes to this policy',
    body: (
      <P>
        We may update this policy. We will change the "Last updated" date above and, for important changes, tell you in
        the app or by email.
      </P>
    ),
  },
  {
    heading: '14. Contact',
    body: <P>{contactLine}</P>,
  },
];

/* -------------------------------------------------------------------------- */
/* Refund & Cancellation Policy                                               */
/* -------------------------------------------------------------------------- */
const REFUND: Section[] = [
  {
    heading: '1. Cancelling a plan',
    body: (
      <P>
        You can cancel your Plus or Couple plan anytime from the plans window in the app. Once cancelled, no further
        charges are made, and you keep access until the end of your current billing period (month or year).
      </P>
    ),
  },
  {
    heading: '2. When you can get a refund',
    body: (
      <UL
        items={[
          <>
            <Strong>First payment, within 7 days</Strong>: if you are not happy, you can ask for a full refund within 7
            days of your first payment for a plan. This is available once per account.
          </>,
          <>
            <Strong>Duplicate payments</Strong>: if you were charged twice for the same thing, the extra payment is
            always refunded.
          </>,
          <>
            <Strong>Failed but charged</Strong>: if money left your account but the plan was not activated, it is always
            refunded (or the plan activated, if you prefer).
          </>,
        ]}
      />
    ),
  },
  {
    heading: '3. Renewals',
    body: (
      <P>
        Apart from the cases above, renewal payments are non-refundable. To avoid the next charge, cancel before your
        renewal date; you will keep access until the period you paid for ends.
      </P>
    ),
  },
  {
    heading: '4. Free trial',
    body: (
      <P>
        The 7-day free Plus trial needs no payment, so there is nothing to refund. It ends automatically unless you buy a
        plan.
      </P>
    ),
  },
  {
    heading: '5. How to request a refund',
    body: (
      <P>
        Email <MailLink email={B.email} /> from your registered email address, with your Razorpay payment ID (shown in
        your payment confirmation from Razorpay) and a short reason. We reply within 24–48 hours.
      </P>
    ),
  },
  {
    heading: '6. Processing time',
    body: (
      <P>
        Approved refunds are made to the original payment method (UPI, card or bank account) within 5–7 working days
        after approval. Your bank may take a little longer to show it.
      </P>
    ),
  },
  {
    heading: '7. Contact',
    body: <P>{contactLine}</P>,
  },
];

/* -------------------------------------------------------------------------- */
/* Contact Us                                                                 */
/* -------------------------------------------------------------------------- */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-0.5 sm:gap-4 py-3 border-b border-zinc-100 last:border-b-0">
    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:pt-0.5">{label}</dt>
    <dd className="text-sm text-zinc-800 break-words">{children}</dd>
  </div>
);

const ContactBody: React.FC = () => (
  <Card>
    <dl>
      <Row label="Business name">{B.legalName}</Row>
      <Row label="Product">{B.appName}</Row>
      <Row label="Owner">{B.ownerName}</Row>
      <Row label="Email">
        <MailLink email={B.email} />
      </Row>
      <Row label="Phone">{B.phone}</Row>
      <Row label="Address">
        {B.address.street}
        <br />
        {B.address.city}, {B.address.state} {B.address.pincode}
        <br />
        {B.address.country}
      </Row>
      <Row label="Support hours">Monday to Saturday, 10:00 am to 6:00 pm IST</Row>
      <Row label="Reply time">Usually within 24–48 hours</Row>
      <Row label="Grievance officer">
        {G.name}, <MailLink email={G.email} />
      </Row>
    </dl>
  </Card>
);

const SECTIONS: Record<Exclude<LegalPage, 'contact'>, Section[]> = {
  terms: TERMS,
  privacy: PRIVACY,
  refund: REFUND,
};

export const LegalView: React.FC<{ page: LegalPage }> = ({ page }) => {
  const { setActiveTab } = useApp();
  const meta = PAGES.find((p) => p.id === page) ?? PAGES[0];

  return (
    <PageContainer narrow>
      {hasPlaceholders() && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Draft: business details still need to be filled in
        </div>
      )}

      <nav className="flex flex-wrap gap-2" aria-label="Policies">
        {PAGES.map((p) => (
          <Chip key={p.id} selected={p.id === page} onClick={() => setActiveTab(p.id)}>
            {p.label}
          </Chip>
        ))}
      </nav>

      <PageHeader icon={meta.icon} title={meta.title} subtitle={meta.subtitle} />
      <p className="text-xs text-zinc-500 -mt-3">Last updated: {B.lastUpdated}</p>

      {page === 'contact' ? (
        <ContactBody />
      ) : (
        <Card padding="lg">
          <div className="space-y-7">
            {SECTIONS[page].map((s) => (
              <section key={s.heading} className="space-y-2.5">
                <h2 className="text-base font-bold text-zinc-900">{s.heading}</h2>
                <div className="space-y-2.5 text-sm text-zinc-700 leading-relaxed">{s.body}</div>
              </section>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-zinc-400">These policies are a starting template; have them reviewed for your business.</p>
    </PageContainer>
  );
};
