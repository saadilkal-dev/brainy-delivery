import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Sparkles, Map, Activity, FolderOpen, ArrowRight } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    {
      id: 'cocreate',
      label: 'Co-Create Plan',
      description: 'Start or continue planning with AI',
      icon: Sparkles,
      action: () => navigate('/consultant/proj-1/cocreate'),
    },
    {
      id: 'map',
      label: 'Live Roadmap',
      description: 'View real-time delivery progress',
      icon: Map,
      action: () => navigate('/consultant/proj-1/map'),
    },
    {
      id: 'tracking',
      label: 'Project Tracking',
      description: 'Health metrics, blockers, and AI signals',
      icon: Activity,
      action: () => navigate('/consultant/proj-1/tracking'),
    },
    {
      id: 'projects',
      label: 'All Projects',
      description: 'Back to project list',
      icon: FolderOpen,
      action: () => navigate('/consultant'),
    },
  ];

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
    setOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 px-4"
          >
            <div className="card-elevated overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px hsl(240 12% 88%)' }}>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Command className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                />
                <kbd className="text-[10px] font-mono text-muted-foreground/30 border border-border rounded px-1.5 py-0.5">ESC</kbd>
              </div>

              <div className="p-1.5">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground/50 text-center py-6">No results found</p>
                ) : (
                  filtered.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/6 text-left transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                        <cmd.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                        {cmd.description && (
                          <p className="text-xs text-muted-foreground/60 truncate">{cmd.description}</p>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary/50 transition-colors shrink-0" />
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-border px-4 py-2 flex items-center gap-4">
                <span className="text-[10px] text-muted-foreground/30 font-mono">⌘K to toggle</span>
                <span className="text-[10px] text-muted-foreground/30 font-mono">↵ to select</span>
                <span className="text-[10px] text-muted-foreground/30 font-mono ml-auto">ESC to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
