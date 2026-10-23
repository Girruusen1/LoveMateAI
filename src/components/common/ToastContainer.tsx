import React from 'react';
import { AlertCircle, CheckCircle, Heart, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-200/90 text-xs font-semibold text-zinc-900 animate-in slide-in-from-right-5 fade-in duration-200"
        >
          {toast.type === 'love' && (
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            </div>
          )}
          {toast.type === 'success' && (
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="leading-snug">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
