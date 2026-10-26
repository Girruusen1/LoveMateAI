import React from 'react';
import { Lock, ShieldAlert, Sparkles, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EntitlementFeature, FeatureFlags } from '../../types';
import { Button, PageContainer } from './UIPrimitives';
import { PLANS, type PaidPlan } from '../../utils/plans';

interface FeatureGateProps {
  /** Plan entitlement required to use this page */
  entitlement?: EntitlementFeature;
  /** Admin feature flag that must be on */
  flag?: keyof FeatureFlags;
  /** Only admins may open this page */
  adminOnly?: boolean;
  /** Signed-in users only */
  requireAuth?: boolean;
  /** Paid plan needed to open this page */
  plan?: PaidPlan;
  featureName: string;
  children: React.ReactNode;
}

const Notice: React.FC<{ icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }> = ({ icon, title, body, action }) => (
  <PageContainer narrow>
    <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center max-w-xl mx-auto">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">{body}</p>
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  </PageContainer>
);

const TIER_FOR: Record<EntitlementFeature, string> = {
  basic_chat: 'Free',
  love_calculator: 'Free',
  confessions: 'Free',
  advanced_ai: 'Plus',
  memory_center: 'Plus',
  couple_sync: 'Couple',
  experience_marketplace: 'Couple',
  agent_autonomous: 'Couple',
  autopilot: 'Couple',
  unlimited_plans: 'Couple',
};

/** Wraps a page and shows an explanatory card instead when the user may not use it. */
export const FeatureGate: React.FC<FeatureGateProps> = ({ entitlement, flag, adminOnly, requireAuth, plan, featureName, children }) => {
  const { user, isAdmin, canUseFeature, hasPlan, featureFlags, setProModalOpen, openAuthModal, setActiveTab } = useApp();

  if (adminOnly && !isAdmin) {
    return (
      <Notice
        icon={<ShieldAlert />}
        title="Admins only"
        body="The admin console is restricted to LoveMate team accounts."
        action={<Button variant="secondary" onClick={() => setActiveTab('home')}>Back to home</Button>}
      />
    );
  }

  if (flag && !featureFlags[flag]) {
    return (
      <Notice
        icon={<Wrench />}
        title={`${featureName} is temporarily unavailable`}
        body="This feature has been switched off by the team for now. Please check back later."
        action={<Button variant="secondary" onClick={() => setActiveTab('home')}>Back to home</Button>}
      />
    );
  }

  if ((requireAuth || entitlement) && !user) {
    return (
      <Notice
        icon={<Lock />}
        title={`Sign in to use ${featureName}`}
        body="Create a free account to use all of LoveMate's AI tools. Your chats, saved items and plans stay private to you."
        action={
          <>
            <Button variant="secondary" onClick={() => openAuthModal('login')}>Sign in</Button>
            <Button onClick={() => openAuthModal('signup')}>Create account</Button>
          </>
        }
      />
    );
  }

  if (plan && !hasPlan(plan)) {
    const p = PLANS[plan];
    return (
      <Notice
        icon={<Sparkles />}
        title={`${featureName} is part of LoveMate ${p.name}`}
        body={
          plan === 'couple'
            ? `Couple unlocks ${featureName.toLowerCase()} and every other tool for you and your partner, with one payment of ₹${p.monthlyINR}/month.`
            : `Plus unlocks ${featureName.toLowerCase()} and unlimited AI tools for ₹${p.monthlyINR}/month (₹${p.yearlyINR} a year).`
        }
        action={
          <>
            <Button variant="secondary" onClick={() => setActiveTab('home')}>Not now</Button>
            <Button onClick={() => setProModalOpen(true)}>See plans</Button>
          </>
        }
      />
    );
  }

  if (entitlement && !canUseFeature(entitlement)) {
    return (
      <Notice
        icon={<Lock />}
        title={`${featureName} is a ${TIER_FOR[entitlement]} feature`}
        body={`Upgrade to the ${TIER_FOR[entitlement]} plan to unlock ${featureName.toLowerCase()} and everything below it.`}
        action={
          <>
            <Button variant="secondary" onClick={() => setActiveTab('home')}>Not now</Button>
            <Button onClick={() => setProModalOpen(true)}>See plans</Button>
          </>
        }
      />
    );
  }

  return <>{children}</>;
};
