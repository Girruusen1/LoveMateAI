import React, { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { AI_STATUS_EVENT, cachedGenAIStatus, getGenAIStatus, type GenAIStatus } from '../../services/genaiClient';

const DISMISS_KEY = 'lovemate_demo_banner_dismissed_v1';

/** Tells users plainly when AI answers are simulated because no model is configured on the server. */
export const GenAIStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<GenAIStatus | null>(cachedGenAIStatus());
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onStatus = (e: Event) => setStatus((e as CustomEvent<GenAIStatus>).detail);
    window.addEventListener(AI_STATUS_EVENT, onStatus);
    void getGenAIStatus().then(setStatus);
    return () => window.removeEventListener(AI_STATUS_EVENT, onStatus);
  }, []);

  if (!status || status.enabled || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 text-xs sm:text-sm">
        <FlaskConical className="w-4 h-4 shrink-0 text-amber-600" />
        <p className="flex-1">
          <span className="font-semibold">Demo mode.</span> AI answers are simulated because no AI key is configured on the server. Add{' '}
          free <code className="px-1 rounded bg-amber-100">GROQ_API_KEY</code> and <code className="px-1 rounded bg-amber-100">OPENROUTER_API_KEY</code> keys to{' '}
          <code className="px-1 rounded bg-amber-100">.env.local</code> and restart to turn on real AI.
        </p>
        <button
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(DISMISS_KEY, '1');
            } catch {
              /* ignore */
            }
          }}
          aria-label="Dismiss"
          className="p-1 rounded-md hover:bg-amber-100 text-amber-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
