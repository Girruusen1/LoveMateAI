import React, { useState } from 'react';
import { BookHeart, Calendar, CalendarHeart, Gift, Palette, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImportantDate } from '../../types';
import {
  Button,
  EmptyState,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
} from '../common/UIPrimitives';

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Parse YYYY-MM-DD as a local date (not UTC midnight). */
const parseLocalDate = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

export const ImportantDatesView: React.FC = () => {
  const { importantDates, addImportantDate, deleteImportantDate, setActiveTab, showToast, addPoints } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(() => todayKey());
  const [type, setType] = useState<ImportantDate['type']>('anniversary');
  const [notes, setNotes] = useState('');

  // Calculate days remaining helper
  // Days from today (local) to the date. Birthdays and anniversaries recur yearly, so roll them to the next occurrence.
  const getDaysRemaining = (targetDateStr: string, dateType?: ImportantDate['type']) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let target = parseLocalDate(targetDateStr);
    if ((dateType === 'birthday' || dateType === 'anniversary') && target < today) {
      target = new Date(today.getFullYear(), target.getMonth(), target.getDate());
      if (target < today) target = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
    }
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleAddDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addImportantDate({
      title,
      date: dateStr,
      type,
      reminderEnabled: true,
      notes,
    });

    setTitle('');
    setNotes('');
    setDateStr(todayKey());
    setIsModalOpen(false);
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<CalendarHeart />}
        title="Important dates"
        subtitle="Never miss an anniversary, birthday or milestone, and jump straight into planning something for it."
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add date
          </Button>
        }
      />

      {/* Upcoming Dates */}
      {importantDates.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart className="w-6 h-6" />}
          title="No dates yet"
          description="Add an anniversary, birthday or milestone and we will count down to it."
          actionLabel="Add date"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {importantDates.map((d) => {
            const daysLeft = getDaysRemaining(d.date, d.type);
            const isNear = daysLeft >= 0 && daysLeft <= 14;

            return (
              <div
                key={d.id}
                className={`p-5 rounded-2xl border shadow-2xs space-y-4 transition-all ${
                  isNear ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                        isNear ? 'bg-rose-600 text-white' : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <span className="text-base font-bold leading-none">{daysLeft > 0 ? daysLeft : 0}</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">days</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900">{d.title}</h3>
                      <p className="text-xs text-zinc-500 truncate">{d.date} • {d.notes || 'No notes added'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteImportantDate(d.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                    title="Delete date"
                    aria-label="Delete date"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 1-Click Action Triggers */}
                <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500 mr-1">Plan something:</span>

                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('love-cards')} icon={<Palette className="w-3.5 h-3.5" />}>
                    Card
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('date-planner')} icon={<Calendar className="w-3.5 h-3.5" />}>
                    Date plan
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('date-gift')} icon={<Gift className="w-3.5 h-3.5" />}>
                    Gift ideas
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('our-story')} icon={<BookHeart className="w-3.5 h-3.5" />}>
                    Our story
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Date Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Add important date</h3>

            <form onSubmit={handleAddDate} className="space-y-3.5">
              <div>
                <FieldLabel>Title</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. 1st Year Anniversary, Her Birthday, Our First Trip"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Date</FieldLabel>
                <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. Loves Italian dining and handwritten letters"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save date
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
