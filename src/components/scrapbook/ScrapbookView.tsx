import React, { useState } from 'react';
import {
  BookHeart,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Lock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { Badge, Button, Card, PageContainer, PageHeader } from '../common/UIPrimitives';

export const ScrapbookView: React.FC = () => {
  const { user, sharedMemories, savedLoveCards, timelineMilestones, setActiveTab, openShareModal, showToast } =
    useApp();

  const [activePage, setActivePage] = useState(0);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<{
    romantic: string;
    funny: string;
    shortStory: string;
  } | null>(null);

  const partnerName = user?.partnerName || 'your partner';

  // Merge items into scrapbook pages
  const pages = [
    {
      title: 'Cover: Our 2026 Chronicle',
      date: '2026 Edition',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop',
      caption: `A private tapestry of laughter, rainy coffee dates, and quiet promises between ${user?.name || 'You'} & ${partnerName}.`,
      tag: 'Keepsake Edition',
      location: 'Our World',
    },
    ...sharedMemories.map((m) => ({
      title: m.title,
      date: m.date,
      photoUrl: m.photoUrl,
      caption: m.caption,
      tag: m.tags.join(' • '),
      location: m.location,
    })),
  ];

  const currentPage = pages[activePage] || pages[0];

  const handleGenerateCaptions = async () => {
    setGeneratingCaption(true);
    try {
      const res = await AIService.generateScrapbookCaption(currentPage.title, currentPage.caption);
      setGeneratedCaptions(res);
      showToast('AI crafted 3 new scrapbook captions! ✨', 'love');
    } catch (e) {
      showToast('Caption generation error', 'info');
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleExportText = () => {
    const textContent = pages
      .map(
        (p, i) =>
          `[PAGE ${i + 1}] ${p.title} (${p.date})\nLocation: ${p.location || 'N/A'}\n${p.caption}\n------------------------\n`
      )
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoveMate_Scrapbook_${Date.now()}.txt`;
    a.click();
    showToast('Scrapbook exported safely as .txt file! 📄', 'success');
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<BookHeart />}
        title="Scrapbook"
        subtitle="Your timeline moments and photos, turned into a flippable memory album."
        actions={
          <>
            <Button variant="secondary" onClick={handleExportText} icon={<Download className="w-3.5 h-3.5" />}>
              Export
            </Button>
            <Button variant="primary" onClick={() => setActiveTab('our-story-movie')} icon={<Film className="w-3.5 h-3.5" />}>
              Play as movie
            </Button>
          </>
        }
      />

      {/* Main Scrapbook Page Viewer */}
      <Card padding="lg" className="space-y-6">
        {/* Scrapbook Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2 font-semibold text-zinc-700">
            <span className="text-rose-600">Page {activePage + 1}</span>
            <span className="text-zinc-400">of {pages.length}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-500">{currentPage.tag || 'Memory'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Lock className="w-3 h-3" /> Private by default
          </div>
        </div>

        {/* Media & Content Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Photo Frame */}
          <div className="bg-zinc-100 rounded-2xl p-2.5 shadow-inner border border-zinc-200/80 rotate-[-1deg] hover:rotate-0 transition-transform duration-300">
            <div className="h-64 sm:h-80 rounded-xl overflow-hidden relative">
              <img
                src={currentPage.photoUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop'}
                alt={currentPage.title}
                className="w-full h-full object-cover"
              />
              {currentPage.location && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {currentPage.location}
                </div>
              )}
            </div>
          </div>

          {/* Text & Story Details */}
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-600 font-bold block">
              {currentPage.date}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{currentPage.title}</h2>
            <p className="text-sm text-zinc-600 leading-relaxed bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
              "{currentPage.caption}"
            </p>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateCaptions}
              loading={generatingCaption}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Suggest captions
            </Button>

            {/* Generated Captions Options */}
            {generatedCaptions && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm space-y-1">
                  <Badge variant="rose">Romantic</Badge>
                  <p className="italic text-zinc-800">"{generatedCaptions.romantic}"</p>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm space-y-1">
                  <Badge variant="zinc">Funny</Badge>
                  <p className="italic text-zinc-800">"{generatedCaptions.funny}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Flip Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-zinc-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActivePage((prev) => Math.max(0, prev - 1))}
            disabled={activePage === 0}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActivePage(idx)}
                aria-label={`Go to page ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  idx === activePage ? 'bg-rose-600 w-6' : 'bg-zinc-200 hover:bg-zinc-300 w-2.5'
                }`}
              />
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActivePage((prev) => Math.min(pages.length - 1, prev + 1))}
            disabled={activePage === pages.length - 1}
            icon={<ChevronRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Next
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};
