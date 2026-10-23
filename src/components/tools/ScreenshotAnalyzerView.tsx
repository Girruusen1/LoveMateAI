import React, { useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  Copy,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAiLimitError } from '../../utils/aiErrors';
import { copyText } from '../../utils/clipboard';
import { AIService } from '../../services/ai';
import { ScreenshotAnalysis } from '../../types';
import { Badge, Button, Card, PageContainer, PageHeader, ToolLayout } from '../common/UIPrimitives';

const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024; // 10MB

/** Returns an error message, or null when the file is an acceptable image. */
const validateScreenshot = (file: File): string | null => {
  if (!file.type.startsWith('image/')) return `"${file.name}" isn't an image. Upload a PNG, JPG or WebP screenshot.`;
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Screenshots must be 10MB or smaller.`;
  }
  return null;
};

export const ScreenshotAnalyzerView: React.FC = () => {
  const { addPoints, showToast, triggerConfetti } = useApp();

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ScreenshotAnalysis | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    const error = validateScreenshot(file);
    if (error) {
      setFileError(error);
      return;
    }
    setFileError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      runAnalysis(file.name, reader.result as string);
    };
    reader.onerror = () => setFileError("Couldn't read that file. Try another screenshot.");
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = ''; // allow re-selecting the same file after an error
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleSampleUpload = () => {
    // Demo WhatsApp sample screenshot preview
    setFileError(null);
    setPreviewImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&fit=crop');
    runAnalysis('sample_chat_screenshot.png');
  };

  const runAnalysis = async (fileName: string, imageDataUrl?: string) => {
    setIsAnalyzing(true);
    try {
      const res = await AIService.analyzeScreenshot(fileName, imageDataUrl);
      setAnalysis(res);
      addPoints(20, 'Analyzed Chat Screenshot');
      triggerConfetti();
      showToast('Screenshot decoded securely! 📸', 'love');
    } catch (e) {
      if (!isAiLimitError(e)) showToast('Error analyzing screenshot', 'info');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteScreenshot = () => {
    setPreviewImage(null);
    setAnalysis(null);
    setFileError(null);
    showToast('Screenshot and extracted conversation safely erased from memory 🗑️', 'info');
  };

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (!ok) {
      showToast("Couldn't copy. Please copy manually.", 'info');
      return;
    }
    setCopiedId(id);
    showToast('Reply copied! 📋', 'love');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const form = (
    <Card>
      <div className="space-y-5">
        {!previewImage ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center space-y-4 hover:border-rose-400 transition-colors bg-zinc-50/50 ${
              isDragging ? 'border-rose-400' : 'border-zinc-200'
            }`}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Upload a chat screenshot</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                PNG, JPG, or WebP up to 10MB. Text is extracted securely in temporary memory.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <label className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs shadow-rose-200 cursor-pointer transition-all select-none">
                Choose image
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <Button variant="secondary" onClick={handleSampleUpload}>
                Try a sample chat
              </Button>
            </div>

            {fileError && (
              <p role="alert" className="text-xs font-semibold text-rose-600 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {fileError}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-200 overflow-hidden shrink-0">
                <img src={previewImage} alt="Uploaded screenshot" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">Active screenshot</h4>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Private session
                </span>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteScreenshot}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete screenshot
            </Button>
          </div>
        )}

        {/* Privacy Assurance Notice */}
        <div className="p-3 bg-zinc-50 rounded-xl text-xs text-zinc-500 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Your screenshot is strictly private. It is never stored publicly and is erased when you click delete.
          </span>
        </div>
      </div>
    </Card>
  );

  const resultView = isAnalyzing ? (
    <div className="space-y-4">
      <Card>
        <div className="py-6 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-600 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900">Extracting visible messages and subtext...</h4>
          <p className="text-xs text-zinc-500">Evaluating tone, response frequency, and conversation flow.</p>
        </div>
      </Card>
    </div>
  ) : analysis ? (
    <div className="space-y-4">
      <Card>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <span className="text-xs text-zinc-500">Decoded conversation flow</span>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mt-0.5">{analysis.conversationTone}</h2>
            </div>
            <Badge variant="zinc" size="md">
              {analysis.energyLevel} energy
            </Badge>
          </div>

          {/* Extracted Chat Transcript */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Extracted messages
            </span>
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-700">
              {analysis.extractedSnippet}
            </pre>
          </div>

          {/* Potential Misunderstandings */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Potential misunderstandings
            </h3>
            <div className="space-y-1.5 text-xs">
              {analysis.potentialMisunderstandings.map((p, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900">
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Next Messages */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-zinc-900">Suggested next messages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.suggestedReplies.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-rose-700 border border-rose-200 uppercase">
                      {item.vibe}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy('rep_' + idx, item.reply)}
                      icon={
                        copiedId === 'rep_' + idx ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )
                      }
                    >
                      {copiedId === 'rep_' + idx ? 'Copied' : 'Copy'}
                    </Button>
                  </div>

                  <p className="text-sm font-semibold text-zinc-900 bg-white p-2.5 rounded-xl border border-zinc-100 italic">
                    "{item.reply}"
                  </p>

                  <p className="text-xs text-rose-700 italic">Hinglish: "{item.hinglishReply}"</p>

                  <p className="text-xs text-zinc-500 leading-tight">
                    <strong className="text-zinc-700">Why:</strong> {item.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Camera />}
        title="Screenshot analyzer"
        subtitle="Upload a chat screenshot from WhatsApp, Instagram, or iMessage. Get a private tone breakdown and high-EQ replies."
      />

      <ToolLayout
        form={form}
        result={resultView}
        placeholder={{
          icon: <Camera />,
          title: 'Your analysis appears here',
          description: 'Upload a screenshot or try the sample chat to get a tone breakdown and suggested replies.',
        }}
      />
    </PageContainer>
  );
};
