import React, { useState } from 'react';
import {
  BookHeart,
  BookOpen,
  Bookmark,
  Check,
  Copy,
  Heart,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Palette,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import { Badge, Button, Card, Chip, EmptyState, PageContainer, PageHeader } from '../common/UIPrimitives';

export const SavedLibraryView: React.FC = () => {
  const {
    savedConfessions,
    deleteConfession,
    savedCompatibility,
    deleteCompatibility,
    savedStories,
    deleteStory,
    savedChats,
    deleteSavedChat,
    savedReplies,
    savedLoveCards,
    deleteLoveCard,
    setActiveTab,
    openShareModal,
    showToast,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<
    'all' | 'confessions' | 'compatibility' | 'stories' | 'chats' | 'replies' | 'cards'
  >('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedId(id);
    showToast('Copied to clipboard! 📋', 'love');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalItemsCount =
    savedConfessions.length +
    savedCompatibility.length +
    savedStories.length +
    savedChats.length +
    savedReplies.length +
    savedLoveCards.length;

  const categories = [
    { id: 'all', label: 'All items', count: totalItemsCount, icon: <Bookmark /> },
    { id: 'confessions', label: 'Confessions', count: savedConfessions.length, icon: <Mail /> },
    { id: 'compatibility', label: 'Compatibility', count: savedCompatibility.length, icon: <Heart /> },
    { id: 'stories', label: 'Love stories', count: savedStories.length, icon: <BookOpen /> },
    { id: 'chats', label: 'AI chats', count: savedChats.length, icon: <MessageSquare /> },
    { id: 'replies', label: 'Replies', count: savedReplies.length, icon: <MessageSquareText /> },
    { id: 'cards', label: 'Love cards', count: savedLoveCards.length, icon: <Palette /> },
  ] as const;

  const activeCount = categories.find((c) => c.id === activeCategory)?.count ?? 0;

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<BookHeart />}
        title="Saved library"
        subtitle={`${totalItemsCount} saved items. Your confessions, compatibility reports, love stories and chats in one private place.`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setActiveTab('confession')}>
            Create new
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            selected={activeCategory === cat.id}
            icon={cat.icon}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label} ({cat.count})
          </Chip>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-4">
        {/* Confessions */}
        {(activeCategory === 'all' || activeCategory === 'confessions') &&
          savedConfessions.map((conf) => (
            <Card key={conf.id} padding="sm" className="space-y-3 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="rose" size="md">
                  <Mail className="w-3 h-3" /> For {conf.recipient} • {conf.tone} tone
                </Badge>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(conf.id, conf.content)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors"
                    title="Copy"
                    aria-label="Copy confession"
                  >
                    {copiedId === conf.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openShareModal({ type: 'confession', data: conf })}
                    className="p-1.5 text-zinc-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Share as card"
                    aria-label="Share confession as card"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteConfession(conf.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete"
                    aria-label="Delete confession"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-zinc-800 font-serif italic bg-zinc-50/60 p-3.5 rounded-2xl border border-zinc-100 leading-relaxed">
                "{conf.content}"
              </p>
            </Card>
          ))}

        {/* Compatibility reports */}
        {(activeCategory === 'all' || activeCategory === 'compatibility') &&
          savedCompatibility.map((comp) => (
            <Card key={comp.id} padding="sm" className="flex items-center justify-between gap-4 sm:p-5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-bold">{comp.overallScore}%</span>
                  <span className="text-[8px] uppercase font-bold">Match</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-zinc-900">
                    {comp.yourName} × {comp.theirName} ({comp.relationshipType})
                  </h4>
                  <p className="text-xs text-zinc-600 line-clamp-1">{comp.verdict}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Share2 className="w-3.5 h-3.5" />}
                  onClick={() => openShareModal({ type: 'compatibility', data: comp })}
                >
                  Card
                </Button>
                <button
                  onClick={() => deleteCompatibility(comp.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete"
                  aria-label="Delete compatibility report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}

        {/* Love stories */}
        {(activeCategory === 'all' || activeCategory === 'stories') &&
          savedStories.map((story) => (
            <Card key={story.id} padding="sm" className="space-y-2 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="purple" size="md">
                  <BookOpen className="w-3 h-3" /> {story.protagonistName} & {story.partnerName} • {story.episodes.length} chapters
                </Badge>
                <button
                  onClick={() => deleteStory(story.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete"
                  aria-label="Delete love story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-zinc-600 line-clamp-2 italic font-serif">
                "{story.episodes[0]?.content}"
              </p>
            </Card>
          ))}

        {/* Saved AI chats */}
        {(activeCategory === 'all' || activeCategory === 'chats') &&
          savedChats.map((chat) => (
            <Card key={chat.id} padding="sm" className="flex items-center justify-between gap-3 sm:p-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-zinc-900 truncate">{chat.title}</h4>
                  <p className="text-xs text-zinc-500">{chat.messages.length} messages • {chat.savedAt}</p>
                </div>
              </div>

              <button
                onClick={() => deleteSavedChat(chat.id)}
                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                title="Delete"
                aria-label="Delete saved chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}

        {/* Saved replies (no delete function exists in context) */}
        {(activeCategory === 'all' || activeCategory === 'replies') &&
          savedReplies.flatMap((item) =>
            item.replies.map((rep, idx) => {
              const copyId = `${item.id}_${rep.id || idx}`;
              return (
                <Card key={copyId} padding="sm" className="space-y-2 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="blue" size="md">
                      <MessageSquareText className="w-3 h-3" /> {item.intent}
                      {rep.vibe ? ` • ${rep.vibe}` : ''}
                    </Badge>
                    <button
                      onClick={() => handleCopy(copyId, rep.text)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors shrink-0"
                      title="Copy"
                      aria-label="Copy reply"
                    >
                      {copiedId === copyId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {item.inputMessage && (
                    <p className="text-xs text-zinc-500 line-clamp-1">Replying to: "{item.inputMessage}"</p>
                  )}
                  <p className="text-sm font-semibold text-zinc-900 bg-zinc-50/60 p-3.5 rounded-2xl border border-zinc-100 leading-relaxed">
                    "{rep.text}"
                  </p>
                </Card>
              );
            })
          )}

        {/* Saved love cards */}
        {(activeCategory === 'all' || activeCategory === 'cards') &&
          savedLoveCards.map((card) => (
            <Card key={card.id} padding="sm" className="space-y-2 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="amber" size="md">
                  <Palette className="w-3 h-3" /> {card.type} for {card.recipientName}
                </Badge>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openShareModal({ type: 'card', data: card })}
                    className="p-1.5 text-zinc-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Share as card"
                    aria-label="Share love card"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteLoveCard(card.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete"
                    aria-label="Delete love card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-700 italic font-serif">"{card.quote}"</p>
              <p className="text-xs text-zinc-600 line-clamp-2">{card.personalNote}</p>
            </Card>
          ))}

        {/* Empty category */}
        {totalItemsCount > 0 && activeCategory !== 'all' && activeCount === 0 && (
          <EmptyState
            icon={<Bookmark className="w-6 h-6" />}
            title="Nothing saved here yet"
            description={
              activeCategory === 'replies'
                ? 'Tap Save on any suggestion in "What should I reply?" to keep it here.'
                : activeCategory === 'cards'
                ? 'Save a card from Love cards to keep it here.'
                : 'Items you save in this category will show up here.'
            }
          />
        )}

        {/* Empty state */}
        {totalItemsCount === 0 && (
          <EmptyState
            icon={<Mail className="w-6 h-6" />}
            title="Your saved library is empty"
            description="Whenever you generate a confession, calculate compatibility or write a love story, save it here to re-read anytime."
            actionLabel="Write your first confession"
            onAction={() => setActiveTab('confession')}
          />
        )}
      </div>
    </PageContainer>
  );
};
