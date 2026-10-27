import React, { useEffect, useMemo, useState } from 'react';
import {
  BookHeart,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Lock,
  MapPin,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { MAX_PHOTOS_PER_COLLECTION, photoBytes } from '../../utils/images';
import { resolvePhoto, useItemPhotos } from '../../utils/itemPhotos';
import { Lightbox } from '../common/Lightbox';
import { PhotoAttachment } from '../common/PhotoAttachment';
import { Badge, Button, Card, EmptyState, FieldLabel, Input, PageContainer, PageHeader, Textarea } from '../common/UIPrimitives';

// Photos added to pages that already existed (see src/utils/itemPhotos.ts). The cover uses the id "cover".
const SCRAPBOOK_PHOTOS_KEY = 'lovemate_scrapbook_photos_v1';
const COVER_ID = 'cover';

interface ScrapbookPage {
  id: string;
  title: string;
  date: string;
  photoUrl?: string;
  /** Photo stored on the underlying memory (used to decide how "remove" behaves). */
  ownPhotoUrl?: string;
  caption: string;
  tag?: string;
  location?: string;
}

export const ScrapbookView: React.FC = () => {
  const { user, sharedMemories, addSharedMemory, setActiveTab, showToast } = useApp();
  const { photos: photoOverrides, setPhoto, prune } = useItemPhotos(SCRAPBOOK_PHOTOS_KEY);

  const [activePage, setActivePage] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<{
    romantic: string;
    funny: string;
    shortStory: string;
  } | null>(null);

  // "Add page" form
  const [showAddPage, setShowAddPage] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);

  const partnerName = user?.partnerName || 'your partner';

  useEffect(() => {
    prune(new Set([COVER_ID, ...sharedMemories.map((m) => m.id)]));
  }, [sharedMemories, prune]);

  // Cover + one page per shared memory.
  const pages: ScrapbookPage[] = useMemo(
    () => [
      {
        id: COVER_ID,
        title: 'Cover: Our 2026 Chronicle',
        date: '2026 Edition',
        photoUrl: resolvePhoto(photoOverrides, COVER_ID),
        caption: `A private tapestry of laughter, rainy coffee dates, and quiet promises between ${user?.name || 'You'} & ${partnerName}.`,
        tag: 'Keepsake Edition',
        location: 'Our World',
      },
      ...sharedMemories.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        photoUrl: resolvePhoto(photoOverrides, m.id, m.photoUrl),
        ownPhotoUrl: m.photoUrl,
        caption: m.caption,
        tag: m.tags.join(' • '),
        location: m.location,
      })),
    ],
    [sharedMemories, photoOverrides, user?.name, partnerName]
  );

  const safeIndex = Math.min(activePage, pages.length - 1);
  const currentPage = pages[safeIndex];

  // Only uploaded (data URL) photos count towards the cap; sample http URLs are free.
  const uploadedCount = pages.filter((p) => photoBytes(p.photoUrl) > 0).length;
  const canAddPhoto = uploadedCount < MAX_PHOTOS_PER_COLLECTION;
  const photoLimitMessage = `Your scrapbook holds up to ${MAX_PHOTOS_PER_COLLECTION} photos. Remove one to add another.`;

  const handlePagePhoto = (page: ScrapbookPage, dataUrl: string | null) => {
    if (dataUrl) {
      setPhoto(page.id, dataUrl);
      showToast('Photo added to this page', 'success');
      return;
    }
    setPhoto(page.id, page.ownPhotoUrl ? '' : null);
    showToast('Photo removed', 'info');
  };

  const openAddPage = () => {
    setNewTitle('');
    setNewDate('');
    setNewLocation('');
    setNewCaption('');
    setNewPhoto(null);
    setShowAddPage(true);
  };

  const handleAddPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Give this page a title first', 'info');
      return;
    }
    addSharedMemory({
      title: newTitle.trim(),
      date: newDate.trim() || 'Today',
      location: newLocation.trim() || undefined,
      caption: newCaption.trim() || 'A moment worth keeping.',
      tags: ['Scrapbook'],
      // Compressed JPEG data URL (<= ~150 KB) stored on the memory so it persists with it.
      photoUrl: newPhoto || undefined,
    });
    setShowAddPage(false);
    setGeneratedCaptions(null);
    setActivePage(1); // new memories are added to the front, right after the cover
  };

  const handleGenerateCaptions = async () => {
    setGeneratingCaption(true);
    try {
      const res = await AIService.generateScrapbookCaption(currentPage.title, currentPage.caption, {
        date: currentPage.date,
        location: currentPage.location,
        tags: currentPage.tag,
      });
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

  const goTo = (idx: number) => {
    setActivePage(Math.max(0, Math.min(pages.length - 1, idx)));
    setGeneratedCaptions(null);
  };

  const isEmpty = sharedMemories.length === 0;

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<BookHeart />}
        title="Scrapbook"
        subtitle="Your timeline moments and photos, turned into a flippable memory album."
        actions={
          <>
            <Button variant="secondary" onClick={handleExportText} icon={<Download className="w-3.5 h-3.5" />} disabled={isEmpty}>
              Export
            </Button>
            <Button variant="secondary" onClick={() => setActiveTab('our-story-movie')} icon={<Film className="w-3.5 h-3.5" />} disabled={isEmpty}>
              Play as movie
            </Button>
            <Button variant="primary" onClick={openAddPage} icon={<Plus className="w-4 h-4" />}>
              Add page
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={<BookHeart className="w-6 h-6" />}
          title="Start your scrapbook"
          description="Your scrapbook turns the two of you into a flippable album: a photo, a date and a line about why it mattered. Pages stay private to you both."
          actionLabel="Add your first page"
          onAction={openAddPage}
          secondaryActionLabel="Invite your partner"
          onSecondaryAction={() => setActiveTab('couple-mode')}
        />
      ) : (
        <Card padding="lg" className="space-y-6">
          {/* Scrapbook Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2 font-semibold text-zinc-700">
              <span className="text-rose-600">Page {safeIndex + 1}</span>
              <span className="text-zinc-400">of {pages.length}</span>
              <span className="text-zinc-300">·</span>
              <span className="text-zinc-500">{currentPage.tag || 'Memory'}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Camera className="w-3 h-3" /> {uploadedCount}/{MAX_PHOTOS_PER_COLLECTION} photos
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private by default
              </span>
            </div>
          </div>

          {/* Media & Content Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Photo Frame */}
            <div className="space-y-3">
              <div className="bg-zinc-100 rounded-2xl p-2.5 shadow-inner border border-zinc-200/80 rotate-[-1deg] hover:rotate-0 transition-transform duration-300">
                <div className="h-64 sm:h-80 rounded-xl overflow-hidden relative bg-white">
                  {currentPage.photoUrl ? (
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(currentPage.photoUrl!)}
                      className="block w-full h-full cursor-zoom-in focus-visible:outline-none"
                      aria-label="View photo full size"
                      data-testid="scrapbook-photo"
                    >
                      <img src={currentPage.photoUrl} alt={currentPage.title} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-full h-full p-4 flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
                      <PhotoAttachment
                        value={null}
                        onChange={(url) => handlePagePhoto(currentPage, url)}
                        canAdd={canAddPhoto}
                        disabledReason={photoLimitMessage}
                        layout="card"
                        alt={currentPage.title}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                  {currentPage.location && currentPage.photoUrl && (
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 pointer-events-none">
                      <MapPin className="w-3 h-3" /> {currentPage.location}
                    </div>
                  )}
                </div>
              </div>

              {currentPage.photoUrl && (
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-[11px] text-zinc-500">Tap the photo to view it full size</span>
                  <PhotoAttachment
                    value={currentPage.photoUrl}
                    onChange={(url) => handlePagePhoto(currentPage, url)}
                    onOpen={setLightboxSrc}
                    canAdd={canAddPhoto}
                    disabledReason={photoLimitMessage}
                    alt={currentPage.title}
                    showThumb={false}
                  />
                </div>
              )}
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

          {/* Photo thumbnails */}
          {pages.some((p) => p.photoUrl) && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1" data-testid="scrapbook-thumbs">
              {pages.map((p, idx) =>
                p.photoUrl ? (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => goTo(idx)}
                    className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === safeIndex ? 'border-rose-500 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    aria-label={`Open page ${idx + 1}: ${p.title}`}
                    title={p.title}
                  >
                    <img src={p.photoUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ) : null
              )}
            </div>
          )}

          {/* Page Flip Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-zinc-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(safeIndex - 1)}
              disabled={safeIndex === 0}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1 flex-wrap justify-center">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to page ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === safeIndex ? 'bg-rose-600 w-6' : 'bg-zinc-200 hover:bg-zinc-300 w-2.5'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(safeIndex + 1)}
              disabled={safeIndex === pages.length - 1}
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </Card>
      )}

      <Lightbox src={lightboxSrc} alt="Scrapbook photo" onClose={() => setLightboxSrc(null)} />

      {/* Add page modal */}
      {showAddPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-zinc-900">Add a scrapbook page</h3>
            <form onSubmit={handleAddPage} className="space-y-3.5">
              <div>
                <FieldLabel>Title</FieldLabel>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sunset at Marine Drive"
                  data-testid="scrapbook-title"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel hint="optional">Date</FieldLabel>
                  <Input type="text" value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="e.g. 14 Feb 2026" />
                </div>
                <div>
                  <FieldLabel hint="optional">Place</FieldLabel>
                  <Input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. Mumbai" />
                </div>
              </div>
              <div>
                <FieldLabel hint="optional">Caption</FieldLabel>
                <Textarea rows={2} value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="Why does this moment matter?" />
              </div>
              <div>
                <FieldLabel hint="optional">Photo</FieldLabel>
                <PhotoAttachment
                  value={newPhoto}
                  onChange={setNewPhoto}
                  onOpen={setLightboxSrc}
                  canAdd={canAddPhoto}
                  disabledReason={photoLimitMessage}
                  layout="card"
                  alt="Page photo"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddPage(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" data-testid="scrapbook-save">
                  Save page
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
