import React, { useMemo, useState } from 'react';
import { AlertTriangle, Moon, Pencil, Save, Sparkles, Star, Sun, Sunrise, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RASHIS, rashiLabel } from '../../../shared/jyotish';
import { NAKSHATRAS, PLANET_IDS, PLANET_INFO } from '../../astro/constants';
import { computeChart, formatDegree, type BirthDetails, type Chart } from '../../astro/engine';
import { describeManglik } from '../../astro/gunaMilan';
import { clearBirthDetails, loadBirthDetails, saveBirthDetails } from '../../astro/birthStore';
import { Badge, Button, Card, PageContainer, PageHeader, ToolLayout } from '../common/UIPrimitives';
import { BirthDetailsForm, JyotishNote } from './JyotishCommon';
import { detailsFromDraft, draftFromDetails, emptyDraft, type BirthDraft } from './birthDraft';
import { NorthIndianChart } from './NorthIndianChart';

const Fact: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; muted?: boolean }> = ({ icon, label, value, sub, muted }) => (
  <div className={`p-3.5 rounded-2xl border ${muted ? 'bg-zinc-50 border-zinc-200' : 'bg-rose-50/50 border-rose-100'}`}>
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:text-rose-500">
      {icon}
      {label}
    </div>
    <div className="text-sm sm:text-base font-bold text-zinc-900 mt-1 leading-snug">{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
  </div>
);

export const KundliSummary: React.FC<{ chart: Chart }> = ({ chart }) => {
  const [moonChart, setMoonChart] = useState(!chart.timeKnown);
  const nak = NAKSHATRAS[chart.nakshatra];
  return (
    <div className="space-y-4">
      {chart.warnings.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          {chart.warnings.map((w) => (
            <p key={w} className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Fact icon={<Moon />} label="Rashi (Moon sign)" value={rashiLabel(chart.rashi)} sub={`${RASHIS[chart.rashi].hindi} · Moon at ${formatDegree(chart.planets.Moon.degree)}`} />
        <Fact icon={<Star />} label="Nakshatra" value={`${nak.name}, pada ${chart.pada}`} sub={`${nak.hindi} · ${nak.gana} gana · ${nak.nadi} nadi`} />
        <Fact
          icon={<Sunrise />}
          label="Lagna (Ascendant)"
          value={rashiLabel(chart.lagna.sign)}
          sub={chart.lagnaReliable ? `at ${formatDegree(chart.lagna.degree)}` : 'Not reliable without a birth time'}
          muted={!chart.lagnaReliable}
        />
        <Fact icon={<Sun />} label="Sun sign" value={`${RASHIS[chart.vedicSunSign].sanskrit} (Vedic)`} sub={`Western: ${RASHIS[chart.westernSunSign].english}`} />
      </div>

      <Card padding="sm" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-bold text-zinc-900">{moonChart ? 'Chandra kundli (from the Moon)' : 'Birth chart (North Indian style)'}</h3>
          <div className="flex gap-1">
            <Button size="sm" variant={moonChart ? 'secondary' : 'primary'} onClick={() => setMoonChart(false)}>
              Lagna
            </Button>
            <Button size="sm" variant={moonChart ? 'primary' : 'secondary'} onClick={() => setMoonChart(true)}>
              Moon
            </Button>
          </div>
        </div>
        <NorthIndianChart chart={chart} fromMoon={moonChart} />
        <p className="text-[11px] text-zinc-500 px-1">
          Numbers are signs (1 Mesha … 12 Meena). Su Sun, Mo Moon, Ma Mars, Me Mercury, Ju Jupiter, Ve Venus, Sa Saturn, Ra Rahu, Ke Ketu{moonChart ? '' : ', Asc Lagna'}. Rahu and Ketu use the mean node.
          {!chart.lagnaReliable && !moonChart && ' Without a birth time this Lagna chart is only a rough guide.'}
        </p>
      </Card>

      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="font-semibold py-2 px-2">Graha</th>
                <th className="font-semibold py-2 px-2">Sign</th>
                <th className="font-semibold py-2 px-2">Degree</th>
                <th className="font-semibold py-2 px-2">Nakshatra</th>
                <th className="font-semibold py-2 px-2">House</th>
              </tr>
            </thead>
            <tbody>
              {PLANET_IDS.map((id) => {
                const p = chart.planets[id];
                return (
                  <tr key={id} className="border-t border-zinc-100">
                    <td className="py-2 px-2 font-semibold text-zinc-800 whitespace-nowrap">
                      {id} <span className="text-zinc-400 font-normal">{PLANET_INFO[id].abbr}</span>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">{RASHIS[p.sign].sanskrit}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{formatDegree(p.degree)}</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      {NAKSHATRAS[p.nakshatra].name} {p.pada}
                    </td>
                    <td className="py-2 px-2">{chart.lagnaReliable ? p.house : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className={`p-4 rounded-2xl border ${chart.manglik.isManglik ? 'bg-amber-50/60 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-900">Manglik (Kuja) check</h3>
          <Badge variant={chart.manglik.isManglik ? 'amber' : 'emerald'}>{chart.manglik.isManglik ? 'Manglik' : 'Not Manglik'}</Badge>
        </div>
        <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
          {describeManglik(chart.manglik)} {chart.manglik.isManglik ? 'This is very common, there are many traditional cancellations, and lots of Manglik people have happy marriages.' : ''}
        </p>
      </div>
      <p className="text-[11px] text-zinc-400">
        Lahiri ayanamsa {formatDegree(chart.ayanamsa)} · whole-sign houses · computed on your device from {chart.input.place.name}.
      </p>
    </div>
  );
};

export const MyKundliView: React.FC = () => {
  const { user, showToast, setActiveTab } = useApp();
  const [saved, setSaved] = useState<BirthDetails | null>(() => loadBirthDetails());
  const [editing, setEditing] = useState(!saved);
  const [draft, setDraft] = useState<BirthDraft>(() => (saved ? draftFromDetails(saved) : emptyDraft(user?.name ?? '')));

  const chart = useMemo(() => {
    if (!saved) return null;
    try {
      return computeChart(saved);
    } catch {
      return null;
    }
  }, [saved]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const { details, error } = detailsFromDraft(draft, 'Your birth details');
    if (!details) {
      showToast(error ?? 'Please check your birth details.', 'info');
      return;
    }
    saveBirthDetails(details);
    setSaved(details);
    setEditing(false);
    showToast('Birth details saved to your account.', 'success');
  };

  const handleClear = () => {
    clearBirthDetails();
    setSaved(null);
    setDraft(emptyDraft(user?.name ?? ''));
    setEditing(true);
  };

  const form = (
    <Card>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Your birth details</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Saved to your account so Kundli Milan and rashifal can use them. Only you can see them.</p>
        </div>
        <BirthDetailsForm value={draft} onChange={setDraft} namePlaceholder="Your name" />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" icon={<Save className="w-4 h-4" />}>
            Save and show my kundli
          </Button>
          {saved && (
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
        <JyotishNote />
      </form>
    </Card>
  );

  const savedCard = saved && (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-zinc-900">{saved.name || 'My birth details'}</h2>
        <p className="text-xs text-zinc-500 mt-1">
          {new Date(`${saved.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          {saved.timeUnknown ? ' · time unknown' : ` · ${saved.time}`}
          <br />
          {saved.place.name}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={handleClear}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-100">
        <Button size="sm" variant="primary" icon={<Sparkles className="w-3.5 h-3.5" />} onClick={() => setActiveTab('rashifal')}>
          Today&apos;s love rashifal
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setActiveTab('kundli')}>
          Kundli Milan with someone
        </Button>
      </div>
      <JyotishNote />
    </Card>
  );

  return (
    <PageContainer>
      <PageHeader icon={<Moon />} title="My kundli" subtitle="Your Rashi, Nakshatra, Lagna and a North Indian birth chart, calculated on your device." />
      <ToolLayout
        form={editing || !saved ? form : savedCard}
        result={chart ? <KundliSummary key={`${chart.utc}-${chart.input.place.lat}-${chart.input.place.lon}`} chart={chart} /> : null}
        placeholder={{ icon: <Moon />, title: 'No kundli yet', description: 'Add your date, time and place of birth to see your Rashi, Nakshatra, Lagna and birth chart.' }}
      />
    </PageContainer>
  );
};
