import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  variant?: 'auto' | 'amber' | 'green' | 'red' | 'default';
  blocked?: boolean;
}

function getBarColor(value: number, blocked: boolean): string {
  if (blocked) return 'bg-destructive';
  if (value >= 100) return 'bg-success';
  if (value >= 80) return 'bg-success/70';
  return 'bg-primary';
}

export function ProgressBar({ value, className, barClassName, variant = 'auto', blocked = false }: ProgressBarProps) {
  const autoColor = getBarColor(value, blocked);

  const barColor =
    variant === 'amber'   ? 'bg-primary' :
    variant === 'green'   ? 'bg-success' :
    variant === 'red'     ? 'bg-destructive' :
    variant === 'default' ? 'bg-primary' :
    autoColor;

  return (
    <div className={cn('h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all duration-500 ease-out rounded-full', barColor, barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
