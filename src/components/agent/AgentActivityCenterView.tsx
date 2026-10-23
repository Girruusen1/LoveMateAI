import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  ListChecks,
  Mail,
  Plane,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  Wine,
  XCircle,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentTaskStatus, AgentTaskType } from '../../types';
import { Badge, Button, Card, Chip, EmptyState, PageContainer, PageHeader } from '../common/UIPrimitives';

export const AgentActivityCenterView: React.FC = () => {
  const {
    agentTasks,
    updateAgentTaskStatus,
    confirmAgentTask,
    cancelAgentTask,
    deleteAgentTask,
    setActiveTab,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_confirmation' | 'planned' | 'scheduled' | 'completed'>('all');

  const filteredTasks = agentTasks.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const awaitingCount = agentTasks.filter((t) => t.status === 'awaiting_confirmation').length;
  const completedCount = agentTasks.filter((t) => t.status === 'completed').length;
  const scheduledCount = agentTasks.filter((t) => t.status === 'scheduled' || t.status === 'planned').length;

  const renderStatusBadge = (status: AgentTaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="emerald">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </Badge>
        );
      case 'awaiting_confirmation':
        return (
          <Badge variant="amber">
            <AlertTriangle className="w-3 h-3" /> Awaiting confirmation
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="blue">
            <Clock className="w-3 h-3" /> Scheduled
          </Badge>
        );
      case 'planned':
        return (
          <Badge variant="purple">
            <Sparkles className="w-3 h-3" /> Planned
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="zinc">
            <XCircle className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="zinc">{status}</Badge>;
    }
  };

  const renderPermissionBadge = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <ShieldCheck className="w-3 h-3" /> Safe auto (L1)
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
            <Clock className="w-3 h-3" /> You confirm (L2)
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
            <AlertTriangle className="w-3 h-3" /> Explicit confirm (L3)
          </span>
        );
    }
  };

  const getTaskIcon = (type: AgentTaskType) => {
    switch (type) {
      case 'anniversary_plan':
      case 'date_plan':
        return <Wine />;
      case 'gift_plan':
        return <Gift />;
      case 'message_plan':
        return <Mail />;
      case 'relationship_checkin':
        return <Sprout />;
      case 'calendar_event':
        return <Calendar />;
      case 'trip_plan':
        return <Plane />;
      case 'surprise_plan':
        return <Sparkles />;
      default:
        return <Zap />;
    }
  };

  const filters = [
    { id: 'all', label: 'All tasks' },
    { id: 'awaiting_confirmation', label: `Pending (${awaitingCount})` },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'completed', label: 'Completed' },
  ] as const;

  return (
    <PageContainer narrow>
      <PageHeader
        icon={<Activity />}
        title="Agent activity"
        subtitle="Review automated actions, plans in progress, reminders and anything waiting for your confirmation."
        actions={
          <Button variant="primary" size="sm" icon={<Bot className="w-3.5 h-3.5" />} onClick={() => setActiveTab('copilot')}>
            Ask LoveMate
          </Button>
        }
      />
      <p className="text-xs text-zinc-500 -mt-2">LoveMate never executes sensitive actions without your explicit permission.</p>

      {/* Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-amber-600">{awaitingCount}</p>
          <p className="text-xs text-zinc-500">Need confirmation</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-zinc-900">{scheduledCount}</p>
          <p className="text-xs text-zinc-500">Scheduled or planned</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
          <p className="text-xs text-zinc-500">Completed</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((tab) => (
          <Chip key={tab.id} selected={statusFilter === tab.id} onClick={() => setStatusFilter(tab.id)}>
            {tab.label}
          </Chip>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="w-6 h-6" />}
            title="No tasks in this category"
            description="Ask LoveMate to plan your next date, anniversary or apology and it will appear here."
            actionLabel="Ask LoveMate"
            onAction={() => setActiveTab('copilot')}
          />
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} padding="sm" className="hover:border-rose-200 space-y-3.5 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                    {getTaskIcon(task.type)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-zinc-900">{task.title}</h3>
                      {renderStatusBadge(task.status)}
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{task.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  {renderPermissionBadge(task.permissionLevel)}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    Source: {task.source}
                  </span>
                </div>
              </div>

              {task.executionData && (
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(task.executionData).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-zinc-400 uppercase text-[9px] font-bold block">{key}</span>
                      <span className="font-semibold text-zinc-800">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                <span className="text-xs text-zinc-500">
                  Target: <strong className="text-zinc-700">{task.scheduledAt}</strong>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {task.status === 'awaiting_confirmation' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => confirmAgentTask(task.id)}
                    >
                      Confirm and run
                    </Button>
                  )}

                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => updateAgentTaskStatus(task.id, 'completed')}
                    >
                      Complete
                    </Button>
                  )}

                  {task.status !== 'cancelled' && task.status !== 'completed' && (
                    <Button variant="ghost" size="sm" onClick={() => cancelAgentTask(task.id)}>
                      Cancel
                    </Button>
                  )}

                  <button
                    onClick={() => deleteAgentTask(task.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
};
