import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Info, MapPin } from 'lucide-react';
import { JYOTISH_NOTE, type AstroLanguage } from '../../../shared/jyotish';
import { cityLabel, searchCities, type City } from '../../astro/cities';
import type { BirthDraft } from './birthDraft';
import { Chip, FieldLabel, Input } from '../common/UIPrimitives';

/** The one-line disclaimer every Jyotish page shows. */
export const JyotishNote: React.FC<{ className?: string }> = ({ className = '' }) => (
  <p className={`text-xs text-zinc-500 flex items-start gap-2 ${className}`}>
    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
    <span>{JYOTISH_NOTE}</span>
  </p>
);

const LANGS: { id: AstroLanguage; label: string }[] = [
  { id: 'english', label: 'English' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'hindi', label: 'हिंदी' },
];

export const LanguageChips: React.FC<{ value: AstroLanguage; onChange: (l: AstroLanguage) => void }> = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2" role="group" aria-label="Language">
    {LANGS.map((l) => (
      <Chip key={l.id} selected={value === l.id} onClick={() => onChange(l.id)}>
        {l.label}
      </Chip>
    ))}
  </div>
);

const CitySearch: React.FC<{ draft: BirthDraft; onPick: (c: City) => void; onType: (q: string) => void }> = ({ draft, onPick, onType }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => (draft.cityPicked ? [] : searchCities(draft.placeName, 8)), [draft.placeName, draft.cityPicked]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (c: City) => {
    onPick(c);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
      <Input
        className="pl-9"
        placeholder="Search city, e.g. Lucknow"
        value={draft.placeName}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          onType(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!matches.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(matches.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && open) {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-lg py-1">
          {matches.map((c, i) => (
            <li
              key={`${c.name}-${c.state}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2 text-sm cursor-pointer ${i === active ? 'bg-rose-50 text-rose-700' : 'text-zinc-700'}`}
            >
              {c.name} <span className="text-zinc-400 text-xs">{c.state}</span>
            </li>
          ))}
        </ul>
      )}
      {!draft.cityPicked && draft.placeName.trim().length >= 2 && matches.length === 0 && (
        <p className="text-[11px] text-zinc-500 mt-1">Not in our list yet. Use "Enter coordinates" below with your town's latitude and longitude.</p>
      )}
    </div>
  );
};

/** Name, date, time (with "I don't know the time") and place. */
export const BirthDetailsForm: React.FC<{
  value: BirthDraft;
  onChange: (d: BirthDraft) => void;
  namePlaceholder?: string;
  showName?: boolean;
}> = ({ value, onChange, namePlaceholder = 'Name', showName = true }) => {
  const set = (patch: Partial<BirthDraft>) => onChange({ ...value, ...patch });
  const id = useId();
  return (
    <div className="space-y-3">
      {showName && (
        <div>
          <FieldLabel>Name</FieldLabel>
          <Input placeholder={namePlaceholder} value={value.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Date of birth</FieldLabel>
          <Input type="date" min="1900-01-01" max="2100-12-31" value={value.date} onChange={(e) => set({ date: e.target.value })} aria-label="Date of birth" />
        </div>
        <div>
          <FieldLabel>Time of birth</FieldLabel>
          <Input type="time" value={value.time} disabled={value.timeUnknown} onChange={(e) => set({ time: e.target.value })} aria-label="Time of birth" />
        </div>
      </div>
      <label htmlFor={`${id}-unknown`} className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer select-none">
        <input id={`${id}-unknown`} type="checkbox" className="accent-rose-600 w-4 h-4" checked={value.timeUnknown} onChange={(e) => set({ timeUnknown: e.target.checked, time: e.target.checked ? '' : value.time })} />
        I don&apos;t know the time
      </label>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-zinc-700">Place of birth</span>
          <button
            type="button"
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
            onClick={() => set({ manual: !value.manual, cityPicked: false, placeName: '', lat: '', lon: '', tz: '5.5' })}
          >
            {value.manual ? 'Search cities instead' : 'Enter coordinates'}
          </button>
        </div>
        {value.manual ? (
          <div className="space-y-2">
            <Input placeholder="Place name (optional)" value={value.placeName} onChange={(e) => set({ placeName: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Input inputMode="decimal" placeholder="Lat, e.g. 26.85" aria-label="Latitude" value={value.lat} onChange={(e) => set({ lat: e.target.value })} />
              <Input inputMode="decimal" placeholder="Lon, e.g. 80.95" aria-label="Longitude" value={value.lon} onChange={(e) => set({ lon: e.target.value })} />
              <Input inputMode="decimal" placeholder="UTC +5.5" aria-label="UTC offset in hours" value={value.tz} onChange={(e) => set({ tz: e.target.value })} />
            </div>
            <p className="text-[11px] text-zinc-500">North and east are positive. UTC offset in hours (India is 5.5).</p>
          </div>
        ) : (
          <CitySearch
            draft={value}
            onType={(q) => set({ placeName: q, cityPicked: false })}
            onPick={(c) => set({ placeName: cityLabel(c), lat: String(c.lat), lon: String(c.lon), cityPicked: true })}
          />
        )}
      </div>
    </div>
  );
};
