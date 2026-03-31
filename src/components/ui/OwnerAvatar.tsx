import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface TalentInfo {
  name: string;
  availability: 'available' | 'partially_available' | 'unavailable';
  logged_hours: number;
  expected_hours: number;
  color: string;
}

const talentData: Record<string, TalentInfo> = {
  Ravi:    { name: 'Ravi',    availability: 'available',           logged_hours: 68,  expected_hours: 120, color: 'hsl(195 100% 50%)' },
  Priya:   { name: 'Priya',   availability: 'partially_available', logged_hours: 52,  expected_hours: 80,  color: 'hsl(270 60% 65%)' },
  Arjun:   { name: 'Arjun',   availability: 'available',           logged_hours: 12,  expected_hours: 60,  color: 'hsl(158 64% 42%)' },
  Meera:   { name: 'Meera',   availability: 'unavailable',         logged_hours: 85,  expected_hours: 90,  color: 'hsl(38 91% 55%)' },
  Karthik: { name: 'Karthik', availability: 'partially_available', logged_hours: 30,  expected_hours: 110, color: 'hsl(0 72% 55%)' },
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const availabilityLabel: Record<string, { text: string; dotClass: string }> = {
  available:           { text: 'Available',           dotClass: 'bg-success shadow-[0_0_6px_hsl(158_64%_42%/0.8)]' },
  partially_available: { text: 'Partially Available', dotClass: 'bg-primary shadow-[0_0_6px_hsl(38_91%_55%/0.8)]' },
  unavailable:         { text: 'Unavailable',         dotClass: 'bg-destructive shadow-[0_0_6px_hsl(0_72%_51%/0.8)]' },
};

interface OwnerAvatarProps {
  name: string;
  className?: string;
}

export function OwnerAvatar({ name, className }: OwnerAvatarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const talent = talentData[name];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!talent) {
    return (
      <span className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted font-mono text-[9px] font-bold text-muted-foreground shrink-0',
        className
      )}>
        {getInitials(name)}
      </span>
    );
  }

  const pct = talent.expected_hours > 0 ? Math.round((talent.logged_hours / talent.expected_hours) * 100) : 0;
  const avail = availabilityLabel[talent.availability];

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[9px] font-bold shrink-0 transition-all hover:scale-110 hover:ring-2 hover:ring-primary/30',
          className
        )}
        style={{ backgroundColor: talent.color, color: 'hsl(var(--card))' }}
        title={talent.name}
      >
        {getInitials(name)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-52 rounded-sm border border-border bg-card p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold shrink-0"
                style={{ backgroundColor: talent.color, color: 'hsl(var(--card))' }}
              >
                {getInitials(name)}
              </span>
              <div>
                <p className="font-heading text-sm font-semibold text-foreground">{talent.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full', avail.dotClass)} />
                  <span className="font-mono text-[10px] text-muted-foreground">{avail.text}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border mb-3" />

            {/* Hours */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">Logged</span>
                <span className="font-mono text-xs text-foreground font-semibold">{talent.logged_hours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">Expected</span>
                <span className="font-mono text-xs text-foreground font-semibold">{talent.expected_hours}h</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-primary' : 'bg-success'
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/50 text-right">{pct}% utilized</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
