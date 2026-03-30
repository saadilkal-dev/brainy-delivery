import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ value, className, barClassName }: ProgressBarProps) {
  return (
    <div className={cn('h-2 w-full rounded-full bg-secondary', className)}>
      <div
        className={cn('h-full rounded-full bg-primary transition-all duration-300', barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
