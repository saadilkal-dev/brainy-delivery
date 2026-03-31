import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  variant: 'default' | 'blue' | 'red' | 'green' | 'amber' | 'purple' | 'grey';
  children: React.ReactNode;
  className?: string;
}

const badgeClasses: Record<StatusBadgeProps['variant'], string> = {
  default: 'bg-muted/60 text-muted-foreground border-muted',
  blue:    'bg-[hsl(175_85%_55%/0.1)] text-[hsl(175_85%_55%)] border-[hsl(175_85%_55%/0.25)]',
  red:     'bg-destructive/10 text-destructive border-destructive/25',
  green:   'bg-success/10 text-success border-success/25',
  amber:   'bg-warning/10 text-warning border-warning/25',
  purple:  'bg-primary/10 text-primary border-primary/25',
  grey:    'bg-muted/40 text-muted-foreground/60 border-muted/50',
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium',
      badgeClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function getModuleStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'complete':    return 'green';
    case 'in_progress': return 'purple';
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
