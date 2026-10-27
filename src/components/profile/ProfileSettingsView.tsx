import React, { useState } from 'react';
import { Award, Bell, ChevronRight, Check, Flame, Heart, LogOut, Shield, Sparkles, Trash2, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageSwitch, useT } from '../../i18n';
import { Language } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';

export const ProfileSettingsView: React.FC = () => {
  const {
    user,
    badges,
    aiMemoryEnabled,
    setAiMemoryEnabled,
    memories,
    addMemory,
    deleteMemory,
    clearMemories,
    updateUserPreferences,
    setProModalOpen,
    logout,
    deleteAccount,
    showToast,
    plan,
    setActiveTab,
  } = useApp();
  const { t } = useT();

  const isPro = plan !== 'free';

  const [newMemoryText, setNewMemoryText] = useState('');
  const [editingName, setEditingName] = useState(user?.name || '');
  const [editingLanguage, setEditingLanguage] = useState<Language>(user?.preferredLanguage || 'hinglish');
  const [editingVibe, setEditingVibe] = useState(user?.vibe || 'Romantic & Playful');

  const [editingPhone, setEditingPhone] = useState(user?.phone ?? '');
  const [editingWhatsapp, setEditingWhatsapp] = useState(!!user?.whatsappOptIn);
  // Indian mobile number: 10 digits starting 6-9, with or without +91 / spaces.
  const phoneDigits = editingPhone.replace(/[\s-]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0)/, '');
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPhone.trim() && !phoneValid) {
      showToast(t('Please enter a valid 10-digit Indian mobile number, or leave it empty.'), 'info');
      return;
    }
    updateUserPreferences({
      name: editingName,
      preferredLanguage: editingLanguage,
      vibe: editingVibe,
      phone: editingPhone.trim() ? '+91' + phoneDigits : undefined,
      whatsappOptIn: editingPhone.trim() ? editingWhatsapp : false,
    });
  };

  const handleAddCustomMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    addMemory(newMemoryText.trim(), 'preference');
    setNewMemoryText('');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-rose-500 text-white flex items-center justify-center font-bold text-2xl overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{user.name}</h1>
              {isPro ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  {plan.toUpperCase()}
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  {t('Free Plan')}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {t('{n} Day Streak', { n: user.streak })}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {t('{n} Love Points', { n: user.points })}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {t(user.vibe)}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade / Pro Status action */}
        {!isPro ? (
          <button
            onClick={() => setProModalOpen(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>{t('Upgrade to Pro')}</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 shrink-0">
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>{t('Pro Active')}</span>
          </div>
        )}
      </div>

      {/* 2. GAMIFICATION & BADGES SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              {t('Achievements & Badges')}
            </h2>
            <p className="text-xs text-zinc-500">{t('Earn badges through emotional check-ins, tools, and streaks')}</p>
          </div>
          <span className="text-xs font-bold text-zinc-700">{t('{a} / {b} Unlocked', { a: badges.filter((b) => b.unlocked).length, b: badges.length })}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                b.unlocked
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-zinc-50/60 border-zinc-200/60 opacity-60'
              }`}
            >
              <div>
                <span className="text-2xl mb-1.5 block">{b.unlocked ? '🏆' : '🔒'}</span>
                <h4 className="text-xs font-bold text-zinc-900">{b.title}</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{b.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-200/40 text-[10px] font-semibold text-zinc-500">
                {b.unlocked ? t('Unlocked {date}', { date: b.unlockedAt || '' }) : t('Locked')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. AI MEMORY MANAGER (Requirement 37) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                {t('AI Memory Center')}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {t('Privacy-First')}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {t('Control what LoveMate AI remembers about your preferences, crushes, and relationship stage.')}
            </p>
          </div>

          {/* Toggle AI Memory */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-700">
              {aiMemoryEnabled ? t('Memory Enabled') : t('Memory Disabled')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={aiMemoryEnabled}
              onClick={() => {
                setAiMemoryEnabled(!aiMemoryEnabled);
                showToast(aiMemoryEnabled ? t('AI Memory disabled') : t('AI Memory enabled'), 'info');
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                aiMemoryEnabled ? 'bg-rose-600' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  aiMemoryEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Stored facts list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700">{t('Remembered Facts ({n})', { n: memories.length })}</span>
            {memories.length > 0 && (
              <button
                onClick={clearMemories}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                {t('Clear all memory')}
              </button>
            )}
          </div>

          {memories.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-medium text-zinc-800">{m.fact}</span>
                  </div>
                  <button
                    onClick={() => deleteMemory(m.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                    title={t('Delete memory')}
                    aria-label={t('Delete memory')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600 py-2">{t('No active memories stored.')}</p>
          )}

          {/* Add custom memory */}
          <form onSubmit={handleAddCustomMemory} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder={t("Tell AI to remember something (e.g., 'My crush likes iced matcha latte')")}
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden text-zinc-900"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {t('Add Memory')}
            </button>
          </form>
        </div>
      </div>

      {/* 4. PREFERENCES & EDIT PROFILE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-zinc-900">{t('Personal Preferences')}</h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">{t('Your Name')}</label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">{t('Chat Language')}</label>
              <select
                value={editingLanguage}
                onChange={(e) => setEditingLanguage(e.target.value as Language)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-semibold focus:outline-hidden"
              >
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
                <option value="roman_hindi">{t('Roman Hindi')}</option>
                <option value="hindi">{t('Hindi (Devanagari)')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">{t('Dating Vibe')}</label>
              <input
                type="text"
                value={editingVibe}
                onChange={(e) => setEditingVibe(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="profile-phone" className="block text-xs font-bold text-zinc-700 mb-1">
                {t('Mobile number')} <span className="font-normal text-zinc-400">{t('(optional)')}</span>
              </label>
              <input
                id="profile-phone"
                type="tel"
                inputMode="numeric"
                value={editingPhone}
                onChange={(e) => setEditingPhone(e.target.value.replace(/[^\d\s+-]/g, '').slice(0, 16))}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-semibold focus:outline-hidden"
              />
              <label className="mt-2 flex items-start gap-2 text-[11px] text-zinc-600">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-rose-600"
                  checked={editingWhatsapp && phoneValid}
                  disabled={!phoneValid}
                  onChange={(e) => setEditingWhatsapp(e.target.checked)}
                />
                <span>{t('Send me reminders on WhatsApp. You can turn this off anytime.')}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {t('Save Preferences')}
            </button>
          </div>
        </form>

        {/* Interface language + theme: applied instantly, no save needed */}
        <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <span className="text-xs font-bold text-zinc-700">{t('Interface language')}</span>
            <LanguageSwitch />
          </div>
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <span className="text-xs font-bold text-zinc-700">{t('Theme')}</span>
            <ThemeToggle showLabels />
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <button
        type="button"
        onClick={() => setActiveTab('notification-settings')}
        className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/90 shadow-xs flex items-center gap-4 text-left hover:border-rose-200 transition-colors"
      >
        <span className="w-10 h-10 shrink-0 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
          <Bell className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-base font-bold text-zinc-900">{t('Notifications')}</span>
          <span className="block text-xs text-zinc-500 mt-0.5">{t('Choose reminders by website, email or browser pop-up, and set quiet hours.')}</span>
        </span>
        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>

      {/* 5. PRIVACY, DATA & SECURITY (Requirement 26) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          {t('Privacy & Account Controls')}
        </h2>
        <p className="text-xs text-zinc-500">{t('You are always in complete control of your emotional data. We do not sell your personal chats.')}</p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('Sign Out')}</span>
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  t('Are you sure you want to delete your LoveMate account and erase all saved confessions, conversations, and memories? This action cannot be undone.')
                )
              ) {
                deleteAccount();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('Delete Account & Erase All Data')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
