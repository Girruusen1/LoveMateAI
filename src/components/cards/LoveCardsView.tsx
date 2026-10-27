import React, { useRef, useState } from 'react';
import { Bookmark, Download, Heart, Palette, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { AIService } from '../../services/ai';
import { LoveCard } from '../../types';
import { downloadCardPng } from '../../utils/download';
import { uid } from '../../utils/uid';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  ToolLayout,
} from '../common/UIPrimitives';
import { SavedLoveCards } from '../common/SavedItems';

export const LoveCardsView: React.FC = () => {
  const { user, saveLoveCard, openShareModal, addPoints, showToast, triggerConfetti } = useApp();

  const [recipient, setRecipient] = useState(user?.partnerName || 'your partner');
  const [cardType, setCardType] = useState<LoveCard['type']>('Anniversary');
  const [theme, setTheme] = useState<LoveCard['theme']>('soft-rose');
  const [quote, setQuote] = useState('Loving you has been the calmest adventure and the wildest peace.');
  const [personalNote, setPersonalNote] = useState(
    `Happy Anniversary, ${user?.partnerName || 'your partner'}! Every ordinary day with you feels like a chapter worth saving forever. Thank you for choosing me every single day.`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  /** Cards (by content) that already earned download points, so points are awarded once per generated card. */
  const rewardedDownloads = useRef<Set<string>>(new Set());

  const cardTypes: LoveCard['type'][] = [
    'Anniversary',
    'Birthday',
    'Good Morning',
    'Good Night',
    'I Miss You',
    'Apology',
    'Valentine\'s Day',
    'Just Because',
  ];

  const themes: { id: LoveCard['theme']; label: string; bgClass: string; textClass: string; borderClass: string; pngColors: [string, string] }[] = [
    { id: 'soft-rose', label: 'Soft Rose', bgClass: 'from-rose-50 via-white to-pink-50', textClass: 'text-zinc-900', borderClass: 'border-rose-200', pngColors: ['#fff1f2', '#fce7f3'] },
    { id: 'lavender-dream', label: 'Lavender Dream', bgClass: 'from-purple-50 via-white to-indigo-50', textClass: 'text-zinc-900', borderClass: 'border-purple-200', pngColors: ['#faf5ff', '#eef2ff'] },
    { id: 'golden-sunset', label: 'Golden Sunset', bgClass: 'from-amber-50 via-white to-orange-50', textClass: 'text-zinc-900', borderClass: 'border-amber-200', pngColors: ['#fffbeb', '#fff7ed'] },
    { id: 'midnight-romance', label: 'Midnight Romance', bgClass: 'from-zinc-900 via-zinc-800 to-zinc-950', textClass: 'text-white', borderClass: 'border-zinc-700', pngColors: ['#27272a', '#09090b'] },
    { id: 'minimal-ivory', label: 'Minimal Ivory', bgClass: 'from-[#FAF9F8] via-white to-stone-50', textClass: 'text-zinc-900', borderClass: 'border-stone-200', pngColors: ['#FAF9F8', '#fafaf9'] },
  ];

  const handleGenerateContent = async (type: LoveCard['type']) => {
    setIsGenerating(true);
    setCardType(type);
    try {
      const msg = await AIService.generateLoveCardMessage(type, recipient, theme);
      setQuote(msg.quote);
      setPersonalNote(msg.personalNote);
      triggerConfetti();
      showToast(`Generated ${type} message! ✨`, 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Could not write the card. Please retry.', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const card: LoveCard = {
      id: uid('card'),
      recipientName: recipient,
      type: cardType,
      theme,
      quote,
      personalNote,
      createdAt: 'Just now',
    };
    saveLoveCard(card);
  };

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  const handleDownload = () => {
    const safeName = recipient.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'card';
    downloadCardPng(
      {
        title: `${cardType} for ${recipient}`,
        subtitle: `"${quote}"`,
        body: personalNote,
        footer: `LoveMate Keepsake · ${cardType}`,
        colors: currentTheme.pngColors,
      },
      `lovemate-${cardType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${safeName}.png`
    );
    showToast('Love Card downloaded as PNG image! 🎨', 'success');
    const key = [recipient, cardType, theme, quote, personalNote].join('|');
    if (!rewardedDownloads.current.has(key)) {
      rewardedDownloads.current.add(key);
      addPoints(10, 'Downloaded Love Card');
    }
  };

  const form = (
    <Card className="space-y-5">
      <div>
        <FieldLabel>Recipient name</FieldLabel>
        <Input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      </div>

      <div>
        <FieldLabel hint="picking one writes the card">Occasion</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {cardTypes.map((type) => (
            <Chip key={type} selected={cardType === type} onClick={() => handleGenerateContent(type)}>
              {type}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Theme</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {themes.map((th) => (
            <Chip
              key={th.id}
              selected={theme === th.id}
              onClick={() => setTheme(th.id)}
              icon={<span className={`block w-3.5 h-3.5 rounded-full border border-black/10 bg-gradient-to-br ${th.bgClass}`} />}
            >
              {th.label}
            </Chip>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => handleGenerateContent(cardType)}
        loading={isGenerating}
        icon={<Palette className="w-4 h-4" />}
      >
        Write the card
      </Button>
    </Card>
  );

  const result = (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div
          id="visual-love-card"
          className={`w-full max-w-md bg-gradient-to-br ${currentTheme.bgClass} ${currentTheme.borderClass} ${currentTheme.textClass} rounded-3xl p-8 sm:p-10 shadow-lg border relative overflow-hidden transition-all duration-300 space-y-6 text-center`}
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/15 flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse-subtle" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">A special note for</span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{recipient}</h2>
          </div>

          <blockquote className="font-serif italic text-sm sm:text-base leading-relaxed px-2 py-3 border-y border-current/15 opacity-90">
            "{quote}"
          </blockquote>

          <p className="text-xs sm:text-sm leading-relaxed opacity-80 px-2 font-medium">{personalNote}</p>

          <div className="pt-2 text-[10px] tracking-wider uppercase font-bold opacity-40">
            LoveMate Keepsake · {cardType}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={handleSave} icon={<Bookmark className="w-4 h-4" />}>
          Save card
        </Button>
        <Button variant="secondary" onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
          Download
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            openShareModal({
              type: 'card',
              data: { recipientName: recipient, type: cardType, theme, quote, personalNote },
            })
          }
          icon={<Share2 className="w-4 h-4" />}
        >
          Share
        </Button>
      </div>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        icon={<Palette />}
        title="Love cards"
        subtitle="Make a personal card for an anniversary, a birthday or a simple good morning, then save, download or share it."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <Palette />,
          title: 'Your card preview',
          description: 'Pick an occasion and a theme on the left to see the card here.',
        }}
      />

      <SavedLoveCards />
    </PageContainer>
  );
};
