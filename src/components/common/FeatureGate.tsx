import React from 'react';
import { Lock, ShieldAlert, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EntitlementFeature, FeatureFlags } from '../../types';
import { Button, PageContainer } from './UIPrimitives';

interface FeatureGateProps {
  /** Plan entitlement required to use this page */
  entitlement?: EntitlementFeature;
  /** Admin feature flag that must be on */
  flag?: keyof FeatureFlags;
  /** Only admins may open this page */
  adminOnly?: boolean;
  /** Signed-in users only */
  requireAuth?: boolean;
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
  agent_autonomous: 'Premium',
  autopilot: 'Premium',
  unlimited_plans: 'Premium',
};

/** Wraps a page and shows an explanatory card instead when the user may not use it. */
export const FeatureGate: React.FC<FeatureGateProps> = ({ entitlement, flag, adminOnly, requireAuth, featureName, children }) => {
  const { user, isAdmin, canUseFeature, featureFlags, setProModalOpen, openAuthModal, setActiveTab } = useApp();

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
        body="Your saved items, memories and plans are tied to your account."
        action={
          <>
            <Button variant="secondary" onClick={() => openAuthModal('login')}>Sign in</Button>
            <Button onClick={() => openAuthModal('signup')}>Create account</Button>
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
