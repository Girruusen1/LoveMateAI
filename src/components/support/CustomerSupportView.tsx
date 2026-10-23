import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  LifeBuoy,
  MessageSquare,
  Plus,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportTicket } from '../../types';
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
} from '../common/UIPrimitives';

export const CustomerSupportView: React.FC = () => {
  const {
    supportTickets,
    createSupportTicket,
    reportAiIssue,
    user,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tickets' | 'new_ticket' | 'report_ai'>('tickets');

  // Form State for Ticket
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<SupportTicket['category']>('technical_bug');
  const [ticketDescription, setTicketDescription] = useState('');

  // Form State for AI Issue Reporting
  const [aiFeature, setAiFeature] = useState('Relationship Copilot');
  const [aiCategory, setAiCategory] = useState<'incorrect' | 'unhelpful' | 'unsafe' | 'inappropriate' | 'privacy_concern' | 'technical'>('unhelpful');
  const [aiDetails, setAiDetails] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      showToast('Please fill in both subject and description.', 'info');
      return;
    }
    createSupportTicket(ticketSubject.trim(), ticketCategory, ticketDescription.trim());
    setTicketSubject('');
    setTicketDescription('');
    setActiveTab('tickets');
  };

  const handleReportAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDetails.trim()) {
      showToast('Please describe the AI issue.', 'info');
      return;
    }
    reportAiIssue(aiFeature, aiCategory, aiDetails.trim());
    setAiDetails('');
    showToast('AI response issue reported. Sent to prompt calibration pipeline.', 'success');
    setActiveTab('tickets');
  };

  const tabs = [
    { id: 'tickets', label: `My tickets (${supportTickets.length})`, icon: <MessageSquare /> },
    { id: 'new_ticket', label: 'Open a ticket', icon: <Plus /> },
    { id: 'report_ai', label: 'Report an AI response', icon: <AlertTriangle /> },
  ] as const;

  const statusVariant = (status: SupportTicket['status']) =>
    status === 'resolved' ? 'emerald' : status === 'in_progress' ? 'blue' : 'amber';

  return (
    <PageContainer>
      <PageHeader
        icon={<LifeBuoy />}
        title="Support"
        subtitle="Help with billing, couple sync, or an AI response that felt off. We reply to every ticket within 24 hours."
        actions={
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setActiveTab('new_ticket')}>
            New ticket
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Chip key={tab.id} selected={activeTab === tab.id} icon={tab.icon} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </Chip>
        ))}
      </div>

      {/* Tab 1: Ticket history */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <SectionHeading title="Your support inquiries" />

          <div className="space-y-3">
            {supportTickets.map((t) => (
              <Card key={t.id} padding="sm" className="space-y-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-zinc-400">{t.id}</span>
                    <span className="text-sm font-bold text-zinc-900">{t.subject}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="zinc">{t.category.replace('_', ' ')}</Badge>
                    <Badge variant={statusVariant(t.status)}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 leading-relaxed">{t.description}</p>

                {t.resolutionNote && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-0.5">
                    <span className="font-bold flex items-center gap-1 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolution note
                    </span>
                    <p>{t.resolutionNote}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                  <span>Created: {t.createdAt}</span>
                  <span>Priority: {t.priority}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Create ticket */}
      {activeTab === 'new_ticket' && (
        <Card className="space-y-6 max-w-2xl">
          <SectionHeading title="Open a new ticket" description="We respond to all tickets within 24 hours." />

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <FieldLabel>Issue category</FieldLabel>
              <Select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value as any)}
              >
                <option value="billing">Subscription and billing</option>
                <option value="technical_bug">Technical bug or sync issue</option>
                <option value="ai_response">AI tone or response feedback</option>
                <option value="feature_request">Feature request or suggestion</option>
                <option value="safety">Trust and safety concern</option>
              </Select>
            </div>

            <div>
              <FieldLabel>Subject</FieldLabel>
              <Input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of the issue..."
              />
            </div>

            <div>
              <FieldLabel>Detailed description</FieldLabel>
              <Textarea
                rows={4}
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="What happened? What were you expecting?"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setActiveTab('tickets')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<Send className="w-3.5 h-3.5" />}>
                Submit ticket
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Report AI issue */}
      {activeTab === 'report_ai' && (
        <Card className="space-y-6 max-w-2xl">
          <SectionHeading
            title="Report an AI response"
            description="Did LoveMate give incorrect, unhelpful or insensitive advice? Our safety team reviews every flagged output."
          />

          <form onSubmit={handleReportAi} className="space-y-4">
            <div>
              <FieldLabel>Feature or tool involved</FieldLabel>
              <Select
                value={aiFeature}
                onChange={(e) => setAiFeature(e.target.value)}
              >
                <option value="Relationship Copilot">Relationship Copilot</option>
                <option value="What Should I Reply?">What Should I Reply?</option>
                <option value="Decode This">Decode This Text</option>
                <option value="Couple AI (Shared Space)">Couple AI (Shared Space)</option>
                <option value="Agent Task Engine">Agent Task Engine</option>
                <option value="Surprise Mode Planner">Surprise Mode Planner</option>
                <option value="Crush Signal Analyzer">Crush Signal Analyzer</option>
              </Select>
            </div>

            <div>
              <FieldLabel>Category of issue</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'unhelpful', label: 'Unhelpful or generic' },
                  { id: 'incorrect', label: 'Factual error' },
                  { id: 'unsafe', label: 'Unsafe or risky advice' },
                  { id: 'inappropriate', label: 'Inappropriate tone' },
                  { id: 'privacy_concern', label: 'Privacy concern' },
                  { id: 'technical', label: 'Generation cut off' },
                ].map((cat) => (
                  <Chip key={cat.id} selected={aiCategory === cat.id} onClick={() => setAiCategory(cat.id as any)}>
                    {cat.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>What was wrong?</FieldLabel>
              <Textarea
                rows={4}
                value={aiDetails}
                onChange={(e) => setAiDetails(e.target.value)}
                placeholder="What did the AI suggest, and why was it problematic or off-key?"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setActiveTab('tickets')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                Flag response
              </Button>
            </div>
          </form>
        </Card>
      )}
    </PageContainer>
  );
};
