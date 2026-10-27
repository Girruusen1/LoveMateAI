import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

/* =========================================================================
   1. BUTTON SYSTEM
   ========================================================================= */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'premium';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2.5 rounded-xl gap-2 h-10',
    lg: 'text-sm sm:text-base px-6 py-3 rounded-2xl gap-2.5 h-12',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-200 hover:shadow-md hover:shadow-rose-200/50',
    secondary:
      'bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/90 shadow-2xs hover:border-zinc-300',
    ghost:
      'bg-transparent hover:bg-zinc-100/70 text-zinc-600 hover:text-zinc-900',
    destructive:
      'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
    premium:
      'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white shadow-xs shadow-pink-200 hover:shadow-md',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

/* =========================================================================
   2. CARD SYSTEM
   ========================================================================= */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'elevated' | 'interactive' | 'accent' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-3xl border transition-all duration-200 relative overflow-hidden';

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantClasses = {
    standard: 'bg-white border-zinc-200/80 shadow-2xs',
    elevated: 'bg-white border-zinc-200/90 shadow-sm hover:shadow-md',
    interactive:
      'bg-white border-zinc-200/80 shadow-2xs hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
    accent: 'bg-rose-50/50 border-rose-100/90 shadow-2xs',
    glass: 'bg-white/85 backdrop-blur-md border-white/60 shadow-xs',
  };

  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/* =========================================================================
   3. BADGE SYSTEM
   ========================================================================= */
export type BadgeVariant = 'rose' | 'purple' | 'amber' | 'emerald' | 'blue' | 'zinc';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, variant = 'rose', size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    zinc: 'bg-zinc-100 text-zinc-700 border border-zinc-200/80',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

/* =========================================================================
   4. EMPTY STATE SYSTEM
   ========================================================================= */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional quieter second action, e.g. "Invite your partner". */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-3xl bg-white border border-zinc-200/80 shadow-2xs max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4 text-2xl shadow-2xs border border-rose-100">
        {icon || <Sparkles className="w-6 h-6 text-rose-500" />}
      </div>
      <h3 className="text-base font-bold text-zinc-900 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {((actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction)) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction} icon={<ArrowRight className="w-3.5 h-3.5" />} iconPosition="right">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="ghost" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   5. SKELETON LOADERS
   ========================================================================= */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-2xs space-y-3"
        >
          <div className="h-4 bg-zinc-100 rounded-full w-24 shimmer-loading" />
          <div className="h-6 bg-zinc-100 rounded-xl w-3/4 shimmer-loading" />
          <div className="h-3.5 bg-zinc-100 rounded-lg w-full shimmer-loading" />
          <div className="h-3.5 bg-zinc-100 rounded-lg w-1/2 shimmer-loading" />
        </div>
      ))}
    </>
  );
};

/* =========================================================================
   6. PAGE LAYOUT SYSTEM (one template for every feature page)
   ========================================================================= */
export const PageContainer: React.FC<{ children: React.ReactNode; className?: string; narrow?: boolean }> = ({
  children,
  className = '',
  narrow = false,
}) => (
  <div className={`${narrow ? 'max-w-5xl' : 'max-w-[1360px]'} mx-auto space-y-6 pb-12 animate-in fade-in duration-300 ${className}`}>
    {children}
  </div>
);

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** True while a page is rendered inside a hub, whose own bar already shows the title and mode chips. */
export const InsideHubContext = React.createContext(false);

/** Left-aligned page title. No emoji, no eyebrow pill, no version tags. Inside a hub it shrinks to the subtitle and actions. */
export const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, subtitle, actions, className = '' }) => {
  const insideHub = React.useContext(InsideHubContext);
  if (insideHub) {
    if (!subtitle && !actions) return null;
    return (
      <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${className}`}>
        {subtitle ? <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">{subtitle}</p> : <span />}
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    );
  }
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3.5 min-w-0">
        {icon && (
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-serif-romance font-bold text-zinc-900 tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

export const SectionHeading: React.FC<{ title: string; description?: string; action?: React.ReactNode; className?: string }> = ({
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex items-end justify-between gap-4 ${className}`}>
    <div>
      <h2 className="text-base sm:text-lg font-serif-romance font-bold text-zinc-900 tracking-tight">{title}</h2>
      {description && <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{description}</p>}
    </div>
    {action}
  </div>
);

interface ResultPlaceholderProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

/** Shown in the result column of a tool page before anything has been generated. */
export const ResultPlaceholder: React.FC<ResultPlaceholderProps> = ({ icon, title, description, className = '' }) => (
  <div
    className={`h-full min-h-[320px] rounded-3xl border border-dashed border-zinc-300 bg-white/60 flex flex-col items-center justify-center text-center p-8 ${className}`}
  >
    <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-4 [&>svg]:w-6 [&>svg]:h-6">
      {icon || <Sparkles />}
    </div>
    <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
    <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">{description}</p>
  </div>
);

interface ToolLayoutProps {
  /** The input form. Rendered in a sticky left column on large screens. */
  form: React.ReactNode;
  /** The generated result. When null/undefined the placeholder is shown instead. */
  result?: React.ReactNode | null;
  placeholder: ResultPlaceholderProps;
  className?: string;
}

/** Two-column tool page: form on the left, result (or placeholder) on the right. Stacks on mobile. */
export const ToolLayout: React.FC<ToolLayoutProps> = ({ form, result, placeholder, className = '' }) => (
  <div className={`grid grid-cols-1 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-6 items-start ${className}`}>
    <div className="lg:sticky lg:top-24">{form}</div>
    <div className="min-w-0">{result ? result : <ResultPlaceholder {...placeholder} />}</div>
  </div>
);

/* =========================================================================
   7. FORM PRIMITIVES
   ========================================================================= */
export const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string; className?: string }> = ({ children, hint, className = '' }) => (
  <label className={`block text-xs font-semibold text-zinc-700 mb-1.5 ${className}`}>
    {children}
    {hint && <span className="ml-1.5 font-normal text-zinc-400">{hint}</span>}
  </label>
);

export const inputClasses =
  'w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input className={`${inputClasses} ${className}`} {...props} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea className={`${inputClasses} resize-none leading-relaxed ${className}`} {...props} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select className={`${inputClasses} cursor-pointer ${className}`} {...props}>
    {children}
  </select>
);

/** Selectable pill used for tone / stage / category pickers. */
export const Chip: React.FC<{
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ selected = false, onClick, icon, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
      selected
        ? 'bg-rose-600 border-rose-600 text-white'
        : 'bg-white border-zinc-200 text-zinc-700 hover:border-rose-300 hover:text-rose-700'
    } ${className}`}
  >
    {icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
    {children}
  </button>
);
