import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck, MessageCircle, RefreshCw, Send, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { loadWhatsApp, sendWhatsApp, type WhatsAppDeliveryStatus, type WhatsAppMessageRow, type WhatsAppOverview, type WhatsAppSendResult } from '../../services/accountClient';
import { Badge, Button, Card, Chip, SectionHeading, Select, Textarea } from '../common/UIPrimitives';

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
const prettyPhone = (digits: string) => (digits.startsWith('91') && digits.length === 12 ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}` : `+${digits}`);

const STATUS_LABEL: Record<WhatsAppDeliveryStatus, string> = { sent: 'Sent, not opened', delivered: 'Delivered, not opened', read: 'Read', failed: 'Failed' };
const statusVariant = (s: WhatsAppDeliveryStatus) => (s === 'read' ? 'emerald' : s === 'delivered' ? 'blue' : s === 'failed' ? 'rose' : 'amber');
const StatusIcon: React.FC<{ s: WhatsAppDeliveryStatus }> = ({ s }) =>
  s === 'read' ? <CheckCheck className="w-4 h-4 text-sky-500" /> : s === 'delivered' ? <CheckCheck className="w-4 h-4 text-zinc-400" /> : s === 'failed' ? <XCircle className="w-4 h-4 text-rose-500" /> : <Check className="w-4 h-4 text-zinc-400" />;

const RESULT_LABEL: Record<WhatsAppSendResult['status'], string> = { sent: 'Sent', invalid: 'Not a phone number', duplicate: 'Repeated in the list, skipped', failed: 'Failed' };
const resultVariant = (s: WhatsAppSendResult['status']) => (s === 'sent' ? 'emerald' : s === 'duplicate' ? 'amber' : 'rose');

const LANGUAGE_LABEL: Record<string, string> = { en_US: 'English', hi: 'Hinglish' };
type Filter = 'all' | 'read' | 'unread' | 'failed';

/**
 * Send an approved WhatsApp template to a list of numbers and watch who received and opened it.
 * Receipts (delivered / read) arrive through the Researchers App webhook, which forwards them here.
 */
export const WhatsAppPanel: React.FC = () => {
  const { showToast } = useApp();
  const [data, setData] = useState<WhatsAppOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('');
  const [language, setLanguage] = useState('hi');
  const [raw, setRaw] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<WhatsAppSendResult[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await loadWhatsApp();
    setLoading(false);
    if (r.ok && r.data) {
      setData(r.data);
      setError('');
      setTemplate((cur) => cur || r.data!.templates[0]?.name || '');
    } else setError(r.message ?? 'Could not load WhatsApp messages.');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Receipts come in on their own; keep the list fresh while the page is open.
  useEffect(() => {
    const t = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  const lines = useMemo(() => raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean), [raw]);
  const chosen = data?.templates.find((t) => t.name === template);
  const languages = chosen?.languages ?? ['en_US', 'hi'];

  const doSend = async () => {
    if (!template || !lines.length) return;
    setSending(true);
    setResults(null);
    const r = await sendWhatsApp(template, language, lines);
    setSending(false);
    if (r.ok && r.data) {
      setResults(r.data.results);
      showToast(r.data.sent ? `Sent to ${r.data.sent} ${r.data.sent === 1 ? 'number' : 'numbers'}.` : 'Nothing was sent.', r.data.sent ? 'success' : 'info');
      setRaw('');
      void refresh();
    } else showToast(r.message ?? 'Sending failed.', 'info');
  };

  const messages: WhatsAppMessageRow[] = (data?.messages ?? []).filter((m) =>
    filter === 'all' ? true : filter === 'read' ? m.status === 'read' : filter === 'failed' ? m.status === 'failed' : m.status === 'sent' || m.status === 'delivered',
  );
  const counts = data?.counts;
  const unread = counts ? counts.sent + counts.delivered : 0;

  return (
    <div className="space-y-6">
      {error && <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</p>}
      {data && !data.enabled && (
        <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Sending is off on this server: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID. The list below still works.
        </p>
      )}
      {data && data.enabled && !data.receiptsEnabled && (
        <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Read receipts are off: set WHATSAPP_STATUS_SECRET here and the same value on the Researchers App server, which owns the number's webhook.
        </p>
      )}

      {counts && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="space-y-1"><p className="text-xs font-semibold text-zinc-500">Sent in total</p><p className="text-2xl font-bold text-zinc-900">{counts.total}</p></Card>
          <Card className="space-y-1"><p className="text-xs font-semibold text-zinc-500">Read</p><p className="text-2xl font-bold text-emerald-600">{counts.read}</p></Card>
          <Card className="space-y-1"><p className="text-xs font-semibold text-zinc-500">Not opened yet</p><p className="text-2xl font-bold text-amber-600">{unread}</p></Card>
          <Card className="space-y-1"><p className="text-xs font-semibold text-zinc-500">Failed</p><p className="text-2xl font-bold text-rose-600">{counts.failed}</p></Card>
        </div>
      )}

      <Card className="space-y-4">
        <SectionHeading title="Send a template" description="One person per line: name and number, for example “Pooja, +91 79875 14313”. Indian numbers without a code get +91." />
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Template</span>
            <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {(data?.templates ?? []).map((t) => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </Select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Language</span>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {languages.map((l) => (
                <option key={l} value={l}>{LANGUAGE_LABEL[l] ?? l}</option>
              ))}
            </Select>
          </label>
        </div>
        <Textarea rows={5} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'Pooja, +91 79875 14313\nRahul, 9876543210'} />
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<Send className="w-4 h-4" />} onClick={() => void doSend()} disabled={!template || !lines.length || sending || !data?.enabled}>
            {sending ? 'Sending…' : `Send to ${lines.length || 0}`}
          </Button>
          <span className="text-xs text-zinc-500">Meta bills each marketing message, about ₹0.80 in India. Only message people who agreed to hear from LoveMate.</span>
        </div>
        {results && (
          <ul className="divide-y divide-zinc-100 text-sm">
            {results.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate">{r.name ? `${r.name} · ` : ''}{r.phone ? prettyPhone(r.phone) : r.input}</span>
                <span className="flex items-center gap-2 shrink-0">
                  {r.error && <span className="text-xs text-rose-600 max-w-[16rem] truncate" title={r.error}>{r.error}</span>}
                  <Badge variant={resultVariant(r.status)}>{RESULT_LABEL[r.status]}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading title="Who opened it" description="One grey tick: sent. Two grey: delivered to the phone. Two blue: read." />
          <Button variant="secondary" icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
          <Chip selected={filter === 'read'} onClick={() => setFilter('read')}>Read</Chip>
          <Chip selected={filter === 'unread'} onClick={() => setFilter('unread')}>Not opened</Chip>
          <Chip selected={filter === 'failed'} onClick={() => setFilter('failed')}>Failed</Chip>
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">No messages here yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-2 pr-3">Person</th>
                  <th className="py-2 pr-3">Template</th>
                  <th className="py-2 pr-3">Sent</th>
                  <th className="py-2 pr-3">Delivered</th>
                  <th className="py-2 pr-3">Read</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-3">
                      <div className="font-medium text-zinc-900">{m.name}</div>
                      <div className="text-xs text-zinc-500">{prettyPhone(m.phone)}</div>
                    </td>
                    <td className="py-2 pr-3 text-zinc-600">{m.template.replace('lovemate_intro_', 'intro ')} · {LANGUAGE_LABEL[m.language] ?? m.language}</td>
                    <td className="py-2 pr-3 text-zinc-600 whitespace-nowrap">{when(m.sentAt)}</td>
                    <td className="py-2 pr-3 text-zinc-600 whitespace-nowrap">{when(m.deliveredAt)}</td>
                    <td className="py-2 pr-3 text-zinc-600 whitespace-nowrap">{when(m.readAt)}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusIcon s={m.status} />
                        <Badge variant={statusVariant(m.status)}>{STATUS_LABEL[m.status]}</Badge>
                      </span>
                      {m.error && <div className="text-xs text-rose-600 mt-1 max-w-[18rem]">{m.error}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
