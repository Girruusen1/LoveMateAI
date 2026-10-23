import React, { useState } from 'react';
import { AlertTriangle, Copy, Mic, MicOff, MessageSquareText, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { VoiceCommunicationAudit } from '../../types';
import {
  Button,
  Card,
  Chip,
  FieldLabel,
  PageContainer,
  PageHeader,
  Textarea,
  ToolLayout,
} from '../common/UIPrimitives';

export const CommunicationCoachView: React.FC = () => {
  const { setActiveTab, showToast } = useApp();

  const [spokenText, setSpokenText] = useState(
    "You never text me when you get free and you always make excuses about work."
  );
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<VoiceCommunicationAudit | null>(null);

  const sampleVoiceAudits = [
    {
      label: 'Accusatory',
      text: "You never text me when you get free and you always make excuses about work.",
    },
    {
      label: 'Passive aggressive',
      text: "Fine whatever, do whatever you want. It's always my fault anyway.",
    },
    {
      label: 'Vulnerable and constructive',
      text: "Hey, I noticed we haven't spent quiet time together this week and I've really been missing our conversations.",
    },
  ];

  const handleAudit = async () => {
    if (!spokenText.trim()) return;
    setLoading(true);
    try {
      const res = await AIService.auditVoiceCommunication(spokenText);
      setAudit(res);
      showToast('Communication audit completed! 🎙️', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Audit error', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMic = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Speech recognition not supported in this browser, typing supported!', 'info');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      if (!isRecording) {
        recognition.start();
        setIsRecording(true);
        showToast('Listening... Speak your message naturally', 'love');

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSpokenText(transcript);
          setIsRecording(false);
          showToast('Speech captured! Analyzing phrasing...', 'success');
        };

        recognition.onerror = () => {
          setIsRecording(false);
          showToast('Microphone error or permission denied', 'info');
        };

        recognition.onend = () => {
          setIsRecording(false);
        };
      } else {
        recognition.stop();
        setIsRecording(false);
      }
    } catch (e) {
      setIsRecording(false);
      showToast('Speech recognition unavailable, please type below', 'info');
    }
  };

  const form = (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel className="mb-0">What do you plan to say?</FieldLabel>

        <Button
          variant={isRecording ? 'primary' : 'secondary'}
          size="sm"
          onClick={handleToggleMic}
          icon={isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-500" />}
          className={isRecording ? 'animate-pulse' : ''}
        >
          {isRecording ? 'Listening, tap to stop' : 'Record'}
        </Button>
      </div>

      <Textarea
        rows={4}
        value={spokenText}
        onChange={(e) => setSpokenText(e.target.value)}
        placeholder="Speak or type what you want to say..."
      />

      {/* Quick Samples */}
      <div className="space-y-1.5">
        <span className="text-xs text-zinc-500">Try a sample</span>
        <div className="flex flex-wrap gap-2">
          {sampleVoiceAudits.map((sample) => (
            <Chip key={sample.label} selected={spokenText === sample.text} onClick={() => setSpokenText(sample.text)}>
              {sample.label}
            </Chip>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleAudit}
        disabled={!spokenText.trim()}
        loading={loading}
        icon={<Sparkles className="w-4 h-4" />}
      >
        Check my tone
      </Button>
    </Card>
  );

  const result = audit ? (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clarity & Safety Score */}
        <Card className="space-y-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Clarity score</span>
          <p className="text-4xl font-bold text-zinc-900">{audit.clarityScore} / 10</p>
          <p className="text-xs text-zinc-500">
            {audit.clarityScore >= 8
              ? 'Great emotional control and non-confrontational phrasing.'
              : 'Contains phrases likely to trigger a defensive shutdown in your partner.'}
          </p>
        </Card>

        {/* Triggers Detected */}
        <Card className="space-y-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trigger words flagged</span>
          {audit.confrontationalTriggerWords.length === 0 ? (
            <p className="text-xs text-zinc-500">No defensive triggers found.</p>
          ) : (
            <ul className="space-y-1 text-xs font-bold text-amber-800">
              {audit.confrontationalTriggerWords.map((trig, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{trig}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Constructive Alternative */}
      <Card variant="accent" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">A better way to say it</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const ok = await copyText(audit.constructiveAlternative);
              if (!ok) {
                showToast("Couldn't copy. Please copy manually.", 'info');
                return;
              }
              showToast('Alternative copied! 📋', 'love');
            }}
            icon={<Copy className="w-3 h-3" />}
          >
            Copy phrasing
          </Button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 text-xs sm:text-sm font-semibold text-zinc-800 leading-relaxed">
          {audit.constructiveAlternative}
        </div>

        <p className="text-xs text-zinc-600">{audit.coachAdvice}</p>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<MessageSquareText />}
        title="Tone coach"
        subtitle='Speak or type what you plan to say. LoveMate flags defensive phrasing like "you always" or "whatever" and suggests a constructive alternative.'
      />
      <p className="text-xs text-zinc-500 -mt-2">
        We do not claim to detect hidden emotions from audio. We analyze phrasing structure, clarity and common defensiveness triggers.
      </p>

      <ToolLayout
        form={form}
        result={result}
        placeholder={{
          icon: <MessageSquareText />,
          title: 'Your tone report will appear here',
          description: 'Record or type a message on the left and we will flag trigger phrasing and suggest a softer version.',
        }}
      />
    </PageContainer>
  );
};
