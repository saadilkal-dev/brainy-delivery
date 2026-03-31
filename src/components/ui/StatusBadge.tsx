import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  variant: 'default' | 'blue' | 'red' | 'green' | 'amber' | 'purple' | 'grey';
  children: React.ReactNode;
  className?: string;
}

const dotClasses: Record<StatusBadgeProps['variant'], string> = {
  default: 'bg-muted-foreground',
  blue:    'bg-[hsl(195_100%_50%)] shadow-[0_0_6px_hsl(195_100%_50%/0.8)]',
  red:     'bg-destructive shadow-[0_0_8px_hsl(0_72%_51%/0.9)]',
  green:   'bg-success shadow-[0_0_6px_hsl(158_64%_42%/0.8)]',
  amber:   'bg-primary shadow-[0_0_6px_hsl(38_91%_55%/0.8)]',
  purple:  'bg-purple-400 shadow-[0_0_6px_hsl(270_60%_70%/0.7)]',
  grey:    'bg-muted-foreground/40',
};

const textClasses: Record<StatusBadgeProps['variant'], string> = {
  default: 'text-muted-foreground',
  blue:    'text-[hsl(195_100%_50%)]',
  red:     'text-destructive',
  green:   'text-success',
  amber:   'text-primary',
  purple:  'text-purple-400',
  grey:    'text-muted-foreground/70',
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider',
      textClasses[variant],
      className
    )}>
      <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[variant])} />
      {children}
    </span>
  );
}

export function getModuleStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'complete':    return 'green';
    case 'in_progress': return 'amber';
    case 'blocked':     return 'red';
    default:            return 'grey';
  }
}

export function getExtractionTypeVariant(type: string): StatusBadgeProps['variant'] {
  switch (type) {
    case 'blocker':           return 'red';
    case 'decision':          return 'blue';
    case 'priority_change':   return 'amber';
    case 'progress_update':   return 'green';
    case 'client_dependency': return 'purple';
    case 'assumption_risk':   return 'amber';
    default:                  return 'grey';
  }
}

export function getSourceVariant(source: string): StatusBadgeProps['variant'] {
  switch (source) {
    case 'meet':     return 'blue';
    case 'chat':     return 'green';
    case 'calendar': return 'purple';
    default:         return 'grey';
  }
}
