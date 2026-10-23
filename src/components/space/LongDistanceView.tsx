import React, { useEffect, useState } from 'react';
import { Film, Globe, Send, Sparkles, Utensils } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Badge,
  Button,
  Card,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  SectionHeading,
} from '../common/UIPrimitives';

/** Common city -> IANA zone map so a stored city name still yields a real local time. */
const CITY_ZONES: Record<string, string> = {
  // India (single zone)
  mumbai: 'Asia/Kolkata', delhi: 'Asia/Kolkata', 'new delhi': 'Asia/Kolkata', bangalore: 'Asia/Kolkata', bengaluru: 'Asia/Kolkata',
  hyderabad: 'Asia/Kolkata', chennai: 'Asia/Kolkata', kolkata: 'Asia/Kolkata', pune: 'Asia/Kolkata', ahmedabad: 'Asia/Kolkata',
  jaipur: 'Asia/Kolkata', lucknow: 'Asia/Kolkata', chandigarh: 'Asia/Kolkata', kochi: 'Asia/Kolkata', goa: 'Asia/Kolkata',
  indore: 'Asia/Kolkata', surat: 'Asia/Kolkata', noida: 'Asia/Kolkata', gurgaon: 'Asia/Kolkata', gurugram: 'Asia/Kolkata',
  // US / Canada
  'new york': 'America/New_York', nyc: 'America/New_York', boston: 'America/New_York', washington: 'America/New_York',
  miami: 'America/New_York', atlanta: 'America/New_York', chicago: 'America/Chicago', dallas: 'America/Chicago',
  houston: 'America/Chicago', austin: 'America/Chicago', denver: 'America/Denver', phoenix: 'America/Phoenix',
  'san francisco': 'America/Los_Angeles', 'los angeles': 'America/Los_Angeles', seattle: 'America/Los_Angeles',
  'san jose': 'America/Los_Angeles', 'san diego': 'America/Los_Angeles', toronto: 'America/Toronto', vancouver: 'America/Vancouver',
  // UK / Europe
  london: 'Europe/London', manchester: 'Europe/London', birmingham: 'Europe/London', edinburgh: 'Europe/London',
  dublin: 'Europe/Dublin', paris: 'Europe/Paris', berlin: 'Europe/Berlin', amsterdam: 'Europe/Amsterdam',
  // UAE / Gulf
  dubai: 'Asia/Dubai', 'abu dhabi': 'Asia/Dubai', sharjah: 'Asia/Dubai', doha: 'Asia/Qatar', riyadh: 'Asia/Riyadh', muscat: 'Asia/Muscat',
  // Other common
  singapore: 'Asia/Singapore', sydney: 'Australia/Sydney', melbourne: 'Australia/Melbourne', tokyo: 'Asia/Tokyo',
};

const ABBREVIATION_ZONES: Record<string, string> = {
  ist: 'Asia/Kolkata', gst: 'Asia/Dubai', gmt: 'Europe/London', bst: 'Europe/London', utc: 'UTC',
  est: 'America/New_York', edt: 'America/New_York', cst: 'America/Chicago', cdt: 'America/Chicago',
  mst: 'America/Denver', mdt: 'America/Denver', pst: 'America/Los_Angeles', pdt: 'America/Los_Angeles',
  cet: 'Europe/Paris', cest: 'Europe/Paris', sgt: 'Asia/Singapore', jst: 'Asia/Tokyo', aest: 'Australia/Sydney',
};

function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Resolve a stored timezone label / city to an IANA zone, or null if we can only use an offset. */
function resolveZone(tzLabel: string | undefined, city: string | undefined): string | null {
  const label = (tzLabel || '').trim();
  if (label && label.includes('/') && isValidZone(label)) return label;
  const cityKey = (city || '').trim().toLowerCase().split(',')[0].trim();
  if (cityKey && CITY_ZONES[cityKey]) return CITY_ZONES[cityKey];
  const abbr = label.split(/[\s(]/)[0]?.toLowerCase();
  if (abbr && ABBREVIATION_ZONES[abbr]) return ABBREVIATION_ZONES[abbr];
  return null;
}

/** Parse "UTC+5:30" / "GMT-4" style offsets into minutes. */
function parseOffsetMinutes(label: string | undefined): number | null {
  const m = /(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?/i.exec(label || '');
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function formatLocalTime(now: Date, tzLabel: string | undefined, city: string | undefined): { time: string; zone: string } {
  const zone = resolveZone(tzLabel, city);
  if (zone) {
    return {
      time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: zone }).format(now),
      zone,
    };
  }
  const offset = parseOffsetMinutes(tzLabel);
  if (offset !== null) {
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const shifted = new Date(utcMs + offset * 60000);
    return { time: shifted.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), zone: tzLabel || '' };
  }
  return { time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), zone: tzLabel || 'Local time' };
}

/** Parse "YYYY-MM-DD" as a local date, otherwise fall back to Date parsing of labels like "Nov 02, 2026". */
function parseReunionDate(value: string | undefined): Date | null {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(value: string | undefined, now: Date): number | null {
  const target = parseReunionDate(value);
  if (!target) return null;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - todayStart.getTime()) / 86400000);
}

export const LongDistanceView: React.FC = () => {
  const { user, longDistanceState, updateLongDistanceState, setActiveTab, showToast, addSharedPlan } = useApp();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);
  const [plannedIdeas, setPlannedIdeas] = useState<string[]>([]);

  const yourClock = formatLocalTime(now, longDistanceState.yourTimezone, longDistanceState.yourCity);
  const partnerClock = formatLocalTime(now, longDistanceState.partnerTimezone, longDistanceState.partnerCity);
  const reunionDays = daysUntil(longDistanceState.nextMeetingDate, now);

  const handlePlanTonight = (idea: { title: string; desc: string }) => {
    if (plannedIdeas.includes(idea.title)) return;
    addSharedPlan({ title: idea.title, type: 'date', notes: idea.desc, status: 'planned' });
    setPlannedIdeas((prev) => [...prev, idea.title]);
    showToast('Added to Our Space plans', 'love');
  };

  const partnerName = user?.partnerName || 'your partner';

  const [yourCity, setYourCity] = useState(longDistanceState.yourCity);
  const [partnerCity, setPartnerCity] = useState(longDistanceState.partnerCity);
  const [nextMeeting, setNextMeeting] = useState(longDistanceState.nextMeetingDate || 'Nov 02, 2026');

  const virtualDateIdeas = [
    {
      title: 'Synchronized Movie Night',
      desc: 'Pick a movie on Netflix/Prime, sync playback with headphones on, and react live over voice chat.',
      icon: <Film className="w-5 h-5" />,
      tag: 'Cozy & Chill',
    },
    {
      title: 'Cook the Same Recipe on Video Call',
      desc: 'Pick an easy pasta or Thai noodle recipe. Prop phones on kitchen counters and cook step-by-step together.',
      icon: <Utensils className="w-5 h-5" />,
      tag: 'Interactive Fun',
    },
    {
      title: 'Two-Player Trivia & Guess My Mind',
      desc: 'Play LoveMate synchronized couple questions and guess each other’s answers from miles away.',
      icon: <Sparkles className="w-5 h-5" />,
      tag: 'Playful Banter',
    },
    {
      title: 'Virtual Museum or City Walk Tour',
      desc: 'Screen-share Google Earth 3D street view of Tokyo, Paris, or old memories from childhood.',
      icon: <Globe className="w-5 h-5" />,
      tag: 'Exploration',
    },
  ];

  const handleSaveSettings = () => {
    updateLongDistanceState({
      yourCity,
      partnerCity,
      nextMeetingDate: nextMeeting,
    });
    showToast('Long distance settings updated! 🌍', 'love');
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<Globe />}
        title="Long distance"
        subtitle={`Bridge the miles between ${longDistanceState.yourCity} and ${longDistanceState.partnerCity}: track countdowns, plan virtual dates and send love notes.`}
        actions={
          <Button variant="primary" icon={<Send className="w-4 h-4" />} onClick={() => setActiveTab('love-cards')}>
            Send a card
          </Button>
        }
      />

      {/* Clocks & countdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 text-center space-y-1">
          <span className="text-xs text-zinc-500">{longDistanceState.yourCity} (you)</span>
          <p className="text-xl font-bold text-zinc-900">{yourClock.time}</p>
          <span className="text-[10px] text-zinc-500">{longDistanceState.yourTimezone || yourClock.zone}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 text-center space-y-1">
          <span className="text-xs text-zinc-500">
            {longDistanceState.partnerCity} ({partnerName})
          </span>
          <p className="text-xl font-bold text-zinc-900">{partnerClock.time}</p>
          <span className="text-[10px] text-zinc-500">{longDistanceState.partnerTimezone || partnerClock.zone}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 text-center space-y-1">
          <span className="text-xs text-zinc-500">Next reunion</span>
          <p className="text-xl font-bold text-rose-600">
            {reunionDays === null
              ? 'Set a date'
              : reunionDays < 0
              ? `${Math.abs(reunionDays)} ${Math.abs(reunionDays) === 1 ? 'day' : 'days'} ago`
              : reunionDays === 0
              ? 'Today!'
              : `${reunionDays} ${reunionDays === 1 ? 'day' : 'days'}`}
          </p>
          <span className="text-[10px] text-zinc-500">{longDistanceState.nextMeetingDate || 'Add a reunion date below'}</span>
        </div>
      </div>

      {/* Virtual date ideas */}
      <div className="space-y-4">
        <SectionHeading title="Virtual date ideas" description="Something to do together tonight." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {virtualDateIdeas.map((idea) => (
            <Card key={idea.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                  {idea.icon}
                </div>
                <Badge variant="zinc">{idea.tag}</Badge>
              </div>

              <div>
                <h4 className="text-base font-bold text-zinc-900">{idea.title}</h4>
                <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{idea.desc}</p>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handlePlanTonight(idea)}
                disabled={plannedIdeas.includes(idea.title)}
              >
                {plannedIdeas.includes(idea.title) ? 'Added to plans' : 'Plan for tonight'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings */}
      <Card className="space-y-4">
        <SectionHeading title="Distance details" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <FieldLabel>Your city</FieldLabel>
            <Input type="text" value={yourCity} onChange={(e) => setYourCity(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Partner city</FieldLabel>
            <Input type="text" value={partnerCity} onChange={(e) => setPartnerCity(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Next reunion date</FieldLabel>
            <Input type="text" value={nextMeeting} onChange={(e) => setNextMeeting(e.target.value)} placeholder="YYYY-MM-DD or Nov 02, 2026" />
          </div>
        </div>
        <Button variant="primary" onClick={handleSaveSettings}>
          Save settings
        </Button>
      </Card>
    </PageContainer>
  );
};
