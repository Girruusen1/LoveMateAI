import React, { useState } from 'react';
import {
  Download,
  Eye,
  Lock,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Button, Card, Chip, PageContainer, PageHeader } from '../common/UIPrimitives';

export const TrustSafetyCenterView: React.FC = () => {
  const {
    user,
    userSubscription,
    couplePermissions,
    updateCouplePermissions,
    exportAllUserData,
    deleteUserAccount,
    disconnectCoupleSafely,
    showToast,
    setActiveTab,
  } = useApp();

  const [activeTab, setActiveSection] = useState<'privacy' | 'ai-transparency' | 'data-lifecycle' | 'couple-boundaries'>('privacy');

  const sections = [
    { id: 'privacy', label: 'Privacy and sharing', icon: <Lock /> },
    { id: 'ai-transparency', label: 'AI transparency', icon: <Eye /> },
    { id: 'couple-boundaries', label: 'Couple boundaries', icon: <Users /> },
    { id: 'data-lifecycle', label: 'Export and deletion', icon: <Download /> },
  ] as const;

  const principles = [
    {
      n: 1,
      title: 'No manufactured anxiety or fake mind-reading',
      body: "LoveMate never claims certainty about another person's unspoken thoughts. Text decode results always offer multiple perspectives and encourage open real-world communication.",
    },
    {
      n: 2,
      title: 'No clinical diagnoses',
      body: 'LoveMate provides emotional support and conversation coaching, not clinical psychology or psychiatric therapy. If distress is detected, we recommend qualified real-world professionals.',
    },
    {
      n: 3,
      title: 'Three-tier permissions',
      body: 'Agents can suggest and organize, but will never book reservations, transfer money or message contacts without your explicit approval.',
    },
    {
      n: 4,
      title: 'Honest provider redirection',
      body: 'We never pretend to confirm tables or flights inside the app. We redirect you to genuine providers (Zomato, Google Maps, MakeMyTrip) to finalize real-world plans.',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        icon={<Shield />}
        title="Trust & safety"
        subtitle="Your love life and private thoughts are yours alone. We never sell your data, never manufacture relationship anxiety and never expose private wingman chats to your partner."
      />

      <div className="flex flex-wrap gap-2">
        {sections.map((tab) => (
          <Chip key={tab.id} selected={activeTab === tab.id} icon={tab.icon} onClick={() => setActiveSection(tab.id)}>
            {tab.label}
          </Chip>
        ))}
      </div>

      {/* Tab 1: Privacy */}
      {activeTab === 'privacy' && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-600" />
              Individual data isolation
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Your private wingman chats, draft replies and confession experiments stay private to your profile.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Private wingman vault',
                desc: 'All "What Should I Reply?", Decode This, and Crush Analyzers are kept in your personal silo.',
                status: 'Always isolated',
              },
              {
                title: 'Zero third-party ad tracking',
                desc: 'We do not sell behavioral patterns or profile metadata to advertisers or data brokers.',
                status: 'Enforced by design',
              },
              {
                title: 'Encryption in transit',
                desc: 'All communication with LoveMate AI is secured via modern TLS 1.3 encryption protocols.',
                status: 'Active',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-zinc-900">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <Badge variant="emerald" className="shrink-0 self-start sm:self-auto">{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 2: AI transparency */}
      {activeTab === 'ai-transparency' && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-rose-600" />
              How LoveMate AI reasons and communicates
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              We believe in ethical, non-manipulative AI. These guardrails are built into our models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map((p) => (
              <div key={p.n} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <span className="text-xs font-semibold text-rose-600">Principle {p.n}</span>
                <h3 className="text-sm font-bold text-zinc-900">{p.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Couple boundaries */}
      {activeTab === 'couple-boundaries' && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-600" />
              Couple permissions
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              You decide what is synchronized with {user?.partnerName || 'your partner'}.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'shareTimeline', label: 'Share our milestones timeline', desc: 'Partner can view mutual milestone cards' },
              { key: 'shareMemories', label: 'Share couple memories and scrapbook', desc: 'Allows partner to read and add shared photos' },
              { key: 'shareActivities', label: 'Share couple challenges and streaks', desc: 'Synchronizes streak completions' },
              { key: 'shareImportantDates', label: 'Share important dates and reminders', desc: 'Both receive anniversary and milestone alerts' },
              { key: 'sharePersonalAiMemory', label: 'Share personal AI memory', desc: 'Partner can view your saved individual preferences (default: off)' },
              { key: 'sharePrivateConversations', label: 'Share AI wingman chats', desc: 'Allow partner to see private AI wingman chats (default: off)' },
              { key: 'sharePersonalJournal', label: 'Share private journal entries', desc: 'Reveals your personal diary drafts (default: off)' },
            ].map((perm) => (
              <label
                key={perm.key}
                className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-100/70 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-zinc-900">{perm.label}</p>
                  <p className="text-xs text-zinc-500">{perm.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(couplePermissions as any)[perm.key]}
                  onChange={(e) => updateCouplePermissions({ [perm.key]: e.target.checked } as any)}
                  className="accent-rose-600 w-4 h-4 cursor-pointer shrink-0"
                />
              </label>
            ))}
          </div>

          <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Partner account status</h3>
              <p className="text-xs text-zinc-500">
                {user?.partnerConnected ? `Currently paired with ${user.partnerName}` : 'No partner currently linked'}
              </p>
            </div>
            {user?.partnerConnected && (
              <Button variant="destructive" size="sm" onClick={disconnectCoupleSafely}>
                Disconnect partner safely
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: Export and deletion */}
      {activeTab === 'data-lifecycle' && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-rose-600" />
              Data portability and account ownership
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              You own your relationship memories. Download your complete archive or delete your profile permanently at any time.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Export all personal and relationship data</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Downloads a structured JSON archive containing your profile, saved AI memories, shared memories, goals and calendar blocks.
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={exportAllUserData} className="shrink-0">
              Download JSON archive
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">Permanent account deletion</h3>
                <p className="text-xs text-red-700/90 leading-relaxed mt-0.5">
                  Deleting your account immediately wipes all stored relationship memories, wingman conversations, couple logs and subscription records. This cannot be reversed.
                </p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="destructive" size="sm" onClick={deleteUserAccount}>
                Permanently delete my account
              </Button>
            </div>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};
