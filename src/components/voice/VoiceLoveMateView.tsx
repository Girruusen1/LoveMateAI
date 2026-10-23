import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Headphones, Mic, MicOff, RotateCcw, Send, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/ai';
import { isAiLimitError } from '../../utils/aiErrors';
import { Button, Card, Chip, Input, PageContainer, PageHeader, SectionHeading, ToolLayout } from '../common/UIPrimitives';

// Minimal Web Speech API typings (not part of the standard TS DOM lib in every version)
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionCtor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export const VoiceLoveMateView: React.FC = () => {
  const { user, addPoints, showToast, triggerConfetti } = useApp();

  const [speechSupported] = useState(() => getSpeechRecognition() !== null);
  const [isRecording, setIsRecording] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const [aiVoiceResponse, setAiVoiceResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [history, setHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: `Hey ${user?.name || 'there'}! Tap the microphone and tell me what's going on. Speak in English, Hinglish, or whatever feels natural! ❤️`,
    },
  ]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');
  const abortedRef = useRef(false);
  const voiceMutedRef = useRef(voiceMuted);
  voiceMutedRef.current = voiceMuted;

  // Stop listening and any speech output when leaving the screen
  useEffect(() => {
    return () => {
      abortedRef.current = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const sampleVoicePrompts = [
    'Yaar kal usse milna hai aur mujhe samajh nahi aa raha kya bolu',
    'Does my crush like me or am I totally overthinking this?',
    'We had an awkward silence on our last phone call',
  ];

  const speak = (text: string) => {
    if (voiceMutedRef.current || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const processText = async (rawText: string) => {
    const spokenText = rawText.trim();
    if (!spokenText || isThinking) return;

    setHistory((prev) => [...prev, { sender: 'user', text: spokenText }]);
    setIsThinking(true);

    try {
      const reply = await AIService.generateChatReply(spokenText, [], 'wingman', 'hinglish');
      setAiVoiceResponse(reply);
      setHistory((prev) => [...prev, { sender: 'ai', text: reply }]);
      addPoints(15, 'Voice Chat with AI');
      triggerConfetti();
      speak(reply);
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Error processing voice query', 'info');
    } finally {
      setIsThinking(false);
    }
  };

  const startRecording = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const recognition = new Ctor();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;

    transcriptRef.current = '';
    abortedRef.current = false;
    setFinalText('');
    setInterimText('');
    setMicError(null);

    recognition.onresult = (event) => {
      let finalPart = '';
      let interimPart = '';
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript || '';
        if (res.isFinal) finalPart += text;
        else interimPart += text;
      }
      setFinalText(finalPart);
      setInterimText(interimPart);
      transcriptRef.current = `${finalPart} ${interimPart}`.trim();
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      const message =
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone access was blocked. Allow the microphone in your browser settings, or type your message below.'
          : event.error === 'no-speech'
          ? "Didn't catch anything. Try again a little closer to the mic."
          : event.error === 'audio-capture'
          ? 'No microphone was found. Type your message below instead.'
          : 'Voice input stopped unexpectedly. Try again or type your message below.';
      setMicError(message);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsRecording(false);
      setInterimText('');
      if (abortedRef.current) return;
      const text = transcriptRef.current;
      transcriptRef.current = '';
      if (text) void processText(text);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      setMicError('Could not start the microphone. Type your message below instead.');
    }
  };

  const stopRecording = () => {
    // onend fires after stop() and sends whatever was transcribed
    recognitionRef.current?.stop();
  };

  const handleToggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typedText.trim();
    if (!text) return;
    setTypedText('');
    void processText(text);
  };

  const handleReplayVoice = () => {
    if (!aiVoiceResponse) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(aiVoiceResponse);
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
      showToast('Replaying voice response 🔊', 'info');
    }
  };

  const handleToggleMute = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    if (next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const liveTranscript = `${finalText} ${interimText}`.trim();
  const showTextFallback = !speechSupported || micError !== null;

  const form = (
    <Card padding="lg" className="text-center space-y-6">
      {speechSupported ? (
        <>
          {/* Animated Mic Button */}
          <div className="relative inline-block">
            {isRecording && <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-30" />}

            <button
              type="button"
              onClick={handleToggleRecording}
              disabled={isThinking}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              aria-pressed={isRecording}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-lg hover:scale-105 cursor-pointer relative z-10 text-white disabled:opacity-60 ${
                isRecording ? 'bg-rose-600 shadow-rose-300 ring-4 ring-rose-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              {isRecording ? <MicOff className="w-10 h-10 animate-pulse" /> : <Mic className="w-10 h-10" />}
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                {isRecording ? 'Tap to stop' : 'Tap to speak'}
              </span>
            </button>
          </div>

          {/* Live Audio Transcript Display */}
          <div className="min-h-[50px] flex items-center justify-center" aria-live="polite">
            <p className="text-sm text-zinc-600 italic max-w-md mx-auto">
              {isRecording ? (
                liveTranscript ? (
                  <>
                    {finalText}
                    {interimText && <span className="text-zinc-400"> {interimText}</span>}
                  </>
                ) : (
                  'Listening... Speak naturally...'
                )
              ) : (
                'Tap the microphone or choose a prompt below.'
              )}
            </p>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>Voice input isn't supported in this browser. Type your message instead.</span>
        </div>
      )}

      {micError && (
        <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{micError}</span>
        </div>
      )}

      {showTextFallback && (
        <form onSubmit={handleTypedSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type what you'd like to say..."
            className="flex-1"
            aria-label="Type your message"
          />
          <Button
            type="submit"
            variant="primary"
            className="h-10 w-10 px-0 shrink-0"
            disabled={!typedText.trim() || isThinking}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}

      {/* Voice Controls: Mute Voice / Replay */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleToggleMute}
          icon={voiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-rose-500" />}
        >
          {voiceMuted ? 'Voice muted' : 'Voice on'}
        </Button>

        {aiVoiceResponse && (
          <Button variant="ghost" size="sm" onClick={handleReplayVoice} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Replay audio
          </Button>
        )}
      </div>

      {/* Sample Voice Prompts */}
      <div className="pt-4 border-t border-zinc-100 space-y-2 text-left">
        <span className="text-xs text-zinc-500 block">Try saying one of these</span>
        <div className="flex flex-wrap gap-2">
          {sampleVoicePrompts.map((p, idx) => (
            <Chip key={idx} className="whitespace-normal text-left" onClick={() => void processText(p)}>
              {p}
            </Chip>
          ))}
        </div>
      </div>
    </Card>
  );

  const result = (
    <div className="space-y-4">
      <SectionHeading title="Conversation" description="What you said and how LoveMate replied." />

      <div className="space-y-2.5">
        {history.map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-rose-50/80 border-rose-200 text-zinc-900 ml-6'
                : 'bg-white border-zinc-200 text-zinc-800 mr-6 shadow-2xs'
            }`}
          >
            <span className="font-bold text-[10px] uppercase tracking-wider block mb-1 text-zinc-400">
              {msg.sender === 'user' ? 'You said' : 'LoveMate'}
            </span>
            {msg.text}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-1">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        icon={<Headphones />}
        title="Voice chat"
        subtitle="Speak out loud. LoveMate listens, transcribes and replies with warm, practical advice."
      />

      <ToolLayout
        form={form}
        result={history.length > 0 ? result : null}
        placeholder={{
          icon: <Mic />,
          title: 'Your conversation will appear here',
          description: 'Tap the microphone or pick a sample prompt to start talking with LoveMate.',
        }}
      />
    </PageContainer>
  );
};
