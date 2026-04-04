import { useEffect, useState } from 'react';
import { X, TrendingUp, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AISignal } from '@/hooks/useSignalSimulator';

const TYPE_CONFIG = {
  progress_update: {
    icon: TrendingUp,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
  },
  blocker: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  assumption_risk: {
    icon: ShieldAlert,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  info: {
    icon: Info,
    color: 'text-gray-500',
    bg: 'bg-white',
    border: 'border-black/8',
    dot: 'bg-gray-400',
  },
};

interface AISignalToastProps {
  signal: AISignal;
  onDismiss: (id: string) => void;
  /** Auto-dismiss after N ms. Default: 5000 */
  duration?: number;
}

export function AISignalToast({ signal, onDismiss, duration = 5000 }: AISignalToastProps) {
  const [visible, setVisible] = useState(false);
  const cfg = TYPE_CONFIG[signal.type] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(signal.id), 300);
    }, duration);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [signal.id, duration, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-72 rounded-xl border shadow-sm px-4 py-3',
        'transition-all duration-300 ease-out',
        cfg.bg, cfg.border,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      )}
    >
      {/* Icon */}
      <div className={cn('shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5', cfg.bg)}>
        <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Type label */}
        <div className="text-[9px] uppercase tracking-[0.12em] text-gray-400 font-mono mb-0.5">
          {signal.type.replace('_', ' ')}
        </div>
        {/* Message */}
        <div className="text-xs text-gray-800 leading-snug">{signal.message}</div>
        {signal.moduleName && (
          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{signal.moduleName}</div>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(signal.id), 300);
        }}
        className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors mt-0.5"
      >
        <X className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}

/** Stack of signal toasts rendered in the top-right corner */
interface SignalToastStackProps {
  signals: AISignal[];
  onDismiss: (id: string) => void;
}

export function SignalToastStack({ signals, onDismiss }: SignalToastStackProps) {
  if (signals.length === 0) return null;

  return (
    <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
      {signals.map((s) => (
        <AISignalToast key={s.id} signal={s} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
