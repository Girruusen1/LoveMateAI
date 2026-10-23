import React, { useState } from 'react';
import {
  Beaker,
  CheckCircle2,
  Cpu,
  FileCode,
  Layers,
  Play,
  Settings,
  Shield,
  Sliders,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeatureFlags } from '../../types';
import { Badge, Button, Card, Chip, PageContainer, PageHeader } from '../common/UIPrimitives';

export const AdminDashboardView: React.FC = () => {
  const {
    featureFlags,
    toggleFeatureFlag,
    adminMetrics,
    aiModels,
    toggleAiModelEnabled,
    promptVersions,
    evaluationCases,
    runAllEvaluations,
    experiments,
    toggleExperimentStatus,
    unitEconomics,
    supportTickets,
    showToast,
    setDesignSystemOpen,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'observability' | 'ai-quality' | 'experiments' | 'flags' | 'support'>('observability');
  const [evaluating, setEvaluating] = useState(false);

  const flagLabels: { key: keyof FeatureFlags; label: string; desc: string }[] = [
    { key: 'love_agent', label: 'LoveMate Autonomous Agent', desc: 'Decomposes natural intent into structured tasks and action plans.' },
    { key: 'relationship_copilot', label: 'Ask LoveMate (Copilot)', desc: 'Primary AI conversational entry point and routing layer.' },
    { key: 'couple_ai', label: 'Dedicated Couple AI', desc: 'Evaluates only mutually shared relationship memories & goals.' },
    { key: 'relationship_autopilot', label: 'Relationship Autopilot', desc: 'Automates anniversary alerts, Sunday check-ins & weekly date ideas.' },
    { key: 'couple_calendar', label: 'Couple Calendar Sync', desc: 'Shared and private event scheduler with external Google Calendar export.' },
    { key: 'relationship_goals_v2', label: 'Relationship goals', desc: 'Multi-milestone structured couple growth tracking.' },
    { key: 'wishlist', label: 'Our Wishlist & Bucket List', desc: 'Curated gifts, restaurants, and places with price tracking.' },
    { key: 'gift_intelligence_v2', label: 'Gift intelligence', desc: 'Psychology gift personality profiling and recommendation engine.' },
    { key: 'experience_marketplace', label: 'AI Experience Marketplace', desc: 'Creator packs, conversation decks, and proposal blueprinters.' },
    { key: 'creator_system', label: 'Creator System & Moderation', desc: 'Community submission flows, review queues, and verified creator badges.' },
  ];

  const handleRunEvaluations = async () => {
    setEvaluating(true);
    await runAllEvaluations();
    setEvaluating(false);
  };

  const tabs = [
    { id: 'observability', label: 'Unit economics' },
    { id: 'ai-quality', label: `AI quality (${evaluationCases.length})` },
    { id: 'experiments', label: `Experiments (${experiments.length})` },
    { id: 'flags', label: 'Feature flags (10)' },
    { id: 'support', label: `Support tickets (${supportTickets.length})` },
  ] as const;

  return (
    <PageContainer>
      <PageHeader
        icon={<Settings />}
        title="Admin console"
        subtitle="Telemetry, model routing, regression evaluation, unit economics, experiments and feature flags."
        actions={
          <>
            <Badge variant="emerald" size="md">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              icon={<Layers className="w-3.5 h-3.5" />}
              onClick={() => setDesignSystemOpen(true)}
            >
              Design system
            </Button>
          </>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="sm">
          <span className="text-xs font-semibold text-zinc-500 block">Daily active users</span>
          <p className="text-2xl font-bold text-zinc-900 mt-0.5">{adminMetrics.activeUsers.toLocaleString()}</p>
          <span className="text-xs text-emerald-600 font-medium">Up 18.4% this week</span>
        </Card>

        <Card padding="sm">
          <span className="text-xs font-semibold text-zinc-500 block">AI gross margin</span>
          <p className="text-2xl font-bold text-zinc-900 mt-0.5">{unitEconomics.grossMarginPercent}%</p>
          <span className="text-xs text-zinc-500">Cost: ${(unitEconomics.totalAiCostTodayUSD).toFixed(2)}/day</span>
        </Card>

        <Card padding="sm">
          <span className="text-xs font-semibold text-zinc-500 block">Total agent tasks</span>
          <p className="text-2xl font-bold text-zinc-900 mt-0.5">{adminMetrics.totalAgentTasks.toLocaleString()}</p>
          <span className="text-xs text-emerald-600 font-medium">98.2% execution success</span>
        </Card>

        <Card padding="sm">
          <span className="text-xs font-semibold text-zinc-500 block">AI tokens today</span>
          <p className="text-2xl font-bold text-zinc-900 mt-0.5">{(adminMetrics.aiTokenUsageToday / 1000).toFixed(1)}k</p>
          <span className="text-xs text-zinc-500">Avg latency: {adminMetrics.aiLatencyAvgMs}ms</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Chip key={tab.id} selected={activeAdminTab === tab.id} onClick={() => setActiveAdminTab(tab.id)}>
            {tab.label}
          </Chip>
        ))}
      </div>

      {/* Tab 1: Unit economics */}
      {activeAdminTab === 'observability' && (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Unit economics</h2>
              <p className="text-xs text-zinc-500">Per-user financial model and platform margins</p>
            </div>
            <Badge variant="emerald" size="md">Healthy unit economics</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-xs font-semibold text-zinc-500">Revenue per user (ARPU)</span>
              <p className="text-2xl font-bold text-zinc-900">${unitEconomics.revenuePerUserUSD.toFixed(2)}</p>
              <p className="text-xs text-zinc-500">Blended subscription + micro-packs</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-xs font-semibold text-zinc-500">AI cost per user</span>
              <p className="text-2xl font-bold text-rose-600">${unitEconomics.aiCostPerUserUSD.toFixed(2)}</p>
              <p className="text-xs text-zinc-500">Through intelligent model routing</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-xs font-semibold text-zinc-500">AI gross margin</span>
              <p className="text-2xl font-bold text-emerald-600">{unitEconomics.grossMarginPercent}%</p>
              <p className="text-xs text-zinc-500">(Revenue - AI cost) / Revenue</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: AI quality and model routing */}
      {activeAdminTab === 'ai-quality' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-rose-600" />
                  Model router
                </h2>
                <p className="text-xs text-zinc-500">Tiered dispatch: low-cost models for simple rewrites, deep models for planning</p>
              </div>
              <span className="text-xs text-zinc-500">3 models active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiModels.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="zinc">{m.costTier.replace('_', ' ')}</Badge>
                    <button
                      onClick={() => toggleAiModelEnabled(m.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        m.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {m.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <h3 className="font-bold text-xs text-zinc-900">{m.modelName}</h3>
                  <p className="text-xs text-zinc-500">Target latency: {m.latencyTargetMs}ms</p>
                  <p className="text-xs font-mono text-zinc-400">${m.costPer1kTokensUSD} / 1k tokens</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-rose-600" />
              Prompt versions
            </h2>
            <div className="space-y-2">
              {promptVersions.map((pv) => (
                <div key={pv.promptId} className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-zinc-900">{pv.feature}</span>
                      <Badge variant="zinc">{pv.version}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5 break-all">{pv.template}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="emerald" size="md">{pv.qualityScoreAvg}% benchmark</Badge>
                    <span className="text-xs text-zinc-400">{pv.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-rose-600" />
                  Regression evaluations
                </h2>
                <p className="text-xs text-zinc-500">Live safety tests across core AI relationship capabilities</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Play className="w-3.5 h-3.5" />}
                onClick={handleRunEvaluations}
                loading={evaluating}
              >
                Run all tests
              </Button>
            </div>

            <div className="space-y-3">
              {evaluationCases.map((ec) => (
                <div key={ec.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-zinc-900">{ec.feature}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">{ec.lastTestedAt}</span>
                      <Badge variant="emerald">{ec.qualityScore}% passed</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700">Input: "{ec.inputDescription}"</p>
                  <p className="text-xs text-zinc-500">Expected: {ec.expectedBehavior}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Experiments */}
      {activeAdminTab === 'experiments' && (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-rose-600" />
                Experiments
              </h2>
              <p className="text-xs text-zinc-500">Controlled feature testing. Security, consent and safety guardrails are excluded from experiments.</p>
            </div>
            <span className="text-xs text-zinc-500">2 active experiments</span>
          </div>

          <div className="space-y-4">
            {experiments.map((exp) => (
              <div key={exp.id} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">{exp.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{exp.hypothesis}</p>
                  </div>
                  <button
                    onClick={() => toggleExperimentStatus(exp.id)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-colors ${
                      exp.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {exp.status.toUpperCase()}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {exp.variants.map((v) => {
                    const rate = ((v.conversions / v.totalExposures) * 100).toFixed(1);
                    return (
                      <div key={v.id} className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-800">{v.name}</span>
                          <span className="font-bold text-rose-600">{rate}% conv</span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {v.conversions} conversions / {v.totalExposures} impressions ({v.allocationPercent}% split)
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 4: Feature flags */}
      {activeAdminTab === 'flags' && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-rose-600" />
              <div>
                <h2 className="text-base font-bold text-zinc-900">Feature flags</h2>
                <p className="text-xs text-zinc-500">Toggle experimental or platform-level systems in real time</p>
              </div>
            </div>
            <span className="text-xs text-zinc-500">10 flags configured</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {flagLabels.map((flag) => {
              const isEnabled = featureFlags[flag.key];
              return (
                <div
                  key={flag.key}
                  className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/70 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-bold text-xs text-zinc-900">{flag.label}</h3>
                      <span className="text-[10px] font-mono text-zinc-400">[{flag.key}]</span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1">{flag.desc}</p>
                  </div>

                  <button
                    onClick={() => toggleFeatureFlag(flag.key)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      isEnabled ? 'bg-rose-600' : 'bg-zinc-300'
                    }`}
                    aria-label={`Toggle ${flag.label}`}
                    aria-pressed={isEnabled}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white transition-transform block absolute top-1 shadow-xs ${
                        isEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tab 5: Support */}
      {activeAdminTab === 'support' && (
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-600" />
            Support and AI feedback queue
          </h2>
          <div className="space-y-3">
            {supportTickets.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-zinc-900">{t.subject}</span>
                    <Badge variant="zinc">{t.category}</Badge>
                  </div>
                  <p className="text-zinc-600 mt-1">{t.description}</p>
                </div>
                <Badge variant="blue" className="shrink-0 self-start sm:self-auto">{t.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageContainer>
  );
};
