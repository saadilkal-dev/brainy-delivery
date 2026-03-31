import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type View = 'project' | 'my';

interface ViewToggleProps {
  view: View;
  onChange: (view: View) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {(['project', 'my'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'relative px-4 py-1.5 text-xs font-medium rounded-md transition-colors',
            view === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
          )}
        >
          {view === v && (
            <motion.div
              layoutId="view-toggle-bg"
              className="absolute inset-0 rounded-md bg-accent border border-primary/30 shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{v === 'project' ? 'Project View' : 'My View'}</span>
        </button>
      ))}
    </div>
  );
}
