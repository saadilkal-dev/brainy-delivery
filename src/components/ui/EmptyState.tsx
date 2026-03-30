import { Inbox } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="text-muted-foreground">
        {icon || <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
