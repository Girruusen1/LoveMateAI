import React, { useState } from 'react';
import { BookHeart, Bookmark, Download, Edit3, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { RealOurStory, RealOurStoryChapter } from '../../types';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  SectionHeading,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const OurRealStoryView: React.FC = () => {
  const { user, ourRealStory, saveRealStory, addPoints, showToast, triggerConfetti } = useApp();

  const [partners, setPartners] = useState(`${user?.name || 'You'} & ${user?.partnerName || 'your partner'}`);
  const [howMet, setHowMet] = useState('Spilled coffee in a cozy bookstore cafe in Mumbai on a rainy evening');
  const [firstDate, setFirstDate] = useState('Street tacos and long walk under one umbrella in the drizzle');
  const [funnyMemory, setFunnyMemory] = useState('Getting hopelessly lost trying to find a dessert shop and ending up laughing for hours');
  const [favoritePlace, setFavoritePlace] = useState('The rooftop sea breeze bench overlooking the city skyline');
  const [whatYouLove, setWhatYouLove] = useState('Your kind listening eyes, silly laughter, and making everyday feel special');
  const [style, setStyle] = useState<'romantic' | 'funny' | 'cinematic'>('romantic');

  const [chapters, setChapters] = useState<RealOurStoryChapter[]>(() => {
    return AIService.generateOurStoryChapters(
      `${user?.name || 'You'} & ${user?.partnerName || 'your partner'}`,
      {
        howMet: 'Spilled coffee in a cozy bookstore cafe in Mumbai on a rainy evening',
        firstDate: 'Street tacos and long walk under one umbrella in the drizzle',
        funnyMemory: 'Getting hopelessly lost trying to find a dessert shop and ending up laughing for hours',
        favoritePlace: 'The rooftop sea breeze bench overlooking the city skyline',
        whatYouLove: 'Your kind listening eyes, silly laughter, and making everyday feel special',
      },
      'romantic'
    );
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [editingChapterIdx, setEditingChapterIdx] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');

  const handleGenerate = (customStyle?: 'romantic' | 'funny' | 'cinematic') => {
    const chosenStyle = customStyle || style;
    setIsGenerating(true);
    setTimeout(() => {
      const newChapters = AIService.generateOurStoryChapters(
        partners,
        {
          howMet,
          firstDate,
          funnyMemory,
          favoritePlace,
          whatYouLove,
        },
        chosenStyle
      );
      setChapters(newChapters);
      setIsGenerating(false);
      triggerConfetti();
      addPoints(25, 'Generated Real Our Story');
      showToast(`Authored 5 Chapters in ${chosenStyle} style! 📖`, 'love');
    }, 700);
  };

  const handleSaveToVault = () => {
    const story: RealOurStory = {
      id: 'real_story_' + Date.now(),
      title: `${partners}: Our Living Story`,
      partners,
      chapters,
      style,
      createdAt: 'Just now',
    };
    saveRealStory(story);
  };

  const handleEditChapter = (idx: number) => {
    setEditingChapterIdx(idx);
    setEditedText(chapters[idx].content);
  };

  const handleSaveEditedChapter = (idx: number) => {
    const updated = [...chapters];
    updated[idx].content = editedText;
    setChapters(updated);
    setEditingChapterIdx(null);
    showToast('Chapter text updated ✨', 'info');
  };

  const handleExportText = () => {
    const fullBook = `${partners} — Our Real Story\n\n` + chapters.map(c => `Chapter ${c.chapterNumber}: ${c.title}\n${c.subtitle}\n\n${c.content}\n\n`).join('---\n\n');
    const blob = new Blob([fullBook], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${partners.replace(/\s+/g, '_')}_Our_Story.txt`;
    a.click();
    showToast('Exported Story as text book! 📚', 'success');
  };

  const form = (
    <Card className="space-y-4">
      <div>
        <FieldLabel>Your names</FieldLabel>
        <Input type="text" value={partners} onChange={(e) => setPartners(e.target.value)} />
      </div>

      <div>
        <FieldLabel>How you first met</FieldLabel>
        <Input type="text" value={howMet} onChange={(e) => setHowMet(e.target.value)} />
      </div>

      <div>
        <FieldLabel>The first date</FieldLabel>
        <Input type="text" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
      </div>

      <div>
        <FieldLabel>The funniest moment</FieldLabel>
        <Input type="text" value={funnyMemory} onChange={(e) => setFunnyMemory(e.target.value)} />
      </div>

      <div>
        <FieldLabel>Your favourite place</FieldLabel>
        <Input type="text" value={favoritePlace} onChange={(e) => setFavoritePlace(e.target.value)} />
      </div>

      <div>
        <FieldLabel>What you love most about them</FieldLabel>
        <Input type="text" value={whatYouLove} onChange={(e) => setWhatYouLove(e.target.value)} />
      </div>

      <div>
        <FieldLabel hint="picking one rewrites the book">Style</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {(['romantic', 'funny', 'cinematic'] as const).map((s) => (
            <Chip
              key={s}
              selected={style === s}
              className="capitalize"
              onClick={() => {
                setStyle(s);
                handleGenerate(s);
              }}
            >
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => handleGenerate()}
        loading={isGenerating}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Write our story
      </Button>
    </Card>
  );

  const result =
    chapters.length > 0 ? (
      <div className="space-y-4">
        <SectionHeading
          title={partners}
          description={`${chapters.length} chapters`}
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportText} icon={<Download className="w-3.5 h-3.5" />}>
                Export
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveToVault} icon={<Bookmark className="w-3.5 h-3.5" />}>
                Save
              </Button>
            </div>
          }
        />

        {chapters.map((ch, idx) => (
          <Card key={ch.chapterNumber} className="space-y-3">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="min-w-0">
                <Badge variant="rose">Chapter {ch.chapterNumber}</Badge>
                <h4 className="text-base font-bold text-zinc-900 mt-1.5">{ch.title}</h4>
                <p className="text-xs text-zinc-500 italic">{ch.subtitle}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditChapter(idx)}
                title="Edit chapter"
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
            </div>

            {editingChapterIdx === idx ? (
              <div className="space-y-2">
                <Textarea rows={4} value={editedText} onChange={(e) => setEditedText(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingChapterIdx(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleSaveEditedChapter(idx)}>
                    Save edit
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-800 font-serif leading-relaxed italic selection:bg-rose-100">
                "{ch.content}"
              </p>
            )}
          </Card>
        ))}
      </div>
    ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<BookHeart />}
        title="Our story"
        subtitle="Put in your real memories and turn them into a five-chapter keepsake you can edit, export and save."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <BookHeart />,
          title: 'No chapters yet',
          description: 'Add a few memories on the left and write your story.',
        }}
      />
    </PageContainer>
  );
};
