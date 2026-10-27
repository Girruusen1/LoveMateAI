import React, { useState } from 'react';
import {
  BookOpen,
  Bot,
  Camera,
  CheckCircle2,
  Flame,
  Globe,
  Heart,
  Lock,
  MapPin,
  NotebookPen,
  Plus,
  Send,
  Shield,
  Sparkles,
  Sun,
  Target,
  Users,
  Wine,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { SharedGoal, SharedPlanItem } from '../../types';
import { AIService } from '../../services/ai';
import {
  Badge,
  Button,
  Card,
  Chip,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  SectionHeading,
  Select,
  Textarea,
  inputClasses,
} from '../common/UIPrimitives';

export const OurSpaceView: React.FC = () => {
  const {
    user,
    coupleRoom,
    coupleStreak,
    incrementCoupleStreak,
    sharedMemories,
    addSharedMemory,
    sharedGoals,
    toggleSharedGoal,
    addSharedGoal,
    sharedPlans,
    addSharedPlan,
    toggleSharedPlan,
    coupleJournal,
    addCoupleJournalEntry,
    couplePermissions,
    updateCouplePermissions,
    longDistanceState,
    updateLongDistanceState,
    goalsV2,
    toggleGoalV2Milestone,
    setActiveTab,
    openShareModal,
    showToast,
    disconnectCoupleSafely,
  } = useApp();

  const [activeSpaceTab, setActiveSpaceTab] = useState<
    'today' | 'memories' | 'goals' | 'plans' | 'journal' | 'permissions' | 'couple-ai'
  >('today');

  // Dedicated Couple AI State
  const [coupleAiQuery, setCoupleAiQuery] = useState('');
  const [coupleAiLoading, setCoupleAiLoading] = useState(false);
  const [coupleAiMessages, setCoupleAiMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Hello ${user?.name || 'You'} & ${user?.partnerName || 'your partner'} ❤️ I am your dedicated Couple AI. I evaluate only your mutually shared memories and public goals to give you both thoughtful date ideas, conversation games, and reflection prompts. What shall we plan together?`,
    },
  ]);

  // Modals for adding
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);

  // Add memory form state
  const [memTitle, setMemTitle] = useState('');
  const [memCaption, setMemCaption] = useState('');
  const [memLocation, setMemLocation] = useState('');

  // Add goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<SharedGoal['category']>('travel');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Add plan form state
  const [planTitle, setPlanTitle] = useState('');
  const [planType, setPlanType] = useState<SharedPlanItem['type']>('date');

  // Add journal form state
  const [journTitle, setJournTitle] = useState('');
  const [journContent, setJournContent] = useState('');
  const [journMood, setJournMood] = useState('Happy & Connected ❤️');
  const [journVisibility, setJournVisibility] = useState<'shared' | 'private'>('shared');

  const partnerName = user?.partnerName || 'your partner';

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memTitle.trim()) return;
    addSharedMemory({
      title: memTitle.trim(),
      caption: memCaption.trim() || 'A cherished memory in our story.',
      location: memLocation.trim() || 'City Skyline',
      date: 'Today',
      tags: ['Special', 'Couples'],
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop',
    });
    setMemTitle('');
    setMemCaption('');
    setMemLocation('');
    setShowAddMemory(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    addSharedGoal({
      title: goalTitle.trim(),
      category: goalCategory,
      progressPercent: 10,
      deadline: goalDeadline || 'End of Year',
      completed: false,
    });
    setGoalTitle('');
    setShowAddGoal(false);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;
    addSharedPlan({
      title: planTitle.trim(),
      type: planType,
      status: 'planned',
    });
    setPlanTitle('');
    setShowAddPlan(false);
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journContent.trim()) return;
    addCoupleJournalEntry({
      authorName: user?.name || 'You',
      title: journTitle.trim() || 'Evening Reflection',
      content: journContent.trim(),
      mood: journMood,
      visibility: journVisibility,
      aiSummary: journVisibility === 'shared' ? 'A heartfelt mutual reflection on gratitude and connection.' : undefined,
    });
    setJournTitle('');
    setJournContent('');
    setShowAddJournal(false);
  };

  const handleAskCoupleAi = async (customQ?: string) => {
    const q = customQ || coupleAiQuery;
    if (!q.trim() || coupleAiLoading) return;

    setCoupleAiMessages((prev) => [...prev, { role: 'user', text: q }]);
    setCoupleAiQuery('');
    setCoupleAiLoading(true);

    try {
      const response = await AIService.generateCoupleAIAdvice(q, sharedMemories, sharedGoals);
      setCoupleAiMessages((prev) => [...prev, { role: 'assistant', text: response }]);
    } catch (e) {
      if (!isAiLimitError(e)) {
        setCoupleAiMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'I ran into an issue reflecting on your shared space. Please try again.' },
        ]);
      }
    } finally {
      setCoupleAiLoading(false);
    }
  };

  const spaceTabs: { id: typeof activeSpaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Sun /> },
    { id: 'couple-ai', label: 'Couple AI', icon: <Bot /> },
    { id: 'memories', label: `Memories (${sharedMemories.length})`, icon: <Camera /> },
    { id: 'goals', label: `Goals (${goalsV2?.length || sharedGoals.length})`, icon: <Target /> },
    { id: 'plans', label: `Bucket list (${sharedPlans.length})`, icon: <Wine /> },
    { id: 'journal', label: 'Journal', icon: <NotebookPen /> },
    { id: 'permissions', label: 'Permissions', icon: <Lock /> },
  ];

  const quickPrompts = [
    'Rainy Sunday date at home',
    '5 deep conversation starters for dinner',
    'Next step for our Japan 2027 goal',
    'Weekend lighthearted challenge',
  ];

  const modalShell = 'bg-white rounded-3xl max-w-lg w-full p-6 border border-zinc-200 shadow-2xl space-y-4';
  const overlay = 'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in';

  return (
    <PageContainer>
      <PageHeader
        icon={<Users />}
        title="Our Space"
        subtitle={`A private space shared between ${user?.name || 'you'} and ${partnerName} for memories, goals and conversations.`}
        actions={
          <>
            <Button variant="primary" icon={<Heart className="w-4 h-4" />} onClick={() => setActiveTab('our-story')}>
              Our Story
            </Button>
            <Button variant="secondary" icon={<BookOpen className="w-4 h-4" />} onClick={() => setActiveTab('scrapbook')}>
              Scrapbook
            </Button>
          </>
        }
      />

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {spaceTabs.map((tab) => (
          <Chip key={tab.id} selected={activeSpaceTab === tab.id} onClick={() => setActiveSpaceTab(tab.id)} icon={tab.icon}>
            {tab.label}
          </Chip>
        ))}
      </div>

      {/* Tab 1: Today Overview */}
      {activeSpaceTab === 'today' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Shared streak</span>
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
              </div>
              <p className="text-3xl font-bold text-zinc-900">{coupleStreak} days</p>
              <p className="text-xs text-zinc-500 leading-relaxed">Check in together once a day to keep it going.</p>
              <Button variant="secondary" size="sm" className="w-full" onClick={incrementCoupleStreak}>
                Check in today
              </Button>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Couple room</span>
                <Users className="w-4 h-4 text-rose-500" />
              </div>
              {coupleRoom ? (
                <p className="text-2xl font-bold font-mono tracking-wide text-zinc-900">{coupleRoom.roomCode}</p>
              ) : (
                <p className="text-2xl font-bold text-zinc-900">Not linked yet</p>
              )}
              <p className="text-xs text-zinc-500 leading-relaxed">
                {coupleRoom ? 'Share this code with your partner to play and answer together.' : 'Create a room and share the code with your partner.'}
              </p>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setActiveTab('couple-mode')}>
                {coupleRoom ? 'Open couple room' : 'Create or join a room'}
              </Button>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Relationship coach</span>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-lg font-bold text-zinc-900">"Let's talk" coach</p>
              <p className="text-xs text-zinc-500 leading-relaxed">Need to align on busy schedules or miscommunications?</p>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setActiveTab('couple-coach')}>
                Start guided session
              </Button>
            </Card>
          </div>

          {/* Long Distance Mode Bar if enabled */}
          {longDistanceState.isEnabled && (
            <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Long distance: {longDistanceState.yourCity} to {longDistanceState.partnerCity}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Next in-person reunion: <strong className="text-zinc-800">{longDistanceState.nextMeetingDate || 'Nov 02, 2026'}</strong> (~
                    {longDistanceState.milesApart || 615} miles apart)
                  </p>
                </div>
              </div>

              <Button variant="primary" size="sm" onClick={() => setActiveTab('long-distance')}>
                Virtual dates
              </Button>
            </Card>
          )}

          {/* Today's Quick Spark Action */}
          <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Badge variant="rose">Daily couple spark</Badge>
              <h3 className="text-base font-bold text-zinc-900 mt-2">
                "What is one habit of mine that made you smile this week?"
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Answer privately and unlock each other's responses simultaneously.</p>
            </div>

            <Button variant="primary" onClick={() => setActiveTab('couple-mode')} className="shrink-0">
              Answer in Couple mode
            </Button>
          </Card>
        </div>
      )}

      {/* Tab: Couple AI */}
      {activeSpaceTab === 'couple-ai' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <Card className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">Couple AI</h3>
                <Badge variant="emerald">
                  <Shield className="w-3 h-3" /> Shared context only
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                This AI speaks to both of you together. It analyzes only your <strong>shared scrapbook memories</strong> and{' '}
                <strong>public couple goals</strong>. Your private AI Wingman chats and personal journal drafts remain strictly private.
              </p>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Try asking:</span>
            {quickPrompts.map((prompt) => (
              <Chip key={prompt} onClick={() => handleAskCoupleAi(prompt)}>
                {prompt}
              </Chip>
            ))}
          </div>

          <Card padding="none" className="flex flex-col h-[480px]">
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {coupleAiMessages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-rose-600 text-white rounded-tr-xs'
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-tl-xs whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Heart className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {coupleAiLoading && (
                <div className="flex items-center gap-3 text-xs text-zinc-500 p-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Couple AI is reflecting on your shared story...</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-zinc-50/80 border-t border-zinc-200 flex items-center gap-2">
              <input
                type="text"
                value={coupleAiQuery}
                onChange={(e) => setCoupleAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskCoupleAi();
                }}
                placeholder={`Ask Couple AI anything for you and ${partnerName}...`}
                className={`${inputClasses} flex-1`}
              />
              <Button
                variant="primary"
                icon={<Send className="w-4 h-4" />}
                onClick={() => handleAskCoupleAi()}
                disabled={coupleAiLoading || !coupleAiQuery.trim()}
              >
                Ask
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Shared Memories */}
      {activeSpaceTab === 'memories' && (
        <div className="space-y-4">
          <SectionHeading
            title="Shared memories"
            action={
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddMemory(true)}>
                Add memory
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedMemories.map((mem) => (
              <Card key={mem.id} padding="none" className="space-y-3">
                {mem.photoUrl && (
                  <div className="h-48 w-full overflow-hidden relative">
                    <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {mem.location || 'Special Location'}
                    </span>
                  </div>
                )}
                <div className="p-5 pt-1 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                    <span className="font-bold text-zinc-800 text-sm">{mem.title}</span>
                    <span>{mem.date}</span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{mem.caption}</p>

                  {mem.generatedCaptions && (
                    <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-[11px] space-y-1">
                      <span className="font-bold text-rose-800 block text-[10px] uppercase">AI keepsake</span>
                      <p className="italic text-rose-950">"{mem.generatedCaptions.romantic}"</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Shared Goals & Milestones */}
      {activeSpaceTab === 'goals' && (
        <div className="space-y-6">
          <SectionHeading
            title="Things we're building together"
            description="Shared habits, trips and milestones with synchronized completion."
            action={
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddGoal(true)}>
                New goal
              </Button>
            }
          />

          {goalsV2 && goalsV2.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                Goal milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalsV2.map((gv2) => (
                  <Card key={gv2.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="rose">{gv2.category}</Badge>
                        <h4 className="text-base font-bold text-zinc-900 mt-1">{gv2.title}</h4>
                        <p className="text-xs text-zinc-500">{gv2.description}</p>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 shrink-0">{gv2.progress}%</span>
                    </div>

                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${gv2.progress}%` }} />
                    </div>

                    <div className="pt-2 border-t border-zinc-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-zinc-600">Milestones</p>
                        {gv2.targetDate && <span className="text-[10px] text-zinc-500">Target: {gv2.targetDate}</span>}
                      </div>
                      <div className="space-y-1.5">
                        {gv2.milestones.map((ms) => (
                          <div
                            key={ms.id}
                            onClick={() => toggleGoalV2Milestone(gv2.id, ms.id)}
                            className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer hover:text-zinc-900 p-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={ms.completed}
                              onChange={() => {}} // handled by parent onClick
                              className="accent-rose-600 w-3.5 h-3.5 rounded cursor-pointer pointer-events-none"
                            />
                            <span className={ms.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}>{ms.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quick habit goals ({sharedGoals.length})</h3>
            {sharedGoals.map((g) => (
              <div
                key={g.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSharedGoal(g.id)}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                      g.completed ? 'bg-rose-600 border-rose-600 text-white' : 'border-zinc-300 hover:border-rose-500'
                    }`}
                  >
                    {g.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div>
                    <h4 className={`text-sm font-bold ${g.completed ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>{g.title}</h4>
                    <p className="text-xs text-zinc-500">
                      Target: {g.deadline || 'Someday'} · Category: {g.category} {g.notes ? `· ${g.notes}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs font-bold text-zinc-700">{g.progressPercent}%</span>
                  <div className="w-28 bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${g.progressPercent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Bucket List & Plans */}
      {activeSpaceTab === 'plans' && (
        <div className="space-y-4">
          <SectionHeading
            title="Date & travel bucket list"
            action={
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddPlan(true)}>
                Add idea
              </Button>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sharedPlans.map((p) => (
              <div
                key={p.id}
                onClick={() => toggleSharedPlan(p.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  p.status === 'completed'
                    ? 'bg-zinc-50 border-zinc-200 opacity-60'
                    : 'bg-white border-zinc-200 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-500 mb-1.5">
                  <span>{p.type}</span>
                  <span className={p.status === 'completed' ? 'text-emerald-600' : 'text-rose-500'}>{p.status}</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900">{p.title}</h4>
                {p.notes && <p className="text-xs text-zinc-500 mt-1">{p.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Couple Journal */}
      {activeSpaceTab === 'journal' && (
        <div className="space-y-4">
          <SectionHeading
            title="Couple journal"
            description="Shared entries visible to both, or private personal notes."
            action={
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddJournal(true)}>
                Write entry
              </Button>
            }
          />

          <div className="space-y-3">
            {coupleJournal.map((j) => (
              <div
                key={j.id}
                className={`p-5 rounded-2xl border space-y-2 ${
                  j.visibility === 'shared' ? 'bg-white border-zinc-200' : 'bg-zinc-50/70 border-zinc-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">{j.title}</span>
                    <Badge variant="zinc">by {j.authorName}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">{j.createdAt}</span>
                    {j.visibility === 'shared' ? <Badge variant="rose">Shared</Badge> : <Badge variant="zinc">Private</Badge>}
                  </div>
                </div>

                <p className="text-sm text-zinc-700 leading-relaxed">{j.content}</p>

                {j.aiSummary && (
                  <div className="mt-2 pt-2 border-t border-zinc-100 text-[11px] text-rose-700 italic">AI reflection: {j.aiSummary}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Permissions & Privacy */}
      {activeSpaceTab === 'permissions' && (
        <Card className="space-y-6">
          <SectionHeading
            title="Sharing permissions"
            description="Privacy by default. You explicitly decide what data is synced with your connected partner."
            action={<Shield className="w-5 h-5 text-emerald-600" />}
          />

          <div className="space-y-3">
            {[
              { key: 'shareTimeline', label: 'Share our milestones timeline', desc: 'Partner can view mutual milestone cards' },
              { key: 'shareMemories', label: 'Share couple memories & scrapbook', desc: 'Allows partner to read & add shared photos' },
              { key: 'shareActivities', label: 'Share couple challenges & streaks', desc: 'Synchronizes streak completions' },
              { key: 'shareImportantDates', label: 'Share important dates & reminders', desc: 'Both receive anniversary/milestone alerts' },
              { key: 'sharePersonalAiMemory', label: 'Share personal AI memory', desc: 'Partner can view your saved individual preferences (default: off)' },
              { key: 'sharePrivateConversations', label: 'Share AI Wingman chats', desc: 'Allow partner to see private AI Wingman chats (default: off)' },
              { key: 'sharePersonalJournal', label: 'Share private journal entries', desc: 'Reveals your personal diary drafts (default: off)' },
            ].map((perm) => (
              <label
                key={perm.key}
                className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-100/70 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900">{perm.label}</p>
                  <p className="text-[11px] text-zinc-500">{perm.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(couplePermissions as any)[perm.key]}
                  onChange={(e) => updateCouplePermissions({ [perm.key]: e.target.checked } as any)}
                  className="accent-rose-600 w-4 h-4 ml-4"
                />
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Need to unpair accounts?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm('Disconnect from partner? Shared access will be paused safely.')) {
                  disconnectCoupleSafely();
                }
              }}
            >
              Disconnect partner
            </Button>
          </div>
        </Card>
      )}

      {/* Modal: Add Memory */}
      {showAddMemory && (
        <div className={overlay}>
          <div className={modalShell}>
            <h3 className="text-base font-bold text-zinc-900">Add shared memory</h3>
            <form onSubmit={handleCreateMemory} className="space-y-3">
              <div>
                <FieldLabel>Memory title</FieldLabel>
                <Input
                  type="text"
                  value={memTitle}
                  onChange={(e) => setMemTitle(e.target.value)}
                  placeholder="e.g. That Rainy Tuesday Cafe Date..."
                />
              </div>
              <div>
                <FieldLabel>Caption / story</FieldLabel>
                <Textarea
                  rows={3}
                  value={memCaption}
                  onChange={(e) => setMemCaption(e.target.value)}
                  placeholder="What made this moment unforgettable?"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddMemory(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save to Our Space
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Goal */}
      {showAddGoal && (
        <div className={overlay}>
          <div className={modalShell}>
            <h3 className="text-base font-bold text-zinc-900">Add shared goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <FieldLabel>Goal title</FieldLabel>
                <Input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Save for Weekend Roadtrip to Goa"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value as any)}>
                    <option value="travel">Travel</option>
                    <option value="habit">Habit / Ritual</option>
                    <option value="savings">Shared Savings</option>
                    <option value="communication">Communication</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Target deadline</FieldLabel>
                  <Input type="text" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} placeholder="e.g. Dec 2026" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Plan */}
      {showAddPlan && (
        <div className={overlay}>
          <div className={modalShell}>
            <h3 className="text-base font-bold text-zinc-900">Add bucket list idea</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <FieldLabel>Idea / experience</FieldLabel>
                <Input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Stargazing camp with campfire guitar"
                />
              </div>
              <div>
                <FieldLabel>Type</FieldLabel>
                <Select value={planType} onChange={(e) => setPlanType(e.target.value as any)}>
                  <option value="date">Date Idea</option>
                  <option value="travel">Travel Trip</option>
                  <option value="restaurant">Food & Dining</option>
                  <option value="gift">Surprise Gift</option>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddPlan(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add to bucket list
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Journal */}
      {showAddJournal && (
        <div className={overlay}>
          <div className={modalShell}>
            <h3 className="text-base font-bold text-zinc-900">Write journal entry</h3>
            <form onSubmit={handleCreateJournal} className="space-y-3">
              <div>
                <FieldLabel>Title</FieldLabel>
                <Input
                  type="text"
                  value={journTitle}
                  onChange={(e) => setJournTitle(e.target.value)}
                  placeholder="e.g. Thoughts after our honest talk"
                />
              </div>
              <div>
                <FieldLabel>Your reflection</FieldLabel>
                <Textarea
                  rows={4}
                  value={journContent}
                  onChange={(e) => setJournContent(e.target.value)}
                  placeholder="How was today? What did you appreciate or learn?"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Mood</FieldLabel>
                  <Input type="text" value={journMood} onChange={(e) => setJournMood(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Visibility</FieldLabel>
                  <Select value={journVisibility} onChange={(e) => setJournVisibility(e.target.value as any)}>
                    <option value="shared">Shared with partner</option>
                    <option value="private">Private (only me)</option>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddJournal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Post entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
