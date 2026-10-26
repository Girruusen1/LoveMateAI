import React from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  HeartHandshake,
  Lightbulb,
  MessageSquare,
  Smile,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Button, Card, PageContainer, PageHeader, SectionHeading } from '../common/UIPrimitives';

export const RelationshipDashboardView: React.FC = () => {
  const {
    user,
    coupleRoom,
    coupleStreak,
    relationshipTrends,
    timelineMilestones,
    importantDates,
    sharedGoals,
    sharedMemories,
    setActiveTab,
  } = useApp();

  const partnerName = user?.partnerName || 'your partner';

  const pillars = [
    { label: 'Emotional', score: relationshipTrends.overallSnapshot.emotionalConnection, icon: <Heart /> },
    { label: 'Communication', score: relationshipTrends.overallSnapshot.communication, icon: <MessageSquare /> },
    { label: 'Quality time', score: relationshipTrends.overallSnapshot.qualityTime, icon: <Clock /> },
    { label: 'Shared goals', score: relationshipTrends.overallSnapshot.sharedGoals, icon: <Target /> },
    { label: 'Fun & banter', score: relationshipTrends.overallSnapshot.fun, icon: <Smile /> },
    { label: 'Mutual trust', score: relationshipTrends.overallSnapshot.trust, icon: <HeartHandshake /> },
  ];
  const hasScores = pillars.some((p) => p.score > 0);

  return (
    <PageContainer>
      <PageHeader
        icon={<Activity />}
        title="Relationship dashboard"
        subtitle={`A snapshot of your journey with ${partnerName}, built from your shared activities, check-ins and milestones.`}
        actions={
          <>
            <Button variant="secondary" icon={<Sparkles className="w-4 h-4" />} onClick={() => setActiveTab('chemistry-mode')}>
              Chemistry mode
            </Button>
            <Button variant="primary" icon={<Users className="w-4 h-4" />} onClick={() => setActiveTab('our-space')}>
              Open Our Space
            </Button>
          </>
        }
      />

      {/* Streak + quick links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-zinc-200">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Couple streak</p>
            <p className="text-base font-bold text-zinc-900">{coupleStreak} days active</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" icon={<BookOpen className="w-3.5 h-3.5" />} onClick={() => setActiveTab('timeline')}>
            Milestones
          </Button>
          <Button variant="ghost" size="sm" icon={<TrendingUp className="w-3.5 h-3.5" />} onClick={() => setActiveTab('relationship-patterns')}>
            Patterns
          </Button>
        </div>
      </div>

      {/* Connection pillars */}
      <Card className="space-y-5">
        <SectionHeading
          title="Connection pillars"
          description="Based on your voluntary reflections and completed activities, not clinical scores."
          action={
            <button
              onClick={() => setActiveTab('health-check')}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              {hasScores ? 'Retake check-in' : 'Take check-in'} <ArrowRight className="w-3 h-3" />
            </button>
          }
        />

        {!hasScores && (
          <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-zinc-700">No scores yet. Take a 2-minute check-in and your connection pillars appear here.</p>
            <Button size="sm" onClick={() => setActiveTab('health-check')}>
              Take the check-in
            </Button>
          </div>
        )}

        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 ${hasScores ? '' : 'hidden'}`}>
          {pillars.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-center space-y-2 hover:border-rose-200 transition-colors"
            >
              <div className="w-9 h-9 mx-auto rounded-xl bg-white border border-zinc-200 text-rose-600 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                {item.icon}
              </div>
              <p className="text-[11px] font-semibold text-zinc-500">{item.label}</p>
              <p className="text-xl font-bold text-zinc-900">{item.score}%</p>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Going well vs changing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">What's going well</h3>
              <p className="text-xs text-zinc-500">Your relationship strengths right now</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-950 leading-relaxed">
              <strong>High shared fun:</strong> You completed 5 couple connection sprints this month with a 91% banter compatibility match.
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-950 leading-relaxed">
              <strong>Unbroken trust:</strong> Mutual trust reflections remain exceptionally strong at 94%, with zero secrecy friction noted.
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">What's changing</h3>
              <p className="text-xs text-zinc-500">Areas that could benefit from gentle focus</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-950 leading-relaxed">
              <strong>Quality time dip:</strong> Recent check-ins indicate busy weekday schedules are cutting into spontaneous evening talks.
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-950 leading-relaxed">
              <strong>Screen distraction:</strong> 3 recent reflections noted tired scrolling after dinner instead of conversational connection.
            </div>
          </div>
        </Card>
      </div>

      {/* Worth discussing */}
      <Card variant="accent" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-rose-100 flex items-center justify-center text-rose-600">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Worth discussing together</h3>
              <p className="text-xs text-zinc-500">A discussion prompt based on your current trends</p>
            </div>
          </div>
          <Badge variant="rose">Recommended</Badge>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 space-y-3">
          <p className="text-sm font-bold text-zinc-800 leading-snug">
            "What is one 20-minute ritual we can protect next week where we keep phones out of reach and just talk about anything silly or deep?"
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setActiveTab('chemistry-mode')}>
              Start Chemistry mode tonight
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setActiveTab('date-planner')}>
              Plan a screen-free date
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent memories & upcoming dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <SectionHeading
            title="Recent memories"
            action={
              <button onClick={() => setActiveTab('timeline')} className="text-xs font-bold text-rose-600 hover:underline whitespace-nowrap">
                View all ({timelineMilestones.length})
              </button>
            }
          />

          <div className="space-y-2 text-xs">
            {timelineMilestones.slice(0, 3).map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-zinc-800 block truncate">{m.title}</span>
                  <span className="text-[11px] text-zinc-500">{m.date}</span>
                </div>
                <span className="text-base shrink-0">{m.icon}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <SectionHeading
            title="Upcoming dates"
            action={
              <button onClick={() => setActiveTab('important-dates')} className="text-xs font-bold text-rose-600 hover:underline whitespace-nowrap">
                Manage dates
              </button>
            }
          />

          <div className="space-y-2 text-xs">
            {importantDates.slice(0, 3).map((d) => (
              <div key={d.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-800 block truncate">{d.title}</span>
                    <span className="text-[11px] text-zinc-500">{d.date}</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('love-cards')}>
                  Create card
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
