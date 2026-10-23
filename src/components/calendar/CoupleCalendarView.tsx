import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CoupleCalendarEvent } from '../../types';
import {
  Badge,
  BadgeVariant,
  Button,
  Chip,
  EmptyState,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Select,
  Textarea,
} from '../common/UIPrimitives';

const pad2 = (n: number) => String(n).padStart(2, '0');

const toDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Parse YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC midnight). */
const parseLocalDate = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

/** Local start of the event: its date plus its HH:mm time (midnight when no time is set). */
const eventStart = (evt: CoupleCalendarEvent): Date => {
  const d = parseLocalDate(evt.date);
  if (evt.time && /^\d{1,2}:\d{2}/.test(evt.time)) {
    const [h, min] = evt.time.split(':').map(Number);
    d.setHours(h, min, 0, 0);
  }
  return d;
};

const toGoogleStamp = (d: Date) =>
  `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;

/** Build a Google Calendar "create event" link with dates, details and location. */
const buildGoogleCalendarUrl = (evt: CoupleCalendarEvent, partnerName: string): string => {
  let dates: string;
  if (evt.time) {
    const start = eventStart(evt);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour
    dates = `${toGoogleStamp(start)}/${toGoogleStamp(end)}`;
  } else {
    // All-day event: end date is exclusive
    const start = parseLocalDate(evt.date);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const day = (d: Date) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
    dates = `${day(start)}/${day(end)}`;
  }
  const details = [evt.description, `Planned with ${partnerName} in LoveMate.`].filter(Boolean).join('\n\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evt.title,
    dates,
    details,
    location: evt.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const CoupleCalendarView: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, user, showToast } = useApp();

  const [viewMode, setViewMode] = useState<'upcoming' | 'month' | 'week'>('upcoming');
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<CoupleCalendarEvent['category']>('date');
  const [privacy, setPrivacy] = useState<'shared' | 'private'>('shared');
  const [description, setDescription] = useState('');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + 7);

  const filteredEvents = calendarEvents
    .filter((e) => categoryFilter === 'all' || e.category === categoryFilter)
    .filter((e) => {
      const day = parseLocalDate(e.date);
      if (viewMode === 'upcoming') return day >= todayStart;
      if (viewMode === 'week') return day >= todayStart && day < weekEnd;
      return day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth();
    })
    .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime());

  const emptyDescription =
    viewMode === 'week'
      ? 'Nothing in the next 7 days. Add a dinner, call or small surprise.'
      : viewMode === 'month'
      ? `Nothing scheduled in ${now.toLocaleDateString('en-US', { month: 'long' })}. Add your next dinner, trip or milestone.`
      : 'Add your next dinner, trip or milestone, or let LoveMate Agent schedule one for you.';

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addCalendarEvent({
      title,
      date,
      time,
      location,
      category,
      participants: privacy === 'shared' ? 'both' : 'self',
      privacy,
      createdBy: user?.name || 'You',
      description,
      reminderDaysBefore: 2,
    });

    setTitle('');
    setDescription('');
    setLocation('');
    setModalOpen(false);
  };

  const getCategoryVariant = (cat: CoupleCalendarEvent['category']): BadgeVariant => {
    switch (cat) {
      case 'anniversary':
        return 'rose';
      case 'birthday':
        return 'amber';
      case 'date':
        return 'purple';
      case 'trip':
        return 'blue';
      case 'challenge':
        return 'emerald';
      default:
        return 'zinc';
    }
  };

  const handleExportGoogleCalendar = (evt: CoupleCalendarEvent) => {
    const url = buildGoogleCalendarUrl(evt, user?.partnerName || 'your partner');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<CalendarIcon />}
        title="Couple calendar"
        subtitle="Shared dates, anniversaries, trips and challenges. Private surprise plans stay hidden until you reveal them."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add event
          </Button>
        }
      />

      {/* View Switcher & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl">
          {(['upcoming', 'month', 'week'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                viewMode === mode ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'anniversary', 'birthday', 'date', 'trip', 'challenge'].map((cat) => (
            <Chip key={cat} selected={categoryFilter === cat} onClick={() => setCategoryFilter(cat)} className="capitalize">
              {cat}
            </Chip>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-6 h-6" />}
          title="No events scheduled"
          description={emptyDescription}
          actionLabel="Add event"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs hover:border-rose-200 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[10px] font-bold text-rose-600 uppercase">
                      {parseLocalDate(evt.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-bold text-zinc-900 leading-none">
                      {parseLocalDate(evt.date).getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-zinc-900">{evt.title}</h3>
                      <Badge variant={getCategoryVariant(evt.category)}>{evt.category}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                      {evt.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" /> {evt.time}
                        </span>
                      )}
                      {evt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" /> {evt.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Privacy Badge */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {evt.privacy === 'shared' ? (
                    <Badge variant="emerald" size="md">
                      <Eye className="w-3 h-3" /> Shared with partner
                    </Badge>
                  ) : (
                    <Badge variant="amber" size="md">
                      <EyeOff className="w-3 h-3" /> Private surprise
                    </Badge>
                  )}
                </div>
              </div>

              {evt.description && (
                <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  {evt.description}
                </p>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                <span className="text-xs text-zinc-500">Added by {evt.createdBy}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExportGoogleCalendar(evt)}
                    icon={<ExternalLink className="w-3 h-3" />}
                    iconPosition="right"
                  >
                    Google Calendar
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteCalendarEvent(evt.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    aria-label="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-rose-500" /> Add event
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3.5">
              <div>
                <FieldLabel>Event title</FieldLabel>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Sunset Dinner at Marine Drive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Time</FieldLabel>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
                    <option value="date">Date</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="birthday">Birthday</option>
                    <option value="trip">Trip</option>
                    <option value="challenge">Challenge</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Privacy</FieldLabel>
                  <Select value={privacy} onChange={(e) => setPrivacy(e.target.value as any)}>
                    <option value="shared">Shared with partner</option>
                    <option value="private">Private (surprise)</option>
                  </Select>
                </div>
              </div>

              <div>
                <FieldLabel>Location</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. Bandra West Rooftop"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <Textarea
                  rows={2}
                  placeholder="e.g. Remember to bring camera & wear blue dress"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
