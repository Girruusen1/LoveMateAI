import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Monitor, RefreshCw, Send, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { loadMarketing, previewMarketing, sendMarketing, type MarketingOverview, type MarketingSendResult } from '../../services/accountClient';
import { Badge, Button, Card, Chip, SectionHeading, Textarea } from '../common/UIPrimitives';

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

/** One recipient per line: "priya@x.com", "Priya <priya@x.com>" or "priya@x.com, Priya". Commas between plain emails also work. */
function splitRecipients(raw: string): string[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    // A line with several plain emails separated by commas/spaces/semicolons.
    const pieces = line.split(/[,;\s]+/).filter(Boolean);
    if (pieces.length > 1 && pieces.every((p) => EMAIL_RE.test(p))) out.push(...pieces);
    else out.push(line);
  }
  return out;
}
const looksValid = (line: string) => EMAIL_RE.test(line) || /<[^>]+@[^>]+>/.test(line) || line.split(/[,;\t]+/).some((p) => EMAIL_RE.test(p.trim()));

const STATUS_LABEL: Record<MarketingSendResult['status'], string> = {
  sent: 'Sent',
  invalid: 'Not an email address',
  unsubscribed: 'Unsubscribed, skipped',
  already_sent: 'Already got this email, skipped',
  duplicate: 'Repeated in the list, skipped',
  failed: 'Failed',
};
const statusVariant = (s: MarketingSendResult['status']) => (s === 'sent' ? 'emerald' : s === 'failed' || s === 'invalid' ? 'rose' : 'amber');
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Pick a template, paste addresses, preview, send. Everything goes through the server, which keeps the send log. */
export const MarketingPanel: React.FC = () => {
  const { user, showToast } = useApp();
  const [data, setData] = useState<MarketingOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [raw, setRaw] = useState('');
  const [sending, setSending] = useState<'test' | 'all' | null>(null);
  const [results, setResults] = useState<MarketingSendResult[] | null>(null);
  const [force, setForce] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await loadMarketing();
    setLoading(false);
    if (r.ok && r.data) {
      setData(r.data);
      setError('');
      setTemplateId((cur) => cur || r.data!.templates[0]?.id || '');
    } else setError(r.message ?? 'Could not load marketing.');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!templateId) return;
    let alive = true;
    void previewMarketing(templateId).then((h) => alive && setPreviewHtml(h ?? '<p style="font-family:sans-serif;padding:24px">Preview failed to load.</p>'));
    return () => {
      alive = false;
    };
  }, [templateId]);

  const selectTemplate = (id: string) => {
    if (id === templateId) return;
    setPreviewHtml('');
    setTemplateId(id);
  };

  const template = data?.templates.find((t) => t.id === templateId) ?? null;
  const recipients = useMemo(() => splitRecipients(raw), [raw]);
  const validCount = recipients.filter(looksValid).length;
  const invalidCount = recipients.length - validCount;

  const send = async (test: boolean) => {
    if (!template) return;
    const list = test ? [user?.email ?? ''] : recipients;
    if (!test && !window.confirm(`Send "${template.name}" to ${validCount} ${validCount === 1 ? 'person' : 'people'}?`)) return;
    setSending(test ? 'test' : 'all');
    const r = await sendMarketing(template.id, list, { test, force: !test && force });
    setSending(null);
    if (!r.ok || !r.data) return showToast(r.message ?? 'Could not send.', 'info');
    setResults(r.data.results);
    showToast(test ? `Test sent to ${user?.email}.` : `Sent to ${r.data.sent} ${r.data.sent === 1 ? 'person' : 'people'}.`, 'success');
    if (!test) void refresh();
  };

  if (error) return <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="text-sm text-zinc-500 py-6 text-center">Loading…</p>;

  return (
    <div className="space-y-4">
      {!data.emailEnabled && <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">Email sending is off on this server (SMTP_USER / SMTP_PASS). You can preview, but not send.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ---------------- left: template + recipients */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="space-y-3">
            <SectionHeading
              title="1. Choose a template"
              description={`${data.totalSent} marketing emails sent so far · ${data.unsubscribed} unsubscribed`}
              action={
                <Button variant="ghost" size="sm" icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void refresh()} aria-label="Refresh" />
              }
            />
            <div className="space-y-2">
              {data.templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-colors ${t.id === templateId ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-100' : 'border-zinc-200 bg-white hover:border-rose-300'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-zinc-900">{t.name}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={t.language === 'hinglish' ? 'amber' : 'blue'}>{t.language === 'hinglish' ? 'Hinglish' : 'English'}</Badge>
                      {t.sentCount > 0 && <Badge variant="zinc">{t.sentCount} sent</Badge>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-700 truncate">Subject: {t.subject}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">{t.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <SectionHeading title="2. Add email addresses" description="One per line. “Priya <priya@gmail.com>” adds a name to the greeting." />
            <Textarea rows={7} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'priya@gmail.com\nArjun <arjun@gmail.com>\nrahul@gmail.com, Rahul'} />
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
              <Badge variant={validCount ? 'emerald' : 'zinc'}>{validCount} ready</Badge>
              {invalidCount > 0 && <Badge variant="rose">{invalidCount} not valid</Badge>}
              <label className="ml-auto inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="accent-rose-600" checked={force} onChange={(e) => setForce(e.target.checked)} />
                Send again to people who already got this template
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="secondary" icon={<Mail className="w-4 h-4" />} loading={sending === 'test'} disabled={!template || !data.emailEnabled || !!sending} onClick={() => void send(true)}>
                Send test to me
              </Button>
              <Button icon={<Send className="w-4 h-4" />} loading={sending === 'all'} disabled={!template || !data.emailEnabled || !validCount || !!sending} onClick={() => void send(false)} className="flex-1">
                Send to {validCount} {validCount === 1 ? 'person' : 'people'}
              </Button>
            </div>
            <p className="text-[11px] text-zinc-500">Brevo's free plan allows 300 emails a day. Unsubscribed people are always skipped, and nobody gets the same template twice unless you tick the box.</p>
          </Card>

          {results && (
            <Card className="space-y-2">
              <SectionHeading title="Result" description={`${results.filter((r) => r.status === 'sent').length} of ${results.length} sent`} />
              <ul className="divide-y divide-zinc-100 text-sm">
                {results.map((r, i) => (
                  <li key={`${r.input}-${i}`} className="py-2 flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-zinc-800 break-all">{r.email ?? r.input}</span>
                      {r.error && <span className="block text-[11px] text-rose-600 break-words">{r.error}</span>}
                    </span>
                    <Badge variant={statusVariant(r.status)}>{STATUS_LABEL[r.status]}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* ---------------- right: preview */}
        <Card className="lg:col-span-3 space-y-3 lg:sticky lg:top-20 self-start">
          <SectionHeading
            title="3. Preview"
            description={template ? `Subject: ${template.subject}` : undefined}
            action={
              <div className="flex gap-1.5">
                <Chip selected={device === 'desktop'} onClick={() => setDevice('desktop')} icon={<Monitor />}>
                  Desktop
                </Chip>
                <Chip selected={device === 'mobile'} onClick={() => setDevice('mobile')} icon={<Smartphone />}>
                  Phone
                </Chip>
              </div>
            }
          />
          <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-3 flex justify-center overflow-hidden">
            {previewHtml ? (
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                sandbox=""
                className="bg-white rounded-xl border border-zinc-200 transition-all"
                style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: '100%', height: device === 'mobile' ? 700 : 820 }}
              />
            ) : (
              <div className="h-[520px] w-full flex items-center justify-center text-sm text-zinc-500">Loading preview…</div>
            )}
          </div>
        </Card>
      </div>

      {data.recent.length > 0 && (
        <Card className="space-y-3">
          <SectionHeading title="Recently sent" description="Newest first. Tests are marked." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="py-2 pr-4 font-semibold">Email</th>
                  <th className="py-2 pr-4 font-semibold">Template</th>
                  <th className="py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.slice(0, 50).map((r, i) => (
                  <tr key={`${r.email}-${r.at}-${i}`} className="border-t border-zinc-100">
                    <td className="py-2 pr-4 text-zinc-800 break-all">
                      {r.email} {r.test && <Badge variant="zinc">test</Badge>}
                    </td>
                    <td className="py-2 pr-4 text-zinc-600 whitespace-nowrap">{data.templates.find((t) => t.id === r.template)?.name ?? r.template}</td>
                    <td className="py-2 text-zinc-600 whitespace-nowrap">{when(r.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
