import React, { useState } from 'react';
import { Bell, BellRing, Globe, Mail, Moon, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Button, Card, PageContainer, PageHeader } from '../common/UIPrimitives';
import {
  NOTIFICATION_CATALOG,
  NOTIFICATION_TYPES,
  wantsChannel,
  type Channel,
  type NotificationCategory,
  type NotificationType,
} from '../../../shared/notifications';

const CATEGORIES: { id: NotificationCategory; title: string; description: string }[] = [
  { id: 'reminders', title: 'Reminders', description: 'Important dates and your daily streak.' },
  { id: 'partner', title: 'Partner', description: 'What happens in your shared couple space.' },
  { id: 'account', title: 'Account & payments', description: 'Your trial, plan and receipts.' },
];

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'inApp', label: 'Website' },
  { id: 'email', label: 'Email' },
  { id: 'browser', label: 'Browser' },
];

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function formatHour(h: number): string {
  const suffix = h < 12 ? 'AM' : 'PM';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} ${suffix}`;
}

/** Accessible on/off switch. */
const Switch: React.FC<{
  checked: boolean;
  onChange?: (on: boolean) => void;
  disabled?: boolean;
  label: string;
}> = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-1 ${
      checked ? 'bg-rose-600' : 'bg-zinc-300'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
    />
  </button>
);

const ChannelCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  status: React.ReactNode;
  children?: React.ReactNode;
}> = ({ icon, title, status, children }) => (
  <Card padding="sm" className="space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
        <h2 className="text-sm font-bold text-zinc-900">{title}</h2>
      </div>
      {status}
    </div>
    {children && <div className="text-xs text-zinc-600 leading-relaxed space-y-2">{children}</div>}
  </Card>
);

export const NotificationSettingsView: React.FC = () => {
  const {
    user,
    notificationPrefs,
    setQuietHours,
    browserNotifications,
    enableBrowserNotifications,
    emailNotificationsAvailable,
    sendTestNotificationEmail,
    showToast,
  } = useApp();

  const [sendingTest, setSendingTest] = useState(false);
  const [enablingBrowser, setEnablingBrowser] = useState(false);

  const handleTestEmail = async () => {
    setSendingTest(true);
    try {
      const res = await sendTestNotificationEmail();
      showToast(res.message || (res.ok ? `Test email sent to ${user?.email ?? 'your inbox'}.` : "We couldn't send the test email."), res.ok ? 'success' : 'info');
    } catch {
      showToast("We couldn't send the test email. Please try again.", 'info');
    } finally {
      setSendingTest(false);
    }
  };

  const handleEnableBrowser = async () => {
    setEnablingBrowser(true);
    try {
      const ok = await enableBrowserNotifications();
      if (ok) showToast('Browser pop-ups are on.', 'success');
    } finally {
      setEnablingBrowser(false);
    }
  };

  const quiet = notificationPrefs.quietHours;

  const browserStatus =
    browserNotifications === 'granted' ? (
      <Badge variant="emerald">On</Badge>
    ) : browserNotifications === 'denied' ? (
      <Badge variant="amber">Blocked</Badge>
    ) : browserNotifications === 'unsupported' ? (
      <Badge variant="zinc">Not available</Badge>
    ) : (
      <Badge variant="zinc">Off</Badge>
    );

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Bell />}
        title="Notification settings"
        subtitle="Choose what LoveMate tells you about, and where. Website notifications collect in the bell at the top of the page."
      />

      {/* Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChannelCard icon={<Globe />} title="On the website" status={<Badge variant="emerald">Always on</Badge>}>
          <p>Notifications appear in the bell while you use LoveMate.</p>
        </ChannelCard>

        <ChannelCard
          icon={<Mail />}
          title="Email"
          status={emailNotificationsAvailable ? <Badge variant="emerald">Ready</Badge> : <Badge variant="zinc">Not yet</Badge>}
        >
          <p className="break-all">
            Sent to <span className="font-semibold text-zinc-800">{user?.email || 'your account email'}</span>
          </p>
          {emailNotificationsAvailable ? (
            <Button variant="secondary" size="sm" icon={<Send className="w-3.5 h-3.5" />} loading={sendingTest} onClick={handleTestEmail}>
              Send test email
            </Button>
          ) : (
            <p className="text-zinc-400">Email sending isn't switched on for this site yet.</p>
          )}
        </ChannelCard>

        <ChannelCard icon={<BellRing />} title="Browser pop-ups" status={browserStatus}>
          {browserNotifications === 'granted' && <p>Pop-ups show on this device, even when LoveMate is in another tab.</p>}
          {browserNotifications === 'denied' && (
            <p>
              Pop-ups are blocked for this site. To allow them, click the lock or settings icon next to the web address, set
              Notifications to Allow, then reload the page.
            </p>
          )}
          {browserNotifications === 'default' && (
            <>
              <p>Get a pop-up on this device for reminders that matter.</p>
              <Button variant="primary" size="sm" icon={<BellRing className="w-3.5 h-3.5" />} loading={enablingBrowser} onClick={handleEnableBrowser}>
                Turn on
              </Button>
            </>
          )}
          {browserNotifications === 'unsupported' && (
            <p className="text-zinc-400">This browser doesn't support pop-up notifications. Website and email notifications still work.</p>
          )}
        </ChannelCard>
      </div>

      {/* Per-type preferences */}
      {CATEGORIES.map((cat) => {
        const types = NOTIFICATION_TYPES.filter((t) => NOTIFICATION_CATALOG[t].category === cat.id);
        if (types.length === 0) return null;
        return (
          <Card key={cat.id} padding="none">
            <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">{cat.title}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{cat.description}</p>
              </div>
              <div className="hidden sm:grid grid-cols-3 w-[240px] shrink-0 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400" aria-hidden="true">
                {CHANNELS.map((c) => (
                  <span key={c.id}>{c.label}</span>
                ))}
              </div>
            </div>
            <ul className="divide-y divide-zinc-100">
              {types.map((type) => (
                <PrefRow key={type} type={type} />
              ))}
            </ul>
          </Card>
        );
      })}

      {/* Quiet hours */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Moon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 id="quiet-hours-title" className="text-base font-bold text-zinc-900">
                Quiet hours
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                No emails or pop-ups during these hours (India time). Website notifications still collect.
              </p>
            </div>
          </div>
          <Switch
            checked={quiet.enabled}
            label="Quiet hours"
            onChange={(on) => setQuietHours({ ...quiet, enabled: on })}
          />
        </div>

        <div className={`grid grid-cols-2 gap-3 max-w-sm ${quiet.enabled ? '' : 'opacity-50'}`}>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-700 mb-1.5">From</span>
            <select
              value={quiet.start}
              disabled={!quiet.enabled}
              onChange={(e) => setQuietHours({ ...quiet, start: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 cursor-pointer disabled:cursor-not-allowed"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-700 mb-1.5">Until</span>
            <select
              value={quiet.end}
              disabled={!quiet.enabled}
              onChange={(e) => setQuietHours({ ...quiet, end: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 cursor-pointer disabled:cursor-not-allowed"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {quiet.enabled && quiet.start === quiet.end && (
          <p className="text-xs text-amber-700">Start and end are the same hour, so quiet hours have no effect.</p>
        )}
      </Card>
    </PageContainer>
  );
};

const PrefRow: React.FC<{ type: NotificationType }> = ({ type }) => {
  const { notificationPrefs, setNotificationChannel } = useApp();
  const entry = NOTIFICATION_CATALOG[type];

  return (
    <li className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900">{entry.label}</p>
        <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{entry.description}</p>
      </div>
      <div className="grid grid-cols-3 w-full sm:w-[240px] shrink-0">
        {CHANNELS.map((c) => {
          const name = `${entry.label}: ${c.label}`;
          let control: React.ReactNode;
          let note: string | null = null;
          if (c.id === 'email' && entry.noEmail) {
            control = (
              <span className="h-6 flex items-center text-zinc-400 text-sm" aria-label={`${name} not available`}>
                —
              </span>
            );
          } else if (c.id === 'email' && entry.emailRequired) {
            control = <Switch checked disabled label={`${name} (always sent)`} />;
            note = 'always sent';
          } else {
            control = (
              <Switch
                checked={wantsChannel(notificationPrefs, type, c.id)}
                label={name}
                onChange={(on) => setNotificationChannel(type, c.id, on)}
              />
            );
          }
          return (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-zinc-400" aria-hidden="true">
                {c.label}
              </span>
              {control}
              {note && <span className="text-[10px] text-zinc-400 leading-none">{note}</span>}
            </div>
          );
        })}
      </div>
    </li>
  );
};
