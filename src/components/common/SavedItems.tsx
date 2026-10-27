import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  Copy,
  FolderOpen,
  Heart,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Palette,
  Share2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { copyText } from '../../utils/clipboard';
import type { AIMessage } from '../../types';
import { Badge, Button, Card } from '../common/UIPrimitives';

/**
 * Saved items live inside the tool that creates them (the separate "Saved library" page is retired).
 * Each tool mounts its own <Saved…/> block at the bottom of the page; the block stays collapsed so the
 * tool keeps the focus, and opens by itself when the user saves something new.
 */

const ICON_BTN = 'p-1.5 rounded-lg transition-colors';
const ICON_BTN_NEUTRAL = `${ICON_BTN} text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100`;
const ICON_BTN_ROSE = `${ICON_BTN} text-zinc-500 hover:text-rose-600 hover:bg-rose-50`;
const ICON_BTN_DELETE = `${ICON_BTN} text-zinc-400 hover:text-rose-600 hover:bg-rose-50`;

/** Copy with a 2 s "copied" tick per item id. */
function useCopy() {
  const { showToast } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedId(id);
    showToast('Copied to clipboard! 📋', 'love');
    setTimeout(() => setCopiedId(null), 2000);
  };
  return { copiedId, copy };
}

const CopyIcon: React.FC<{ copied: boolean }> = ({ copied }) =>
  copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />;

interface SavedSectionProps {
  /** e.g. "Your saved confessions"; the count is appended as "(3)". */
  title: string;
  count: number;
  icon?: React.ReactNode;
  /** Shown under the title when nothing is saved yet. */
  emptyText?: string;
  defaultOpen?: boolean;
  /** Attribute hook for tests and deep links, e.g. "saved-confessions". */
  id?: string;
  children: React.ReactNode;
}

/** Collapsible "Your saved … (n)" block. Opens on its own when the count goes up (the user just saved something). */
export const SavedSection: React.FC<SavedSectionProps> = ({
  title,
  count,
  icon = <Bookmark />,
  emptyText = 'Nothing saved yet. Tap Save on anything you like to keep it here.',
  defaultOpen = false,
  id,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) setOpen(true);
    prevCount.current = count;
  }, [count]);

  const empty = count === 0;
  const bodyId = id ? `${id}-body` : undefined;

  return (
    <section
      id={id}
      data-saved-section={id}
      data-count={count}
      className="rounded-3xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-zinc-900">
            {title} <span className="text-zinc-500 font-semibold">({count})</span>
          </span>
          {empty && <span className="block text-xs text-zinc-500 mt-0.5">{emptyText}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !empty && (
        <div id={bodyId} className="px-3 sm:px-4 pb-4 space-y-3 border-t border-zinc-100 pt-3">
          {children}
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Per-kind lists. Each one reads from the context and wraps itself in SavedSection.
// ---------------------------------------------------------------------------

export const SavedConfessions: React.FC = () => {
  const { savedConfessions, deleteConfession, openShareModal } = useApp();
  const { copiedId, copy } = useCopy();
  return (
    <SavedSection
      id="saved-confessions"
      title="Your saved confessions"
      count={savedConfessions.length}
      icon={<Mail />}
      emptyText="Nothing saved yet. Tap Save under a confession to keep it here."
    >
      {savedConfessions.map((conf) => (
        <Card key={conf.id} padding="sm" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="rose" size="md">
              <Mail className="w-3 h-3" /> For {conf.recipient} • {conf.tone} tone
            </Badge>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => copy(conf.id, conf.content)} className={ICON_BTN_NEUTRAL} title="Copy" aria-label="Copy confession">
                <CopyIcon copied={copiedId === conf.id} />
              </button>
              <button
                onClick={() => openShareModal({ type: 'confession', data: conf })}
                className={ICON_BTN_ROSE}
                title="Share as card"
                aria-label="Share confession as card"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteConfession(conf.id)} className={ICON_BTN_DELETE} title="Delete" aria-label="Delete confession">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-800 font-serif italic bg-zinc-50/60 p-3.5 rounded-2xl border border-zinc-100 leading-relaxed">
            "{conf.content}"
          </p>
        </Card>
      ))}
    </SavedSection>
  );
};

export const SavedCompatibility: React.FC = () => {
  const { savedCompatibility, deleteCompatibility, openShareModal } = useApp();
  return (
    <SavedSection
      id="saved-compatibility"
      title="Your saved reports"
      count={savedCompatibility.length}
      icon={<Heart />}
      emptyText="Nothing saved yet. Tap Save report under a result to keep it here."
    >
      {savedCompatibility.map((comp) => (
        <Card key={comp.id} padding="sm" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex flex-col items-center justify-center shrink-0">
              <span className="text-sm font-bold">{comp.overallScore}%</span>
              <span className="text-[8px] uppercase font-bold">Match</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-zinc-900 break-words">
                {comp.yourName} × {comp.theirName} ({comp.relationshipType})
              </h4>
              <p className="text-xs text-zinc-600 line-clamp-1">{comp.verdict}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="secondary" size="sm" icon={<Share2 className="w-3.5 h-3.5" />} onClick={() => openShareModal({ type: 'compatibility', data: comp })}>
              Card
            </Button>
            <button onClick={() => deleteCompatibility(comp.id)} className={ICON_BTN_DELETE} title="Delete" aria-label="Delete compatibility report">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}
    </SavedSection>
  );
};

export const SavedStories: React.FC = () => {
  const { savedStories, deleteStory } = useApp();
  return (
    <SavedSection
      id="saved-stories"
      title="Your saved stories"
      count={savedStories.length}
      icon={<BookOpen />}
      emptyText="Nothing saved yet. Tap Save story to keep your chapters here."
    >
      {savedStories.map((story) => (
        <Card key={story.id} padding="sm" className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="purple" size="md">
              <BookOpen className="w-3 h-3" /> {story.protagonistName} & {story.partnerName} • {story.episodes.length}{' '}
              {story.episodes.length === 1 ? 'chapter' : 'chapters'}
            </Badge>
            <button onClick={() => deleteStory(story.id)} className={ICON_BTN_DELETE} title="Delete" aria-label="Delete love story">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-zinc-600 line-clamp-2 italic font-serif">"{story.episodes[0]?.content}"</p>
        </Card>
      ))}
    </SavedSection>
  );
};

export type SavedChat = { id: string; title: string; messages: AIMessage[]; savedAt: string };

/** Saved AI chats; pass `onOpen` to let the user load one back into the chat. */
export const SavedChats: React.FC<{ onOpen?: (chat: SavedChat) => void }> = ({ onOpen }) => {
  const { savedChats, deleteSavedChat } = useApp();
  const { copiedId, copy } = useCopy();
  const transcript = (chat: SavedChat) => chat.messages.map((m) => `${m.role === 'user' ? 'You' : 'LoveMate'}: ${m.content}`).join('\n\n');
  return (
    <SavedSection
      id="saved-chats"
      title="Your saved chats"
      count={savedChats.length}
      icon={<MessageSquare />}
      emptyText="Nothing saved yet. Tap Save above to keep a conversation here."
    >
      {savedChats.map((chat) => (
        <Card key={chat.id} padding="sm" className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-zinc-900 truncate">{chat.title}</h4>
              <p className="text-xs text-zinc-500">
                {chat.messages.length} messages • {chat.savedAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onOpen && (
              <button onClick={() => onOpen(chat)} className={ICON_BTN_ROSE} title="Open this chat" aria-label="Open saved chat">
                <FolderOpen className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => copy(chat.id, transcript(chat))} className={ICON_BTN_NEUTRAL} title="Copy transcript" aria-label="Copy chat transcript">
              <CopyIcon copied={copiedId === chat.id} />
            </button>
            <button onClick={() => deleteSavedChat(chat.id)} className={ICON_BTN_DELETE} title="Delete" aria-label="Delete saved chat">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}
    </SavedSection>
  );
};

/** Saved replies: list + copy (the context has no delete for replies). */
export const SavedReplies: React.FC = () => {
  const { savedReplies } = useApp();
  const { copiedId, copy } = useCopy();
  const count = savedReplies.reduce((n, item) => n + item.replies.length, 0);
  return (
    <SavedSection
      id="saved-replies"
      title="Your saved replies"
      count={count}
      icon={<MessageSquareText />}
      emptyText="Nothing saved yet. Tap Save on any suggestion to keep it here."
    >
      {savedReplies.flatMap((item) =>
        item.replies.map((rep, idx) => {
          const copyId = `${item.id}_${rep.id || idx}`;
          return (
            <Card key={copyId} padding="sm" className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="blue" size="md">
                  <MessageSquareText className="w-3 h-3" /> {item.intent}
                  {rep.vibe ? ` • ${rep.vibe}` : ''}
                </Badge>
                <button onClick={() => copy(copyId, rep.text)} className={`${ICON_BTN_NEUTRAL} shrink-0`} title="Copy" aria-label="Copy reply">
                  <CopyIcon copied={copiedId === copyId} />
                </button>
              </div>
              {item.inputMessage && <p className="text-xs text-zinc-500 line-clamp-1">Replying to: "{item.inputMessage}"</p>}
              <p className="text-sm font-semibold text-zinc-900 bg-zinc-50/60 p-3.5 rounded-2xl border border-zinc-100 leading-relaxed">"{rep.text}"</p>
            </Card>
          );
        })
      )}
    </SavedSection>
  );
};

export const SavedLoveCards: React.FC = () => {
  const { savedLoveCards, deleteLoveCard, openShareModal } = useApp();
  return (
    <SavedSection
      id="saved-love-cards"
      title="Your saved cards"
      count={savedLoveCards.length}
      icon={<Palette />}
      emptyText="Nothing saved yet. Tap Save card under the preview to keep it here."
    >
      {savedLoveCards.map((card) => (
        <Card key={card.id} padding="sm" className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="amber" size="md">
              <Palette className="w-3 h-3" /> {card.type} for {card.recipientName}
            </Badge>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openShareModal({ type: 'card', data: card })} className={ICON_BTN_ROSE} title="Share as card" aria-label="Share love card">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteLoveCard(card.id)} className={ICON_BTN_DELETE} title="Delete" aria-label="Delete love card">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-700 italic font-serif">"{card.quote}"</p>
          <p className="text-xs text-zinc-600 line-clamp-2">{card.personalNote}</p>
        </Card>
      ))}
    </SavedSection>
  );
};
