import React from 'react';
import { CheckCircle2, Circle, Sprout, Trophy, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Card, PageContainer, PageHeader } from '../common/UIPrimitives';

export const RelationshipChallengesView: React.FC = () => {
  const { growthChallenges, toggleChallengeDay, startChallenge, setActiveTab } = useApp();

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Sprout />}
        title="Challenges"
        subtitle="One small, powerful daily action. Build better communication, intimacy and shared laughter in seven days."
      />

      {/* Challenges List */}
      <div className="space-y-6">
        {growthChallenges.map((challenge) => {
          const completedCount = challenge.days.filter((d) => d.completed).length;
          const progressPercent = Math.round((completedCount / challenge.days.length) * 100);

          return (
            <Card key={challenge.id} padding="lg" className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div>
                  <Badge variant="zinc">{challenge.category}</Badge>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-1.5">{challenge.title}</h3>
                  <p className="text-xs text-zinc-500">{challenge.description}</p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs font-bold text-zinc-700">
                    {completedCount} of {challenge.days.length} completed ({progressPercent}%)
                  </span>
                  <div className="w-32 max-w-full h-2 bg-zinc-100 rounded-full overflow-hidden mt-1 sm:ml-auto">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Day Tasks List */}
              <div className="space-y-2.5">
                {challenge.days.map((day) => (
                  <div
                    key={day.dayNumber}
                    onClick={() => toggleChallengeDay(challenge.id, day.dayNumber)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      day.completed
                        ? 'bg-emerald-50/60 border-emerald-200 text-zinc-900'
                        : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {day.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-zinc-500">Day {day.dayNumber}</span>
                        <h4 className={`text-xs font-bold ${day.completed ? 'line-through text-zinc-500' : 'text-zinc-900'}`}>
                          {day.task}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{day.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action bottom bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setActiveTab('couple-mode')}
                  className="font-semibold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Sync progress in Couple Mode</span>
                </button>

                <span className="text-zinc-500 font-medium flex items-center gap-1">
                  {completedCount === 7 ? (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> Completed, badge awarded
                    </>
                  ) : (
                    'Tap any day to check it off'
                  )}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
};
