import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { applyStoredTheme } from './components/common/theme';
import App from './App.tsx';

// Apply light/dark before the first paint so there is no flash of the wrong theme.
applyStoredTheme();

interface BoundaryState {
  error: Error | null;
}

/** Last-resort error boundary so one broken view never blanks the whole app. */
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('LoveMate crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F8] p-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 text-center">
          <h1 className="text-lg font-bold text-zinc-900">Something went wrong</h1>
          <p className="text-sm text-zinc-500 mt-2">
            This page hit an error. Your saved data is safe. Reload to continue, or go back to the home page.
          </p>
          <pre className="mt-4 text-left text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl p-3 overflow-auto max-h-32">
            {this.state.error.message}
          </pre>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="px-4 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
            >
              Go to home
            </button>
            <button onClick={() => window.location.reload()} className="px-4 h-10 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
