import React from 'react';
import { ArrowRight, Check, Heart, Sparkles, X, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Button, Card, CardSkeleton, EmptyState } from './UIPrimitives';
import { LoveMateLogo } from './LoveMateLogo';

export const DesignSystemModal: React.FC = () => {
  const { designSystemOpen, setDesignSystemOpen } = useApp();

  if (!designSystemOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200/90 shadow-2xl p-6 sm:p-10 space-y-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <LoveMateLogo variant="compact" size="md" />
            <div>
              <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">
                Design System & Visual Spec
              </h2>
              <p className="text-xs text-zinc-500">
                Centralized semantic tokens, typography, surfaces & components
              </p>
            </div>
          </div>
          <button
            onClick={() => setDesignSystemOpen(false)}
            className="p-2 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. COLOR TOKENS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              1. Color Tokens & Brand Palette
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">--primary, --secondary, --neutral</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#F43F5E] text-white space-y-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Primary Rose</span>
              <p className="font-mono text-xs font-bold">#F43F5E</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#E11D48] text-white space-y-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Primary Hover</span>
              <p className="font-mono text-xs font-bold">#E11D48</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#7C3AED] text-white space-y-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Secondary Violet</span>
              <p className="font-mono text-xs font-bold">#7C3AED</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#10B981] text-white space-y-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Success</span>
              <p className="font-mono text-xs font-bold">#10B981</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9F8] text-zinc-900 border border-zinc-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Background</span>
              <p className="font-mono text-xs font-bold">#FAF9F8</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#18181B] text-white space-y-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Foreground</span>
              <p className="font-mono text-xs font-bold">#18181B</p>
            </div>
          </div>
        </section>

        {/* 2. TYPOGRAPHY HIERARCHY */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
            2. Typography Hierarchy
          </h3>
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
            <div className="flex items-baseline justify-between border-b border-zinc-200/50 pb-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900">Display Header</span>
              <span className="text-xs font-mono text-zinc-400">800 weight, -0.025em tracking</span>
            </div>
            <div className="flex items-baseline justify-between border-b border-zinc-200/50 pb-2">
              <span className="text-lg sm:text-xl font-bold text-zinc-900">Section Header (H2)</span>
              <span className="text-xs font-mono text-zinc-400">700 weight, -0.02em tracking</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs sm:text-sm text-zinc-600 font-medium">
                Body reading text with comfortable line height and warm contrast.
              </span>
              <span className="text-xs font-mono text-zinc-400">500 weight, 1.6 line-height</span>
            </div>
          </div>
        </section>

        {/* 3. BUTTON SYSTEM */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
            3. Button System
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="md">
              Primary Action
            </Button>
            <Button variant="secondary" size="md">
              Secondary Neutral
            </Button>
            <Button variant="premium" size="md" icon={<Sparkles className="w-4 h-4" />}>
              Premium Upgrade
            </Button>
            <Button variant="ghost" size="md">
              Ghost Link
            </Button>
            <Button variant="destructive" size="md">
              Destructive
            </Button>
          </div>
        </section>

        {/* 4. BADGES */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
            4. Badges & Status Chips
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="rose">Romance Active</Badge>
            <Badge variant="purple">Couple AI</Badge>
            <Badge variant="amber">4-Day Streak</Badge>
            <Badge variant="emerald">Encrypted Vault</Badge>
            <Badge variant="blue">Calendar Held</Badge>
            <Badge variant="zinc">Standard</Badge>
          </div>
        </section>

        {/* 5. CARDS & EMPTY STATES */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
            5. Surfaces & Empty States
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card variant="standard" padding="sm" className="space-y-2">
              <h4 className="font-bold text-xs text-zinc-900">Standard Surface Card</h4>
              <p className="text-xs text-zinc-500">Subtle border, soft shadow, 32px corner radius.</p>
            </Card>

            <Card variant="accent" padding="sm" className="space-y-2">
              <h4 className="font-bold text-xs text-rose-900">Accent Card</h4>
              <p className="text-xs text-rose-700">Soft rose surface for milestone moments.</p>
            </Card>
          </div>
        </section>

        <div className="pt-4 border-t border-zinc-100 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setDesignSystemOpen(false)}>
            Close Design System Reference
          </Button>
        </div>
      </div>
    </div>
  );
};
