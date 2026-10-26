import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Flame,
  Heart,
  HelpCircle,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubscriptionTierV5 } from '../../types';

export const ProModal: React.FC = () => {
  const {
    proModalOpen,
    setProModalOpen,
    userSubscription,
    upgradeSubscription,
    cancelSubscription,
    formatCurrency,
    showToast,
    user,
    openAuthModal,
  } = useApp();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTierV5>(userSubscription.tier || 'premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  if (!proModalOpen) return null;

  const tiers: {
    id: SubscriptionTierV5;
    name: string;
    tagline: string;
    monthlyINR: number;
    yearlyINR: number;
    popular?: boolean;
    features: string[];
  }[] = [
    {
      id: 'free',
      name: 'Free Starter',
      tagline: 'Essential relationship wingman for everyday advice',
      monthlyINR: 0,
      yearlyINR: 0,
      features: [
        'AI Love Chat (15 messages/day)',
        'Basic Love Percentage Calculator',
        'Confession Studio (3 templates)',
        'Basic date generator',
      ],
    },
    {
      id: 'plus',
      name: 'LoveMate Plus',
      tagline: 'Deep personalization & conversational coaching',
      monthlyINR: 199,
      yearlyINR: 149,
      features: [
        'Unlimited AI Wingman Chat',
        'Advanced relationship memory',
        'Decode This Text Analyzer',
        'What Should I Reply? (All tones)',
        'Personal Relationship AI Profile',
      ],
    },
    {
      id: 'couple',
      name: 'LoveMate Couple',
      tagline: 'Synchronized space for you and your partner',
      monthlyINR: 349,
      yearlyINR: 279,
      features: [
        'Everything in Plus for TWO users',
        'Private Couple Room & Streaks',
        'Couple Calendar & Wishlist Sync',
        'Dedicated Couple AI (Shared space only)',
        'Relationship Growth Challenges',
      ],
    },
    {
      id: 'premium',
      name: 'LoveMate Premium',
      tagline: 'Autonomous relationship copilot & automation',
      monthlyINR: 499,
      yearlyINR: 399,
      popular: true,
      features: [
        'Everything in Couple & Plus',
        'Autonomous LoveMate Agent',
        'Relationship Autopilot (Quiet hours)',
        'Secret Surprise Mode Planner',
        'Experience Marketplace full library',
        'Zero ads, zero data tracking',
      ],
    },
  ];

  const handleSelectPlan = (tier: SubscriptionTierV5) => {
    if (!user) {
      // A plan belongs to an account.
      setProModalOpen(false);
      openAuthModal('signup');
      showToast('Create a free account first, then pick your plan.', 'info');
      return;
    }
    upgradeSubscription(tier);
    setProModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setProModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner */}
        <div className="p-6 pt-7 pb-5 bg-gradient-to-b from-rose-50/80 via-pink-50/30 to-white text-center border-b border-zinc-100 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            Plans
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Transparent, Honest Relationship Plans
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 font-medium">
            No dark patterns. No fake countdown timers. Cancel anytime in 1 click without hidden fees.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-zinc-100 p-1 rounded-xl mt-3.5 border border-zinc-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                billingCycle === 'yearly' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                SAVE 25%
              </span>
            </button>
          </div>
        </div>

        {/* Usage Meter Bar */}
        <div className="px-6 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-xs shrink-0">
          <span className="text-zinc-600 font-medium">
            Monthly AI Usage Meter: <strong>{userSubscription.aiRequestsUsedThisMonth}</strong> / {userSubscription.aiRequestsLimitMonthly} requests used
          </span>
          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
            Active Tier: {userSubscription.tier.toUpperCase()}
          </span>
        </div>

        {/* Tiers Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiers.map((t) => {
              const price = billingCycle === 'yearly' ? t.yearlyINR : t.monthlyINR;
              const isCurrent = !!user && userSubscription.tier === t.id;
              const isSelected = selectedTier === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-rose-50/40 border-rose-400 shadow-xs ring-2 ring-rose-200'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {t.popular && (
                    <span className="absolute -top-2.5 right-4 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-zinc-900">{t.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Current Plan
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium line-clamp-1">{t.tagline}</p>
                    <div className="pt-1">
                      <span className="text-2xl font-bold text-zinc-900">
                        {price === 0 ? 'Free' : formatCurrency(price)}
                      </span>
                      {price > 0 && <span className="text-xs text-zinc-500"> / month</span>}
                    </div>

                    <ul className="space-y-1.5 pt-2 border-t border-zinc-100">
                      {t.features.map((f, i) => (
                        <li key={i} className="text-xs text-zinc-700 flex items-start gap-1.5 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    disabled={isCurrent}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(t.id);
                    }}
                    className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-zinc-100 text-zinc-500 cursor-default'
                        : isSelected
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                        : 'bg-zinc-900 hover:bg-black text-white'
                    }`}
                  >
                    {isCurrent ? 'Current plan' : user ? `Switch to ${t.name}` : `Choose ${t.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Cancellation & Guarantee */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>14-day free trial on all paid plans. Cancel in 1 click anytime.</span>
          </div>
          {userSubscription.tier !== 'free' && !userSubscription.cancelAtPeriodEnd && (
            <button
              onClick={cancelSubscription}
              className="text-xs font-bold text-rose-600 hover:underline shrink-0"
            >
              Cancel Subscription
            </button>
          )}
          {userSubscription.cancelAtPeriodEnd && (
            <span className="text-xs font-bold text-amber-700">
              Cancellation scheduled at period end
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
