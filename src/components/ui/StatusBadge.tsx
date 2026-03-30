import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  variant: 'default' | 'blue' | 'red' | 'green' | 'amber' | 'purple' | 'grey';
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<StatusBadgeProps['variant'], string> = {
  default: 'bg-secondary text-secondary-foreground',
  blue: 'bg-primary/20 text-primary',
  red: 'bg-destructive/20 text-destructive',
  green: 'bg-success/20 text-success',
  amber: 'bg-warning/20 text-warning',
  purple: 'bg-purple-500/20 text-purple-400',
  grey: 'bg-muted text-muted-foreground',
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function getModuleStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'complete': return 'green';
    case 'in_progress': return 'blue';
    case 'blocked': return 'red';
    default: return 'grey';
  }
}

export function getExtractionTypeVariant(type: string): StatusBadgeProps['variant'] {
  switch (type) {
    case 'blocker': return 'red';
    case 'decision': return 'blue';
    case 'priority_change': return 'amber';
    case 'progress_update': return 'green';
    case 'client_dependency': return 'purple';
    case 'assumption_risk': return 'amber';
    default: return 'grey';
  }
}

export function getSourceVariant(source: string): StatusBadgeProps['variant'] {
  switch (source) {
    case 'meet': return 'blue';
    case 'chat': return 'green';
    case 'calendar': return 'purple';
    default: return 'grey';
  }
}
