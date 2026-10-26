import React, { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  LineChart,
  Lightbulb,
  Minus,
  Plus,
  TrendingUp,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
} from '../common/UIPrimitives';

export const RelationshipPatternsView: React.FC = () => {
  const { relationshipPatterns, relationshipTrends, addRelationshipPattern, setActiveTab, showToast } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<'patterns' | 'trends'>('patterns');
  const [showAddPatternModal, setShowAddPatternModal] = useState(false);

  // New Pattern Form
  const [topic, setTopic] = useState('');
  const [commonTheme, setCommonTheme] = useState('');
  const [suggestedExperiment, setSuggestedExperiment] = useState('');

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    if (trend === 'improving') return <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
    if (trend === 'declining') return <ArrowDownRight className="w-4 h-4 text-amber-600" />;
    return <Minus className="w-4 h-4 text-zinc-500" />;
  };

  const getTrendBadge = (trend: 'improving' | 'stable' | 'declining') => {
    if (trend === 'improving') return <Badge variant="emerald">Improving</Badge>;
    if (trend === 'declining') return <Badge variant="amber">Needs focus</Badge>;
    return <Badge variant="zinc">Stable</Badge>;
  };

  const handleAddPattern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    addRelationshipPattern({
      topic: topic.trim(),
      frequencyCount: 2,
      timePeriod: 'recent weeks',
      commonTheme: commonTheme.trim() || 'Communication timing during stressful days',
      suggestedExperiment:
        suggestedExperiment.trim() || 'Try a 10-minute check-in before sleeping to align on schedule changes.',
    });
    setTopic('');
    setCommonTheme('');
    setSuggestedExperiment('');
    setShowAddPatternModal(false);
    showToast('New pattern observation recorded 🌱', 'love');
  };

  const trendTiles = [
    { label: 'Communication', value: relationshipTrends.overallSnapshot.communication, trend: relationshipTrends.communicationTrend },
    { label: 'Quality time', value: relationshipTrends.overallSnapshot.qualityTime, trend: relationshipTrends.qualityTimeTrend },
    { label: 'Mutual trust', value: relationshipTrends.overallSnapshot.trust, trend: relationshipTrends.trustTrend },
    { label: 'Shared activities', value: relationshipTrends.overallSnapshot.fun, trend: relationshipTrends.sharedActivitiesTrend },
  ];

  return (
    <PageContainer>
      <PageHeader
        icon={<TrendingUp />}
        title="Patterns & trends"
        subtitle="Instead of overanalyzing isolated texts, LoveMate notices recurring communication cycles over time and suggests gentle experiments."
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddPatternModal(true)}>
            Log pattern
          </Button>
        }
      />
      <p className="text-xs text-zinc-500">
        These are conversational patterns based on your own notes, not psychological or clinical diagnoses. Context always matters.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Chip selected={activeTabFilter === 'patterns'} onClick={() => setActiveTabFilter('patterns')} icon={<Activity />}>
          Recurring patterns ({relationshipPatterns.length})
        </Chip>
        <Chip selected={activeTabFilter === 'trends'} onClick={() => setActiveTabFilter('trends')} icon={<LineChart />}>
          Relationship trends
        </Chip>
      </div>

      {/* Tab 1: Patterns View */}
      {activeTabFilter === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationshipPatterns.map((pat) => (
            <Card key={pat.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge variant="zinc">
                    {pat.frequencyCount} discussions ({pat.timePeriod})
                  </Badge>
                  <h3 className="text-base font-bold text-zinc-900 mt-2">{pat.topic}</h3>
                </div>
                <span className="text-xs text-zinc-500 shrink-0">{pat.detectedAt}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-zinc-700">Observed cycle</span>
                  <p className="text-zinc-600 mt-1 leading-relaxed bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    {pat.commonTheme}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-zinc-700 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-rose-500" />
                    Suggested experiment
                  </span>
                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-zinc-800 mt-1 leading-relaxed">
                    "{pat.suggestedExperiment}"
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setActiveTab('roleplay')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                >
                  Practice in roleplay <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setActiveTab('couple-coach')}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                >
                  Discuss in Couple coach
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 2: Trends View */}
      {activeTabFilter === 'trends' && (
        <div className="space-y-6">
          {trendTiles.every((t) => t.value === 0) && (
            <p className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-sm text-zinc-700">
              No trends yet. They appear after your first relationship check-in.{' '}
              <button onClick={() => setActiveTab('health-check')} className="font-semibold text-rose-600 hover:underline">
                Take the check-in
              </button>
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trendTiles.map((tile) => (
              <div key={tile.label} className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">{tile.label}</span>
                  {getTrendIcon(tile.trend)}
                </div>
                <p className="text-2xl font-bold text-zinc-900">{tile.value}%</p>
                {getTrendBadge(tile.trend)}
              </div>
            ))}
          </div>

          <Card className="space-y-4">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-rose-500" />
              Connection snapshot
            </h3>
            <p className="text-xs text-zinc-500 -mt-2">Based on check-ins and shared milestones.</p>

            <div className="space-y-3">
              {Object.entries(relationshipTrends.overallSnapshot).map(([key, val]) => {
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase());
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                      <span>{label}</span>
                      <span>{val}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Log Pattern Modal */}
      {showAddPatternModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">Record a pattern</h3>
              <button
                onClick={() => setShowAddPatternModal(false)}
                className="text-zinc-400 hover:text-zinc-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPattern} className="space-y-4">
              <div>
                <FieldLabel>Pattern topic</FieldLabel>
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Disagreements after busy work weeks..."
                />
              </div>

              <div>
                <FieldLabel>Common trigger or theme</FieldLabel>
                <Input
                  type="text"
                  value={commonTheme}
                  onChange={(e) => setCommonTheme(e.target.value)}
                  placeholder="e.g. Trying to discuss complex logistics late at night over text"
                />
              </div>

              <div>
                <FieldLabel>Gentle experiment to try together</FieldLabel>
                <Textarea
                  rows={2}
                  value={suggestedExperiment}
                  onChange={(e) => setSuggestedExperiment(e.target.value)}
                  placeholder="e.g. Switch from text to a 10-minute phone call next time plans change"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddPatternModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save pattern
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
