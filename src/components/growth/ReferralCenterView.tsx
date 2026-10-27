import React, { useState } from 'react';
import {
  Check,
  Copy,
  Gift,
  Heart,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import { downloadCardPng } from '../../utils/download';
import { Badge, Button, Card, Chip, FieldLabel, Input, PageContainer, PageHeader, SectionHeading } from '../common/UIPrimitives';

export const ReferralCenterView: React.FC = () => {
  const {
    referralStats,
    generateNewReferralCode,
    claimReferralCode,
    user,
    coupleRoom,
    showToast,
    triggerConfetti,
  } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [previewCard, setPreviewCard] = useState<'compatibility' | 'love_card' | 'wrapped'>('compatibility');

  const referralLink = `${window.location.origin}/?ref=${referralStats.referralCode}`;

  const handleCopyCode = async () => {
    const ok = await copyText(referralStats.referralCode);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedCode(true);
    showToast('Referral code copied to clipboard!', 'love');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async () => {
    const ok = await copyText(referralLink);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedLink(true);
    showToast('Invite link copied! Share it with friends or your partner.', 'love');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const roomCode = coupleRoom?.roomCode || 'Not linked';

  const previewContent: Record<
    'compatibility' | 'love_card' | 'wrapped',
    { title: string; subtitle: string; body: string; colors: [string, string] }
  > = {
    compatibility: {
      title: `${user?.name || 'You'} & ${user?.partnerName || 'your partner'}`,
      subtitle: '94% emotional harmony',
      body: 'Complementary energy. High spontaneous playfulness combined with deep conversational grounding.',
      colors: ['#fff1f2', '#fce7f3'],
    },
    love_card: {
      title: 'Poetic keepsake',
      subtitle: `From ${user?.name || 'me'}`,
      body: 'In every coffee sip and sunset stroll, I found the easiest home in you.',
      colors: ['#faf5ff', '#eef2ff'],
    },
    wrapped: {
      title: 'Wrapped 2026',
      subtitle: '42 shared moments · 6 goals crushed',
      body: '"The Golden Era of Us"',
      colors: ['#f5f3ff', '#fce7f3'],
    },
  };

  const inviteText = `Join me on LoveMate, the AI wingman for love 💗 Sign up with my link and we both get 7 days of Plus free: ${referralLink}`;

  const handleShareToSocials = async () => {
    const card = previewContent[previewCard];
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${card.title} · LoveMate`,
          text: `${card.subtitle}\n${card.body}\n\n${inviteText}`,
          url: referralLink,
        });
        triggerConfetti();
      } catch (err) {
        if ((err as DOMException)?.name !== 'AbortError') showToast("Couldn't open the share sheet.", 'info');
      }
      return;
    }
    const ok = await copyText(inviteText);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    showToast('Sharing is not available in this browser, so the invite text was copied instead.', 'info');
  };

  const handleSaveImage = () => {
    const card = previewContent[previewCard];
    downloadCardPng(
      {
        title: card.title,
        subtitle: card.subtitle,
        body: card.body,
        footer: `Invite code ${referralStats.referralCode} · via LoveMate`,
        colors: card.colors,
      },
      `lovemate-${previewCard}-card.png`
    );
    showToast('Card image downloaded', 'success');
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    claimReferralCode(inputCode.trim());
    setInputCode('');
  };

  const previews = [
    { id: 'compatibility', label: 'Compatibility 94%' },
    { id: 'love_card', label: 'AI love card' },
    { id: 'wrapped', label: 'Wrapped 2026' },
  ] as const;

  return (
    <PageContainer>
      <PageHeader
        icon={<Gift />}
        title="Referrals"
        subtitle="Invite friends with your link. When a friend signs up, you both get 7 days of LoveMate Plus free (up to 10 friends), plus 100 Love Points."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-zinc-900">{referralStats.pointsEarned}</p>
          <p className="text-xs text-zinc-500">Points earned</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-zinc-900">{referralStats.totalInvited}</p>
          <p className="text-xs text-zinc-500">Invites sent</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-zinc-900">{referralStats.joinedCount}</p>
          <p className="text-xs text-zinc-500">Friends joined</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-rose-600">
            {referralStats.activeCoupleLinked ? 'Linked' : 'Pending'}
          </p>
          <p className="text-xs text-zinc-500">Partner status</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral code */}
        <Card className="space-y-5">
          <SectionHeading
            title="Your referral code"
            description="Share with anyone exploring relationship AI."
            action={
              <Button variant="ghost" size="sm" onClick={generateNewReferralCode}>
                Regenerate
              </Button>
            }
          />

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3">
            <span className="font-mono text-base font-bold tracking-wider text-zinc-900">
              {referralStats.referralCode}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyCode}
            >
              {copiedCode ? 'Copied' : 'Copy code'}
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-rose-600" /> Invite link
              </span>
              <button
                onClick={handleCopyLink}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                {copiedLink ? 'Copied' : 'Copy link'}
              </button>
            </div>
            <p className="text-xs font-mono text-zinc-500 truncate">{referralLink}</p>
          </div>

          <form onSubmit={handleClaim} className="pt-3 border-t border-zinc-100">
            <FieldLabel>Received a referral code from a friend?</FieldLabel>
            <div className="flex gap-2">
              <Input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter referral code..."
                className="flex-1 font-mono uppercase"
              />
              <Button type="submit" variant="primary" className="shrink-0">
                Claim 7 days of Plus
              </Button>
            </div>
          </form>
        </Card>

        {/* Partner invite */}
        <Card className="space-y-5">
          <SectionHeading
            title="Couple invite"
            description="Connect with your partner for synchronized features."
            action={
              <span className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" />
              </span>
            }
          />

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <p className="text-xs font-semibold text-zinc-700">Active couple room</p>
            <p className={`font-mono text-2xl font-bold tracking-widest ${coupleRoom ? 'text-rose-600' : 'text-zinc-400'}`}>
              {roomCode}
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {coupleRoom
                ? 'Your partner can enter this code in Couple Mode, or open the invite link, to sync scrapbooks, memories and couple games.'
                : 'Create a room in Couple Mode to get a code your partner can enter.'}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-700">Recent invites</h3>
            <div className="space-y-1.5">
              {referralStats.invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs"
                >
                  <span className="font-medium text-zinc-800 truncate">{inv.emailOrCode}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-400">{inv.createdAt}</span>
                    <Badge
                      variant={inv.status === 'rewarded' ? 'emerald' : inv.status === 'joined' ? 'rose' : 'zinc'}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Shareable cards */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-rose-600" />
              Shareable cards
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Share highlights with a privacy guarantee. Private journals and sensitive wingman notes are never exported.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {previews.map((p) => (
              <Chip key={p.id} selected={previewCard === p.id} onClick={() => setPreviewCard(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-full md:w-80 p-5 rounded-2xl bg-white border border-rose-200/80 shadow-md space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-600 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500" /> LoveMate AI
              </span>
              <span className="text-xs text-zinc-400">Verified result</span>
            </div>
            {previewCard === 'compatibility' && (
              <div className="space-y-1">
                <p className="text-2xl font-bold text-zinc-900">{previewContent.compatibility.title}</p>
                <p className="text-xs font-bold text-rose-600">{previewContent.compatibility.subtitle}</p>
                <p className="text-xs text-zinc-600 leading-relaxed">"{previewContent.compatibility.body}"</p>
              </div>
            )}
            {previewCard === 'love_card' && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-rose-600">Poetic keepsake</span>
                <p className="text-xs italic text-zinc-800 leading-relaxed">
                  "In every coffee sip and sunset stroll, I found the easiest home in you."
                </p>
              </div>
            )}
            {previewCard === 'wrapped' && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-rose-600">Wrapped 2026</span>
                <p className="text-sm font-bold text-zinc-900">42 shared moments • 6 goals crushed</p>
                <p className="text-xs text-zinc-500">"The Golden Era of Us"</p>
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-fit">
              <ShieldCheck className="w-4 h-4" /> Zero private context included
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              This card is safe to post on Instagram Stories, WhatsApp or group chats. It contains only high-level celebratory summaries and strips out personal journals, addresses and private notes.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={<Share2 className="w-3.5 h-3.5" />}
                onClick={handleShareToSocials}
              >
                Share to socials
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSaveImage}>
                Save image
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};
