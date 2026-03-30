import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-destructive text-sm text-center max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
