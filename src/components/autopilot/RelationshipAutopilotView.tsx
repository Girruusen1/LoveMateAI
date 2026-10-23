import React, { useState } from 'react';
import {
  CalendarHeart,
  Gift,
  Globe,
  Moon,
  Pause,
  Play,
  Shield,
  Sprout,
  Wine,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Card, FieldLabel, Input, PageContainer, PageHeader, SectionHeading } from '../common/UIPrimitives';

export const RelationshipAutopilotView: React.FC = () => {
  const {
    autopilotSettings,
    toggleAutopilot,
    updateAutopilotSetting,
    showToast,
  } = useApp();

  const [masterPaused, setMasterPaused] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('09:00');

  const activeCount = autopilotSettings.filter((a) => a.enabled && !masterPaused).length;

  const handleToggleMaster = () => {
    setMasterPaused(!masterPaused);
    showToast(
      !masterPaused ? 'All relationship automations paused' : 'Relationship Autopilot resumed',
      'info'
    );
  };

  const ruleIcon = (key: string) => {
    switch (key) {
      case 'anniversary_prep':
        return <Gift />;
      case 'weekly_date_suggestion':
        return <Wine />;
      case 'sunday_checkin':
        return <Sprout />;
      case 'long_distance_weekend':
        return <Globe />;
      case 'growth_challenge':
        return <Zap />;
      default:
        return <CalendarHeart />;
    }
  };

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Zap />}
        title="Autopilot"
        subtitle="LoveMate quietly tracks upcoming dates, suggests weekly plans and prompts gentle check-ins without nagging."
        actions={
          <Button
            variant={masterPaused ? 'primary' : 'secondary'}
            size="sm"
            icon={masterPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            onClick={handleToggleMaster}
          >
            {masterPaused ? 'Resume autopilot' : 'Pause all'}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 -mt-2">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${masterPaused ? 'bg-zinc-300' : 'bg-emerald-500'}`} />
          <strong className="text-zinc-700">{activeCount} of {autopilotSettings.length}</strong> automations active
        </span>
        <span className="flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5" />
          Quiet hours: <strong className="text-zinc-700">{quietStart} – {quietEnd}</strong>
        </span>
      </div>

      {/* Quiet hours */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-600" />
          <h3 className="text-base font-bold text-zinc-900">Quiet hours and limits</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
            <FieldLabel>Do not disturb window</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-auto"
              />
              <span className="text-xs text-zinc-400">to</span>
              <Input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-auto"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Automated reminders wait silently in the queue during these hours.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
            <FieldLabel>Notification budget</FieldLabel>
            <p className="font-bold text-zinc-900 text-sm">Up to 3 gentle prompts a week</p>
            <p className="text-xs text-zinc-500 mt-2">
              No guilt messages, no manipulation and no relationship-anxiety alerts.
            </p>
          </div>
        </div>
      </Card>

      {/* Automations */}
      <div className="space-y-3">
        <SectionHeading title="Automations" description="Toggle each rule on or off." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {autopilotSettings.map((rule) => {
            const isEnabled = rule.enabled && !masterPaused;
            return (
              <div
                key={rule.id}
                className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between gap-4 ${
                  isEnabled
                    ? 'bg-white border-zinc-200 hover:border-rose-200'
                    : 'bg-zinc-50/70 border-zinc-200/60 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4">
                        {ruleIcon(rule.key)}
                      </span>
                      <h3 className="font-bold text-sm text-zinc-900">{rule.title}</h3>
                    </div>

                    <button
                      onClick={() => toggleAutopilot(rule.id)}
                      disabled={masterPaused}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        isEnabled ? 'bg-rose-600' : 'bg-zinc-300'
                      }`}
                      aria-label={`Toggle ${rule.title}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-transform block absolute top-1 shadow-xs ${
                          isEnabled ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed">{rule.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <span className="capitalize">Frequency: {rule.frequency}</span>
                  {rule.lastTriggered && <span>Last run: {rule.lastTriggered}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
};
