import React, { useState } from 'react';
import { Check, Shield, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useT } from '../../i18n';
import { BUCKET_LABEL, FREE_DAILY_LIMITS, PLAN_FEATURES, PLANS, TRIAL_DAYS, type Plan, type UsageBucket } from '../../utils/plans';

/* Plan names ("Plus", "Couple") stay as product names; taglines and feature lines are translated at render time. */
const TIERS: { id: Plan; tagline: string; popular?: boolean }[] = [
  { id: 'free', tagline: 'Try LoveMate every day, no card needed' },
  { id: 'plus', tagline: 'Every AI tool, unlimited, for you', popular: true },
  { id: 'couple', tagline: 'Everything for both partners, one payment' },
];

const USAGE_ORDER: UsageBucket[] = ['chat', 'decode', 'replies', 'confession'];

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
    plan,
    trialDaysLeft,
    planFromPartner,
    aiUsageToday,
    paymentsLive,
    paidSubscription,
    startPaidCheckout,
    cancelPaidPlan,
  } = useApp();
  const { t } = useT();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [busy, setBusy] = useState<Plan | null>(null);

  if (!proModalOpen) return null;

  const handleSelectPlan = (tier: Plan) => {
    if (!user) {
      // A plan belongs to an account.
      setProModalOpen(false);
      openAuthModal('signup');
      showToast(t('Create a free account first. New accounts get {days} days of Plus free.', { days: TRIAL_DAYS }), 'info');
      return;
    }
    if (tier !== 'free' && paymentsLive) {
      setBusy(tier);
      void startPaidCheckout(tier, billingCycle).then((ok) => {
        setBusy(null);
        if (ok) setProModalOpen(false);
      });
      return;
    }
    upgradeSubscription(tier);
    setProModalOpen(false);
  };

  const endDate = paidSubscription?.current_end
    ? new Date(paidSubscription.current_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  // The plan you pay for (a trial counts as Free here, so "Choose Plus" stays available).
  const paidPlan: Plan = trialDaysLeft !== null || planFromPartner ? 'free' : plan;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="plans-title">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-zinc-200 overflow-hidden relative my-4">
          <button
            onClick={() => setProModalOpen(false)}
            aria-label={t('Close')}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 pt-7 pb-5 bg-gradient-to-b from-rose-50/80 via-pink-50/30 to-white text-center border-b border-zinc-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              {t('Plans')}
            </div>
            <h2 id="plans-title" className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {t('Simple, honest plans')}
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 font-medium">
              {t('Start free. Every new account gets {days} days of Plus. Cancel anytime, no hidden fees.', { days: TRIAL_DAYS })}
            </p>

            <div className="inline-flex items-center bg-zinc-100 p-1 rounded-xl mt-3.5 border border-zinc-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  billingCycle === 'monthly' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {t('Monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  billingCycle === 'yearly' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <span>{t('Yearly')}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded-md">{t('SAVE 40%')}</span>
              </button>
            </div>
          </div>

          {/* Your plan today */}
          {user && (
            <div className="px-6 py-2.5 bg-zinc-50 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-zinc-600 font-medium">
                {plan === 'free'
                  ? t('Today: {usage}', { usage: USAGE_ORDER.map((b) => `${aiUsageToday[b]}/${FREE_DAILY_LIMITS[b]} ${t(BUCKET_LABEL[b])}`).join(' · ') })
                  : t('Unlimited AI tools')}
              </span>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                {trialDaysLeft !== null
                  ? t('Plus trial · {n} days left', { n: trialDaysLeft })
                  : planFromPartner
                    ? t('Couple · paid by your partner')
                    : t('Your plan: {plan}', { plan: PLANS[plan].name })}
              </span>
            </div>
          )}

          {/* Plans */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIERS.map((tier) => {
                const p = PLANS[tier.id];
                const perMonth = billingCycle === 'yearly' ? Math.round(p.yearlyINR / 12) : p.monthlyINR;
                const isCurrent = !!user && paidPlan === tier.id;

                return (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between relative ${
                      tier.popular ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-200' : 'bg-white border-zinc-200'
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2.5 right-4 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                        {t('Most popular')}
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-zinc-900">LoveMate {p.name}</h3>
                        {isCurrent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">{t('Current')}</span>}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium">{t(tier.tagline)}</p>
                      <div className="pt-1">
                        <span className="text-2xl font-bold text-zinc-900">{perMonth === 0 ? t('Free') : formatCurrency(perMonth)}</span>
                        {perMonth > 0 && <span className="text-xs text-zinc-500"> {t('/ month')}</span>}
                        {perMonth > 0 && billingCycle === 'yearly' && (
                          <p className="text-[11px] text-zinc-500">{t('{price} billed once a year', { price: formatCurrency(p.yearlyINR) })}</p>
                        )}
                      </div>

                      <ul className="space-y-1.5 pt-2 border-t border-zinc-100">
                        {PLAN_FEATURES[tier.id].map((f) => (
                          <li key={f} className="text-xs text-zinc-700 flex items-start gap-1.5 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{t(f)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {tier.id !== 'free' && (
                      <button
                        disabled={isCurrent || busy !== null}
                        onClick={() => handleSelectPlan(tier.id)}
                        className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-zinc-100 text-zinc-500 cursor-default'
                            : tier.popular
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                              : 'bg-zinc-900 hover:bg-black text-white'
                        }`}
                      >
                        {isCurrent ? t('Current plan') : busy === tier.id ? t('Opening secure checkout…') : t('Choose {plan}', { plan: p.name })}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {paymentsLive
                  ? t('Secure payments by Razorpay: UPI, cards and netbanking. Renews automatically; cancel anytime.')
                  : t("Payments aren't live yet: during the beta, choosing a plan is free.")}
              </span>
            </div>
            {paymentsLive ? (
              paidSubscription && paidSubscription.status === 'prepaid' ? (
                <span className="text-xs font-bold text-emerald-700">{endDate ? t('Paid until {date}', { date: endDate }) : t('Paid')}</span>
              ) : paidSubscription && paidSubscription.status === 'cancelling' ? (
                <span className="text-xs font-bold text-amber-700">
                  {t('Renewal off')}
                  {endDate ? ` · ${t('active until {date}', { date: endDate })}` : ''}
                </span>
              ) : (
                paidSubscription &&
                paidSubscription.status === 'active' && (
                  <div className="flex items-center gap-3 shrink-0">
                    {endDate && <span className="text-xs text-zinc-500">{t('Renews {date}', { date: endDate })}</span>}
                    <button
                      onClick={() => {
                        if (window.confirm(t('Stop automatic renewal? Your plan stays active until the end of the paid period.'))) void cancelPaidPlan();
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      {t('Cancel renewal')}
                    </button>
                  </div>
                )
              )
            ) : (
              <>
                {paidPlan !== 'free' && !userSubscription.cancelAtPeriodEnd && (
                  <button onClick={cancelSubscription} className="text-xs font-bold text-rose-600 hover:underline shrink-0">
                    {t('Cancel plan')}
                  </button>
                )}
                {userSubscription.cancelAtPeriodEnd && <span className="text-xs font-bold text-amber-700">{t('Cancellation scheduled at period end')}</span>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
