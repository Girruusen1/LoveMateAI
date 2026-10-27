import React from 'react';

/** Light placeholder shown while a page or a hub mode loads. */
export const PageSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
    {!compact && (
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-zinc-200/70 shrink-0" />
        <div className="space-y-2 pt-1">
          <div className="h-6 w-56 max-w-full rounded-full bg-zinc-200/70" />
          <div className="h-3.5 w-80 max-w-full rounded-full bg-zinc-100" />
        </div>
      </div>
    )}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-64 rounded-3xl bg-white border border-zinc-200/80" />
      <div className="h-64 rounded-3xl bg-white border border-zinc-200/80 hidden lg:block" />
    </div>
  </div>
);
