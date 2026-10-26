import React from 'react';
import { Bell, CalendarHeart, CreditCard, Flame, Heart, Settings, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SmartNotification } from '../../types';

const TYPE_ICON: Record<SmartNotification['type'], { icon: React.ReactNode; className: string }> = {
  date: { icon: <CalendarHeart className="w-4 h-4" />, className: 'bg-rose-50 text-rose-600 border-rose-100' },
  partner: { icon: <Heart className="w-4 h-4" />, className: 'bg-pink-50 text-pink-600 border-pink-100' },
  account: { icon: <CreditCard className="w-4 h-4" />, className: 'bg-blue-50 text-blue-600 border-blue-100' },
  challenge: { icon: <Flame className="w-4 h-4" />, className: 'bg-amber-50 text-amber-600 border-amber-100' },
  memory: { icon: <Sparkles className="w-4 h-4" />, className: 'bg-purple-50 text-purple-600 border-purple-100' },
  suggestion: { icon: <Sparkles className="w-4 h-4" />, className: 'bg-purple-50 text-purple-600 border-purple-100' },
};

export const NotificationsModal: React.FC = () => {
  const {
    notificationsModalOpen,
    setNotificationsModalOpen,
    notifications,
    markNotificationAsRead,
    dismissNotification,
    clearAllNotifications,
    setActiveTab,
  } = useApp();

  if (!notificationsModalOpen) return null;

  const unread = notifications.filter((n) => !n.isRead).length;
  const close = () => setNotificationsModalOpen(false);

  const openSettings = () => {
    close();
    setActiveTab('notification-settings');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <div
        className="min-h-full flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 border border-zinc-200 shadow-2xl space-y-4 my-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 text-rose-500 shrink-0" />
              <h3 id="notifications-title" className="text-base font-bold text-zinc-900">
                Notifications
              </h3>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={openSettings}
                aria-label="Notification settings"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Notification settings</span>
                <span className="sm:hidden" aria-hidden="true">Settings</span>
              </button>
              <button onClick={close} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg" aria-label="Close notifications">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 mx-auto flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-700">No notifications yet.</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  We'll let you know about your important dates, your partner and your plan.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {notifications.map((notif) => {
                  const icon = TYPE_ICON[notif.type] ?? TYPE_ICON.suggestion;
                  const open = () => {
                    markNotificationAsRead(notif.id);
                    if (notif.actionTab) {
                      setActiveTab(notif.actionTab);
                      close();
                    }
                  };
                  return (
                    <li
                      key={notif.id}
                      className={`rounded-2xl border transition-all flex items-start gap-3 p-3.5 ${
                        notif.isRead ? 'bg-zinc-50/70 border-zinc-200/80' : 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50 shadow-2xs'
                      }`}
                    >
                      <button type="button" onClick={open} className="flex items-start gap-3 flex-1 min-w-0 text-left cursor-pointer">
                        <span className={`w-8 h-8 shrink-0 rounded-xl border flex items-center justify-center ${icon.className} ${notif.isRead ? 'opacity-70' : ''}`}>
                          {icon.icon}
                        </span>
                        <span className="min-w-0 space-y-0.5 block">
                          <span className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${notif.isRead ? 'text-zinc-600' : 'text-zinc-900'}`}>{notif.title}</span>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" aria-label="Unread" />}
                          </span>
                          <span className={`block text-xs leading-relaxed ${notif.isRead ? 'text-zinc-500' : 'text-zinc-600'}`}>{notif.body}</span>
                          <span className="text-[10px] text-zinc-400 block pt-0.5">{notif.timestamp}</span>
                        </span>
                      </button>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="p-1 text-zinc-300 hover:text-zinc-600 rounded shrink-0"
                        title="Dismiss"
                        aria-label={`Dismiss notification: ${notif.title}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {notifications.length > 0 && (
              <div className="pt-1 flex items-center justify-between gap-3">
                {unread > 0 ? (
                  <button
                    onClick={() => notifications.filter((n) => !n.isRead).forEach((n) => markNotificationAsRead(n.id))}
                    className="text-xs font-semibold text-zinc-500 hover:text-rose-600 transition-colors"
                  >
                    Mark all as read
                  </button>
                ) : (
                  <span />
                )}
                <button onClick={clearAllNotifications} className="text-xs font-semibold text-zinc-400 hover:text-rose-600 transition-colors">
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
