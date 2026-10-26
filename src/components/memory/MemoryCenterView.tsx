import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  Cake,
  Camera,
  Coffee,
  Database,
  Eye,
  EyeOff,
  Heart,
  Lock,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  Shield,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MemoryEntity, UserMemoryItem } from '../../types';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  FieldLabel,
  PageContainer,
  PageHeader,
  SectionHeading,
  Select,
  Textarea,
  inputClasses,
} from '../common/UIPrimitives';

/** How each memory category appears as a node and as a connection in the graph. */
const GRAPH_CATEGORY_META: Record<UserMemoryItem['category'], { type: MemoryEntity['type']; label: string; relation: string }> = {
  personal: { type: 'user', label: 'About you', relation: 'notes' },
  relationship: { type: 'event', label: 'Relationship', relation: 'shares' },
  preferences: { type: 'preference', label: 'Preferences', relation: 'prefers' },
  memories: { type: 'event', label: 'Past moments', relation: 'remembers' },
  goals: { type: 'goal', label: 'Goals', relation: 'plans' },
  communication: { type: 'activity', label: 'Communication', relation: 'communicates' },
  important_dates: { type: 'date', label: 'Dates', relation: 'celebrates' },
};

export const MemoryCenterView: React.FC = () => {
  const {
    user,
    userMemories,
    addUserMemory,
    updateUserMemory,
    deleteUserMemory,
    clearAllUserMemories,
    memorySettings,
    updateMemorySettings,
    memoryContradictions,
    resolveContradiction,
    setActiveTab,
    showToast,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewGraph, setViewGraph] = useState(false);
  const [auditOpenId, setAuditOpenId] = useState<string | null>(null);

  // Form for new memory
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<UserMemoryItem['category']>('preferences');
  const [newVisibility, setNewVisibility] = useState<'private' | 'shared'>('shared');

  const categories = [
    { id: 'all', label: 'All memories', icon: <Brain /> },
    { id: 'preferences', label: 'Preferences', icon: <Coffee /> },
    { id: 'memories', label: 'Past moments', icon: <Camera /> },
    { id: 'relationship', label: 'Relationship', icon: <Heart /> },
    { id: 'communication', label: 'Communication', icon: <MessageSquare /> },
    { id: 'goals', label: 'Goals', icon: <Target /> },
    { id: 'important_dates', label: 'Dates', icon: <Cake /> },
  ];

  const filteredMemories = userMemories.filter((mem) => {
    const matchesCategory = activeCategory === 'all' || mem.category === activeCategory;
    const matchesSearch =
      mem.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    addUserMemory({
      userId: 'current_user',
      category: newCategory,
      content: newContent.trim(),
      source: 'manual',
      confidence: 1.0,
      visibility: newVisibility,
    });
    setNewContent('');
    setShowAddModal(false);
  };

  // Relationship graph, derived only from the user's own profile and remembered facts.
  const youLabel = user?.name || 'You';
  const graphEntities = useMemo<MemoryEntity[]>(() => {
    const entities: MemoryEntity[] = [{ id: 'ent_user', type: 'user', name: youLabel }];
    if (user?.partnerName) entities.push({ id: 'ent_partner', type: 'partner', name: user.partnerName });

    const counts = new Map<UserMemoryItem['category'], number>();
    userMemories.forEach((m) => counts.set(m.category, (counts.get(m.category) || 0) + 1));
    counts.forEach((count, category) => {
      const meta = GRAPH_CATEGORY_META[category];
      entities.push({ id: `ent_${category}`, type: meta.type, name: meta.label, metadata: { count } });
    });
    return entities;
  }, [userMemories, youLabel, user?.partnerName]);

  const graphConnections = useMemo(() => {
    const importanceRank: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
    // Shared facts belong to the couple; private ones only to the user.
    const coupleLabel = user?.partnerName ? `${youLabel} & ${user.partnerName}` : youLabel;
    return [...userMemories]
      .sort(
        (a, b) =>
          (importanceRank[b.importance || ''] ?? 0) - (importanceRank[a.importance || ''] ?? 0) ||
          (b.confidence || 0) - (a.confidence || 0)
      )
      .slice(0, 12)
      .map((m) => ({
        id: m.id,
        source: m.visibility === 'shared' ? coupleLabel : youLabel,
        relation: GRAPH_CATEGORY_META[m.category].relation,
        target: m.content,
        confidence: m.confidence || 0.95,
      }));
  }, [userMemories, youLabel, user?.partnerName]);

  const pendingContradictions = memoryContradictions
    ? memoryContradictions.filter((c) => c.status === 'pending')
    : [];

  return (
    <PageContainer>
      <PageHeader
        icon={<Brain />}
        title="Memory center"
        subtitle="See, edit or forget relationship context. LoveMate uses it to offer relevant, natural suggestions without fake certainty."
        actions={
          <>
            <Button variant="secondary" icon={<Database className="w-4 h-4" />} onClick={() => setViewGraph(!viewGraph)}>
              {viewGraph ? 'View cards' : 'View graph'}
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Add memory
            </Button>
          </>
        }
      />

      {/* Status & pause bar */}
      <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-zinc-800">{memorySettings.isPaused ? 'Memory is paused' : 'Memory is active'}</span>
          <span className="text-zinc-300">|</span>
          <span>{userMemories.length} facts remembered</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={memorySettings.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            onClick={() => updateMemorySettings({ isPaused: !memorySettings.isPaused })}
          >
            {memorySettings.isPaused ? 'Resume memory' : 'Pause memory'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to forget all AI relationship memories?')) {
                clearAllUserMemories();
              }
            }}
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Contradictions */}
      {pendingContradictions.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200/90 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4" />
            <span>Memory contradiction detected</span>
          </div>
          {pendingContradictions.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-700">
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Previously stored</span>
                  <p className="italic text-zinc-800">"{c.existingContent}"</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block mb-1">Conflicting observation</span>
                  <p className="italic text-zinc-900">"{c.newContent}"</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-600">Suggested resolution</span>
                  <p className="text-xs text-zinc-900 font-semibold">{c.suggestedResolution}</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => resolveContradiction(c.id, c.suggestedResolution)}>
                  Resolve & update
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Graph view */}
      {viewGraph && (
        <Card className="space-y-4 animate-in fade-in">
          <SectionHeading
            title="Relationship graph"
            description="Entities and verified links that power contextual AI responses."
            action={<Badge variant="zinc">Live graph</Badge>}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {graphEntities.map((ent) => (
              <div
                key={ent.id}
                className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-1 hover:border-rose-300 transition-colors"
              >
                <span className="text-[10px] font-mono uppercase text-rose-600 font-bold block">{ent.type}</span>
                <p className="text-xs font-bold text-zinc-800 truncate">{ent.name}</p>
                {typeof ent.metadata?.count === 'number' && (
                  <p className="text-[10px] text-zinc-400">{ent.metadata.count} {ent.metadata.count === 1 ? 'fact' : 'facts'}</p>
                )}
              </div>
            ))}
          </div>

          {userMemories.length === 0 ? (
            <div className="bg-zinc-50/70 rounded-2xl p-5 border border-zinc-200/80 text-center space-y-2">
              <p className="text-xs font-bold text-zinc-700">Your graph is empty for now</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                It grows as LoveMate learns about you{user?.partnerName ? ` and ${user.partnerName}` : ''}. Add a memory or
                chat with LoveMate to create your first connection.
              </p>
              <div className="pt-1">
                <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddModal(true)}>
                  Add memory
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50/70 rounded-2xl p-4 border border-zinc-200/80 space-y-2">
              <p className="text-xs font-bold text-zinc-700">Active connections</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {graphConnections.map((rel) => (
                  <div key={rel.id} className="p-2.5 rounded-xl bg-white border border-zinc-200 flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-700 min-w-0 truncate" title={rel.target}>
                      <span className="text-zinc-500">{rel.source}</span>{' '}
                      <span className="text-rose-600 font-bold">{rel.relation}</span>{' '}
                      <span className="text-zinc-900">{rel.target}</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0">{Math.round(rel.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Category chips & search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Chip key={cat.id} selected={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)} icon={cat.icon}>
              {cat.label}
            </Chip>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClasses} pl-9 py-2 text-xs`}
          />
        </div>
      </div>

      {/* Memory cards */}
      {filteredMemories.length === 0 ? (
        <EmptyState
          icon={<Brain className="w-6 h-6" />}
          title="No memories in this filter"
          description="Add custom memories or let LoveMate learn natural preferences as you chat."
          actionLabel="Add first memory"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((mem) => (
            <Card key={mem.id} padding="sm" className="flex flex-col justify-between group space-y-3 p-5">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="zinc">{mem.category.replace('_', ' ')}</Badge>
                    <Badge variant="emerald">{Math.round((mem.confidence || 0.95) * 100)}% confident</Badge>
                    {mem.importance && (
                      <Badge variant={mem.importance === 'critical' || mem.importance === 'high' ? 'rose' : 'zinc'}>
                        {mem.importance}
                      </Badge>
                    )}
                  </div>

                  <div className="shrink-0">
                    {mem.visibility === 'shared' ? (
                      <Badge variant="rose">
                        <Users className="w-3 h-3" /> Shared
                      </Badge>
                    ) : (
                      <Badge variant="zinc">
                        <Lock className="w-3 h-3" /> Private
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-zinc-800 leading-snug mt-1">"{mem.content}"</p>

                <div className="mt-2.5">
                  <button
                    onClick={() => setAuditOpenId(auditOpenId === mem.id ? null : mem.id)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    {auditOpenId === mem.id ? 'Hide source' : 'Why is this remembered?'}
                  </button>
                  {auditOpenId === mem.id && (
                    <div className="mt-1.5 p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs text-zinc-800 space-y-1 animate-in fade-in">
                      <span className="text-[10px] font-bold uppercase text-rose-800 block">Memory origin</span>
                      <p className="text-[11px] leading-relaxed">
                        {mem.sourceReason || `Observed via ${mem.source.replace('_', ' ')} during relationship interaction.`}
                      </p>
                      {mem.lastConfirmedAt && (
                        <p className="text-[10px] text-zinc-500">Last confirmed: {mem.lastConfirmedAt}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs text-zinc-500">
                <span className="text-[11px] min-w-0 truncate">
                  Learned {mem.createdAt} {mem.lastUsedAt ? `· Used ${mem.lastUsedAt}` : ''}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      updateUserMemory(mem.id, { lastConfirmedAt: 'Today' });
                      showToast('Memory confirmed as accurate! Confidence refreshed.', 'success');
                    }}
                    className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                    title="Confirm accuracy"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() =>
                      updateUserMemory(mem.id, {
                        visibility: mem.visibility === 'shared' ? 'private' : 'shared',
                      })
                    }
                    className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                    title={mem.visibility === 'shared' ? 'Make private' : 'Share with partner'}
                  >
                    {mem.visibility === 'shared' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteUserMemory(mem.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Forget memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Privacy controls */}
      <Card className="space-y-4">
        <SectionHeading
          title="Privacy controls"
          description="You decide what relationship context LoveMate is permitted to retain."
          action={<Settings2 className="w-4 h-4 text-zinc-400" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-100/70 transition-colors">
            <span className="text-xs font-semibold text-zinc-800">Personal memory</span>
            <input
              type="checkbox"
              checked={memorySettings.personalMemory}
              onChange={(e) => updateMemorySettings({ personalMemory: e.target.checked })}
              className="accent-rose-600 w-4 h-4"
            />
          </label>

          <label className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-100/70 transition-colors">
            <span className="text-xs font-semibold text-zinc-800">Relationship milestones</span>
            <input
              type="checkbox"
              checked={memorySettings.relationshipMemory}
              onChange={(e) => updateMemorySettings({ relationshipMemory: e.target.checked })}
              className="accent-rose-600 w-4 h-4"
            />
          </label>

          <label className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-100/70 transition-colors">
            <span className="text-xs font-semibold text-zinc-800">Shared partner memory</span>
            <input
              type="checkbox"
              checked={memorySettings.sharedCoupleMemory}
              onChange={(e) => updateMemorySettings({ sharedCoupleMemory: e.target.checked })}
              className="accent-rose-600 w-4 h-4"
            />
          </label>
        </div>
      </Card>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">Add relationship context</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-700" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <FieldLabel>What should LoveMate remember?</FieldLabel>
                <Textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. She loves sunset walks and hazelnut cold brews..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)}>
                    <option value="preferences">Preferences</option>
                    <option value="memories">Past moment</option>
                    <option value="relationship">Relationship</option>
                    <option value="communication">Communication</option>
                    <option value="goals">Goal / challenge</option>
                    <option value="important_dates">Important date</option>
                  </Select>
                </div>

                <div>
                  <FieldLabel>Visibility</FieldLabel>
                  <Select value={newVisibility} onChange={(e) => setNewVisibility(e.target.value as any)}>
                    <option value="shared">Shared with partner</option>
                    <option value="private">Private (only you)</option>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save context
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
