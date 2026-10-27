import React, { useState } from 'react';
import { BookOpen, Bookmark, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { isAiLimitError } from '../../utils/aiErrors';
import { LoveStory, LoveStoryEpisode } from '../../types';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  SectionHeading,
  Select,
  ToolLayout,
} from '../common/UIPrimitives';

export const AILoveStoryView: React.FC = () => {
  const { user, saveStory, addPoints, showToast, triggerConfetti } = useApp();

  const [protagonist, setProtagonist] = useState(user?.name || 'You');
  const [partner, setPartner] = useState(user?.partnerName || 'your partner');
  const [howWeMet, setHowWeMet] = useState('A shared laugh over a spilled iced coffee in a cozy bookstore');
  const [setting, setSetting] = useState('Rainy Mumbai evening');
  const [mood, setMood] = useState('Romantic & Heartwarming');
  // Offline sample so the page has content before the first generation
  const [episodes, setEpisodes] = useState<LoveStoryEpisode[]>(() => [
    AIService.sampleStoryEpisode(
      user?.name || 'You',
      user?.partnerName || 'your partner',
      'A shared laugh over a spilled iced coffee in a cozy bookstore',
      'Rainy Mumbai evening',
      1
    ),
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNextEpisode = async () => {
    setIsGenerating(true);
    const nextNum = episodes.length + 1;
    try {
      const newEp = await AIService.generateStoryEpisode(protagonist, partner, howWeMet, setting, nextNum, mood, episodes);
      setEpisodes((prev) => [...prev, newEp]);
      triggerConfetti();
      addPoints(15, 'Generated Next Story Chapter');
      showToast(`Chapter ${nextNum} unlocked! 📖`, 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Could not write the next chapter. Please retry.', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFullStory = () => {
    const story: LoveStory = {
      id: 'story_' + Date.now(),
      protagonistName: protagonist,
      partnerName: partner,
      howWeMet,
      setting,
      mood,
      episodes,
      createdAt: 'Just now',
    };
    saveStory(story);
  };

  const form = (
    <Card className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Your name</FieldLabel>
          <Input type="text" value={protagonist} onChange={(e) => setProtagonist(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Their name</FieldLabel>
          <Input type="text" value={partner} onChange={(e) => setPartner(e.target.value)} />
        </div>
      </div>

      <div>
        <FieldLabel hint="or how you wish you met">How did you meet?</FieldLabel>
        <Input type="text" value={howWeMet} onChange={(e) => setHowWeMet(e.target.value)} />
      </div>

      <div>
        <FieldLabel>Setting or city</FieldLabel>
        <Input type="text" value={setting} onChange={(e) => setSetting(e.target.value)} />
      </div>

      <div>
        <FieldLabel>Story tone</FieldLabel>
        <Select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value="Romantic & Heartwarming">Romantic & Heartwarming</option>
          <option value="Witty & Banter Filled">Witty & Banter Filled</option>
          <option value="Poetic & Deep">Poetic & Deep</option>
          <option value="Cinematic Drama">Cinematic Drama</option>
        </Select>
      </div>

      <div className="space-y-2 pt-1">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleNextEpisode}
          loading={isGenerating}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Write chapter {episodes.length + 1}
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleSaveFullStory} icon={<Bookmark className="w-3.5 h-3.5" />}>
          Save story to library
        </Button>
      </div>
    </Card>
  );

  const result =
    episodes.length > 0 ? (
      <div className="space-y-4">
        <SectionHeading
          title={`${protagonist} & ${partner}`}
          description={`${episodes.length} ${episodes.length === 1 ? 'chapter' : 'chapters'} so far`}
        />

        {episodes.map((ep) => (
          <Card key={ep.episodeNumber} className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <Badge variant="rose">Chapter {ep.episodeNumber}</Badge>
              <h3 className="text-sm font-bold text-zinc-900 text-right">{ep.title}</h3>
            </div>

            <p className="text-sm text-zinc-800 font-serif leading-relaxed italic selection:bg-rose-100">
              {ep.content}
            </p>
          </Card>
        ))}
      </div>
    ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<BookOpen />}
        title="AI love story"
        subtitle="Turn real memories or daydreams into a chapter-by-chapter romance starring the two of you."
      />

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <BookOpen />,
          title: 'No chapters yet',
          description: 'Fill in the details on the left and write the first chapter.',
        }}
      />
    </PageContainer>
  );
};
