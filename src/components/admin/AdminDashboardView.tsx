import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Heart, LifeBuoy, Mail, RefreshCw, Send, Share2, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cloudEnabled } from '../../services/cloud';
import { loadAdminOverview, updateTicket, type AdminOverview } from '../../services/accountClient';
import { Badge, Button, Card, Chip, PageContainer, PageHeader, SectionHeading, Select, Textarea } from '../common/UIPrimitives';
import { MarketingPanel } from './MarketingPanel';

const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
const STATUS_LABEL: Record<string, string> = { open: 'Open', in_progress: 'In progress', waiting: 'Waiting for user', resolved: 'Resolved', closed: 'Closed' };
const statusVariant = (s: string) => (s === 'resolved' || s === 'closed' ? 'emerald' : s === 'in_progress' ? 'blue' : 'amber');
const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string }> = ({ icon, label, value, hint }) => (
  <Card className="space-y-1.5">
    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-rose-500">
      {icon}
      {label}
    </div>
    <p className="text-2xl font-bold text-zinc-900">{value}</p>
    {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
  </Card>
);

/** The team's real view of the business: accounts, paid plans and the support inbox (data from the server). */
export const AdminDashboardView: React.FC = () => {
  const { showToast, formatCurrency } = useApp();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [section, setSection] = useState<'overview' | 'marketing'>('overview');

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await loadAdminOverview();
    setLoading(false);
    if (r.ok && r.data) {
      setData(r.data);
      setError('');
    } else setError(r.message ?? 'Could not load the dashboard.');
  }, []);

  useEffect(() => {
    if (cloudEnabled) void refresh();
  }, [refresh]);

  const saveTicket = async (id: string, changes: { status?: string; reply?: string }) => {
    const r = await updateTicket(id, changes);
    if (!r.ok) return showToast(r.message ?? 'Could not update the ticket.', 'info');
    showToast(changes.reply ? (r.data?.emailed ? 'Reply sent and emailed to the user.' : 'Reply saved. (Email is not switched on, so only the app shows it.)') : 'Ticket updated.', 'success');
    setReplies((prev) => ({ ...prev, [id]: '' }));
    void refresh();
  };

  if (!cloudEnabled) {
    return (
      <PageContainer narrow>
        <Card className="text-center space-y-2 py-10">
          <h2 className="text-lg font-bold text-zinc-900">Admin needs real accounts</h2>
          <p className="text-sm text-zinc-500">Connect Supabase (VITE_SUPABASE_URL and the secret key on the server) to see real users, plans and tickets.</p>
        </Card>
      </PageContainer>
    );
  }

  const tickets = (data?.tickets ?? []).filter((t) => filter === 'all' || !['resolved', 'closed'].includes(t.status));

  return (
    <PageContainer>
      <PageHeader
        icon={<Users />}
        title="Admin dashboard"
        subtitle="Live numbers from your database. Only accounts listed in ADMIN_EMAILS on the server can open this page."
        actions={
          <Button variant="secondary" icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void refresh()}>
            Refresh
          </Button>
        }
      />

      <div className="flex gap-2">
        <Chip selected={section === 'overview'} onClick={() => setSection('overview')} icon={<Users />}>
          Overview
        </Chip>
        <Chip selected={section === 'marketing'} onClick={() => setSection('marketing')} icon={<Mail />}>
          Email marketing
        </Chip>
      </div>

      {section === 'marketing' && <MarketingPanel />}

      {section === 'overview' && error && <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</p>}

      {section === 'overview' && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={<Users />} label="Accounts" value={data.users.total} hint={`${data.users.new7d} new this week · ${data.users.new30d} this month`} />
            <Stat icon={<UserPlus />} label="Active this week" value={data.users.active7d} hint="Signed in during the last 7 days" />
            <Stat
              icon={<CreditCard />}
              label="Paying members"
              value={data.plans.plus + data.plans.couple}
              hint={`Plus ${data.plans.plus} · Couple ${data.plans.couple}${data.plans.cancelling ? ` · ${data.plans.cancelling} cancelling` : ''}${data.plans.failed ? ` · ${data.plans.failed} payment failed` : ''}`}
            />
            <Stat icon={<CreditCard />} label="Estimated monthly revenue" value={formatCurrency(data.plans.estimatedMonthlyRevenue)} hint="Yearly plans counted as 1/12 per month, before fees" />
            <Stat icon={<Heart />} label="Linked couples" value={data.couples} />
            <Stat icon={<Share2 />} label="Referrals" value={data.referrals.total} hint={`${data.referrals.last30d} in the last 30 days · ${data.plans.bonus} on free bonus days`} />
            <Stat icon={<Mail />} label="Emails sent (7 days)" value={data.emailsSent7d} />
            <Stat icon={<LifeBuoy />} label="Open tickets" value={data.tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length} />
          </div>

          <Card className="space-y-4">
            <SectionHeading
              title="Support inbox"
              description="Replies show in the user's Support page and are emailed to them."
              action={
                <Select value={filter} onChange={(e) => setFilter(e.target.value as 'open' | 'all')} aria-label="Show tickets">
                  <option value="open">Needs attention</option>
                  <option value="all">All tickets</option>
                </Select>
              }
            />
            {tickets.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center">No tickets here. 🎉</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 break-words">{t.subject}</p>
                        <p className="text-[11px] text-zinc-500 break-all">
                          {t.email} · {t.category.replace(/_/g, ' ')} · {date(t.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(t.status)}>{STATUS_LABEL[t.status] ?? t.status}</Badge>
                        <Select value={t.status} onChange={(e) => void saveTicket(t.id, { status: e.target.value })} aria-label="Ticket status">
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap break-words">{t.description}</p>
                    {t.reply && <p className="text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 whitespace-pre-wrap">Your reply: {t.reply}</p>}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Textarea
                        rows={2}
                        value={replies[t.id] ?? ''}
                        onChange={(e) => setReplies((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="Write a reply…"
                        className="flex-1"
                      />
                      <Button
                        icon={<Send className="w-4 h-4" />}
                        disabled={!(replies[t.id] ?? '').trim()}
                        onClick={() => void saveTicket(t.id, { reply: replies[t.id], status: 'resolved' })}
                      >
                        Send reply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <SectionHeading title="Newest accounts" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500">
                    <th className="py-2 pr-4 font-semibold">Email</th>
                    <th className="py-2 pr-4 font-semibold">Joined</th>
                    <th className="py-2 font-semibold">Last sign-in</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.recent.map((u) => (
                    <tr key={u.email} className="border-t border-zinc-100">
                      <td className="py-2 pr-4 text-zinc-800 break-all">{u.email}</td>
                      <td className="py-2 pr-4 text-zinc-600 whitespace-nowrap">{date(u.created_at)}</td>
                      <td className="py-2 text-zinc-600 whitespace-nowrap">{date(u.last_sign_in_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
};
