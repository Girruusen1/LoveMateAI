import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useT } from '../../i18n';

export const NotificationsModal: React.FC = () => {
  const {
    notificationsModalOpen,
    setNotificationsModalOpen,
    notifications,
    markNotificationAsRead,
    dismissNotification,
    clearAllNotifications,
    proactiveSettings,
    updateProactiveSettings,
    setActiveTab,
  } = useApp();
  const { t } = useT();

  const [activeTab, setActiveTabInternal] = useState<'notifications' | 'settings'>('notifications');

  useEffect(() => {
    if (!notificationsModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNotificationsModalOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [notificationsModalOpen, setNotificationsModalOpen]);

  if (!notificationsModalOpen) return null;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-zinc-200 shadow-2xl space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" />
            <h3 className="text-base font-bold text-zinc-900">{t('Notifications & Alerts')}</h3>
            {unread > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">{t('{n} new', { n: unread })}</span>}
          </div>
          <button onClick={() => setNotificationsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg" aria-label={t('Close notifications')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTabInternal('notifications')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'notifications' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            {t('Activity Updates ({n})', { n: notifications.length })}
          </button>
          <button
            onClick={() => setActiveTabInternal('settings')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            {t('Frequency Settings')}
          </button>
        </div>

        {/* Notifications List */}
        {activeTab === 'notifications' && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-zinc-300" />
                <p className="font-semibold text-zinc-600">{t('No new notifications')}</p>
                <p>{t('We respect your space and only alert you for meaningful dates & prompts.')}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.actionTab) {
                      setActiveTab(notif.actionTab);
                      setNotificationsModalOpen(false);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    notif.isRead ? 'bg-zinc-50/70 border-zinc-200/80 opacity-70' : 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">{notif.title}</span>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-zinc-600 font-medium leading-relaxed">{notif.body}</p>
                    <span className="text-[10px] text-zinc-400 block pt-1">{notif.timestamp}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notif.id);
                    }}
                    className="p-1 text-zinc-300 hover:text-zinc-600 rounded"
                    title={t('Dismiss')}
                    aria-label={t('Dismiss notification: {title}', { title: notif.title })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}

            {notifications.length > 0 && (
              <div className="pt-2 text-right">
                <button onClick={clearAllNotifications} className="text-xs font-semibold text-zinc-400 hover:text-rose-600 transition-colors">
                  {t('Clear all notifications')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Frequency Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-800 uppercase tracking-wider mb-2">{t('Notification Frequency')}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['minimal', 'balanced', 'frequent', 'off'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => updateProactiveSettings({ frequency: freq })}
                    className={`p-3 rounded-xl border text-left font-semibold uppercase tracking-wider text-[11px] transition-all ${
                      proactiveSettings.frequency === freq ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {t(freq)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-zinc-800">{t('Important Date Reminders')}</span>
                <input type="checkbox" checked={proactiveSettings.dateReminders} onChange={(e) => updateProactiveSettings({ dateReminders: e.target.checked })} className="accent-rose-600 w-4 h-4" />
              </label>

              <label className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-zinc-800">{t('Couple Challenge Alerts')}</span>
                <input
                  type="checkbox"
                  checked={proactiveSettings.challengeReminders}
                  onChange={(e) => updateProactiveSettings({ challengeReminders: e.target.checked })}
                  className="accent-rose-600 w-4 h-4"
                />
              </label>

              <label className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-zinc-800">{t('Daily Connection Sparks')}</span>
                <input
                  type="checkbox"
                  checked={proactiveSettings.dailySuggestions}
                  onChange={(e) => updateProactiveSettings({ dailySuggestions: e.target.checked })}
                  className="accent-rose-600 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
