import React, { Suspense, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useT } from '../../i18n';
import type { ActiveTab, FeatureFlags } from '../../types';
import { PAGE_PLAN, PLANS } from '../../utils/plans';
import { hashToMode, tabToHash } from '../../utils/routes';
import { FeatureGate } from './FeatureGate';
import { PageSkeleton } from './PageSkeleton';

export interface HubMode {
  /** The tool's old tab id. It doubles as the mode in the address (?mode=) and as the key of its plan lock in PAGE_PLAN. */
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  /** One line under the switcher that says what this mode is for. */
  hint?: string;
  /** Admin feature flag the tool needs (unchanged from before it moved into the hub). */
  flag?: keyof FeatureFlags;
  render: () => React.ReactNode;
}

interface HubViewProps {
  hubId: ActiveTab;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  modes: HubMode[];
  /** Mode to open, set when the visitor arrived through an old tool id. Later changes are followed too. */
  initialMode?: ActiveTab;
}

const storageKey = (hubId: ActiveTab) => `lovemate.hub.${hubId}`;

const readLastMode = (hubId: ActiveTab): string | null => {
  try {
    return localStorage.getItem(storageKey(hubId));
  } catch {
    return null;
  }
};

const writeLastMode = (hubId: ActiveTab, mode: string) => {
  try {
    localStorage.setItem(storageKey(hubId), mode);
  } catch {
    /* private window or storage blocked: the hub simply opens on its first mode next time */
  }
};

/**
 * A hub page: one title, a row of mode chips, and the chosen tool rendered underneath.
 * The mode comes from (in order) the old tool id that opened the hub, `?mode=` in the address,
 * the last mode used on this device, or the first mode.
 */
export const HubView: React.FC<HubViewProps> = ({ hubId, title, subtitle, icon, modes, initialMode }) => {
  const { activeTab, setActiveTab, hasPlan } = useApp();
  const { t } = useT();

  const isMode = (m: string | null | undefined): m is ActiveTab => !!m && modes.some((x) => x.id === m);

  const [modeId, setModeId] = useState<ActiveTab>(() => {
    if (isMode(initialMode)) return initialMode;
    const fromHash = hashToMode(window.location.hash);
    if (isMode(fromHash)) return fromHash;
    const last = readLastMode(hubId);
    if (isMode(last)) return last;
    return modes[0].id;
  });

  // An old tool id opened from elsewhere (a notification, a suggestion, the dashboard) switches the mode.
  useEffect(() => {
    if (isMode(initialMode)) setModeId(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  // Back / forward between "#/hub?mode=a" and "#/hub?mode=b" switches too.
  useEffect(() => {
    const onPop = () => {
      const m = hashToMode(window.location.hash);
      if (isMode(m)) setModeId(m);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    writeLastMode(hubId, modeId);
  }, [hubId, modeId]);

  const choose = (id: ActiveTab) => {
    if (id === modeId) return;
    setModeId(id);
    // An old tool address becomes the hub's address, and the mode is recorded in it so the link can be shared.
    if (activeTab !== hubId) setActiveTab(hubId);
    window.history.replaceState(window.history.state, '', `${tabToHash(hubId)}?mode=${id}`);
    window.scrollTo({ top: 0 });
  };

  const mode = modes.find((m) => m.id === modeId) ?? modes[0];
  const neededPlan = PAGE_PLAN[mode.id];

  return (
    <div className="space-y-5" data-hub={hubId}>
      <div className="rounded-3xl bg-white border border-zinc-200/80 shadow-2xs p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-rose-600 text-white flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-zinc-900 leading-tight">{t(title)}</h2>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{t(subtitle)}</p>
          </div>
        </div>

        <div role="tablist" aria-label={t(title)} className="mt-4 flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none]">
          {modes.map((m) => {
            const selected = m.id === mode.id;
            const plan = PAGE_PLAN[m.id];
            const locked = !!plan && !hasPlan(plan);
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selected}
                data-mode={m.id}
                onClick={() => choose(m.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 ${
                  selected
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-rose-300 hover:text-rose-700'
                }`}
              >
                {m.icon}
                {t(m.label)}
                {locked && <Lock className={selected ? 'text-rose-100' : 'text-zinc-400'} aria-label={t('Needs the {plan} plan', { plan: PLANS[plan].name })} />}
              </button>
            );
          })}
        </div>
        {mode.hint && <p className="mt-2.5 text-xs text-zinc-500">{t(mode.hint)}</p>}
      </div>

      <div key={mode.id} data-hub-mode={mode.id}>
        <FeatureGate plan={neededPlan} flag={mode.flag} featureName={mode.label}>
          <Suspense fallback={<PageSkeleton />}>{mode.render()}</Suspense>
        </FeatureGate>
      </div>
    </div>
  );
};
