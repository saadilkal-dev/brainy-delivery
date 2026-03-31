import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getDashboard } from '@/api/dashboard';
import { getModules } from '@/api/modules';
import { getExtractions } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, getModuleStatusVariant, getExtractionTypeVariant, getSourceVariant } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldAlert, Calendar, Brain } from 'lucide-react';

function ProgressRing({ value, total, status }: { value: number; total: number; status: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    status === 'on_track' ? 'hsl(var(--success))' :
    status === 'at_risk'  ? 'hsl(var(--primary))' :
                            'hsl(var(--destructive))';

  return (
    <svg width="84" height="84" className="transform -rotate-90">
      <circle cx="42" cy="42" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
      <circle
        cx="42" cy="42" r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="butt"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

const moduleStatusBorderColor: Record<string, string> = {
  complete:    'border-l-success',
  in_progress: 'border-l-primary',
  blocked:     'border-l-destructive',
  not_started: 'border-l-muted-foreground/20',
};

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expandedModule) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest('[data-module-card]');
      if (!card) setExpandedModule(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expandedModule]);

  const dashQ = useQuery({ queryKey: ['dashboard', id], queryFn: () => getDashboard(id!), enabled: !!id });
  const modsQ = useQuery({ queryKey: ['modules', id], queryFn: () => getModules(id!), enabled: !!id });
  const extQ  = useQuery({ queryKey: ['extractions', id, 5], queryFn: () => getExtractions(id!, 5), enabled: !!id });

  if (dashQ.isLoading) return <LoadingSpinner />;
  if (dashQ.isError)   return <ErrorMessage message={dashQ.error.message} onRetry={() => dashQ.refetch()} />;

  const dash = dashQ.data!;
  const modules = modsQ.data ?? [];
  const extractions = extQ.data ?? [];

  const drift = dash.predicted_delivery.drift_days;
  const driftLabel = drift === 0 ? 'On target' : drift > 0 ? `+${drift}d` : `${drift}d`;
  const driftColor = drift <= 0 ? 'text-success' : drift <= 5 ? 'text-primary' : 'text-destructive';

  return (
    <div className="space-y-8">
      {/* Section: Stats */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
          Project Health
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Progress ring card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-sm border border-border bg-card p-5 flex items-center gap-4 border-t-2 border-t-primary/40"
          >
            <ProgressRing
              value={dash.overall_progress.completed}
              total={dash.overall_progress.total}
              status={dash.overall_progress.status}
            />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Progress</p>
              <p className="font-mono text-2xl font-bold text-foreground">
                {dash.overall_progress.completed}
                <span className="text-muted-foreground/40 text-base">/{dash.overall_progress.total}</span>
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/50">modules done</p>
            </div>
          </motion.div>

          {/* Blockers card */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate(`/projects/${id}/blockers`)}
            className={cn(
              'rounded-sm border border-border bg-card p-5 text-left border-t-2 transition-colors',
              dash.active_blockers > 0
                ? 'border-t-destructive/60 hover:border-destructive/40'
                : 'border-t-muted-foreground/20'
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">Blockers</p>
            </div>
            <p className={cn('font-mono text-3xl font-bold', dash.active_blockers > 0 ? 'text-destructive' : 'text-foreground')}>
              {dash.active_blockers}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">active right now</p>
          </motion.button>

          {/* Predicted delivery card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-sm border border-border bg-card p-5 border-t-2 border-t-[hsl(195_100%_50%/0.3)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3.5 w-3.5 text-[hsl(195_100%_50%)]" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">Delivery</p>
            </div>
            <p className={cn('font-mono text-xl font-bold', driftColor)}>{dash.predicted_delivery.date}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('font-mono text-xs font-bold', driftColor)}>{driftLabel}</span>
              <span className="font-mono text-[10px] text-muted-foreground/40">vs target {dash.predicted_delivery.original_target}</span>
            </div>
          </motion.div>

          {/* Brain activity card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-sm border border-border bg-card p-5 border-t-2 border-t-[hsl(195_100%_50%/0.3)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-3.5 w-3.5 text-[hsl(195_100%_50%)]" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">Brain Activity</p>
            </div>
            <p className="font-mono text-3xl font-bold text-[hsl(195_100%_50%)]">{dash.brain_activity.count}</p>
            <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">extractions this week</p>
          </motion.div>
        </div>
      </div>

      {/* Section: Modules */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
          Module Status
        </p>
        {modsQ.isLoading ? <LoadingSpinner /> : modules.length === 0 ? (
          <EmptyState
            title="No modules yet"
            description="Go to the Plan page to create your first module."
            actionLabel="Go to Plan"
            onAction={() => navigate(`/projects/${id}/plan`)}
          />
        ) : (
          <div className="relative">
            {/* Blur overlay when a card is expanded */}
            <AnimatePresence>
              {expandedModule && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-20 bg-background/40 backdrop-blur-[2px]"
                  onClick={() => setExpandedModule(null)}
                />
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {modules.map((mod, i) => {
                const isExpanded = expandedModule === mod.id;
                const isOtherExpanded = expandedModule !== null && !isExpanded;

                return (
                  <motion.div
                    data-module-card
                    key={mod.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isExpanded ? 1.03 : 1,
                      zIndex: isExpanded ? 30 : 1,
                    }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'rounded-sm border border-border bg-card overflow-hidden border-l-2 relative',
                      moduleStatusBorderColor[mod.status] || 'border-l-muted-foreground/20',
                      isExpanded && 'shadow-xl ring-1 ring-primary/20',
                      isOtherExpanded && 'opacity-40'
                    )}
                    style={{ zIndex: isExpanded ? 30 : 1 }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedModule(isExpanded ? null : mod.id);
                      }}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-heading font-semibold text-sm text-foreground leading-snug">{mod.name}</h3>
                        <StatusBadge variant={getModuleStatusVariant(mod.status)}>
                          {mod.status.replace('_', ' ')}
                        </StatusBadge>
                      </div>
                      {mod.owner && (
                        <p className="font-mono text-[10px] text-muted-foreground/50 mb-2 uppercase tracking-wider">{mod.owner}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <ProgressBar
                          value={mod.progress_pct}
                          blocked={mod.status === 'blocked'}
                          className="flex-1"
                        />
                        <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">{mod.progress_pct}%</span>
                      </div>
                      {mod.status === 'blocked' && mod.blocker_reason && (
                        <p className="font-mono text-[10px] text-destructive/80 mt-1">⛔ {mod.blocker_reason}</p>
                      )}
                      {mod.assumptions && mod.assumptions.length > 0 && (
                        <div className="mt-2">
                          <StatusBadge variant="amber">⚠ {mod.assumptions.length} assumption{mod.assumptions.length > 1 ? 's' : ''}</StatusBadge>
                        </div>
                      )}
                      <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/40 mt-2 transition-transform duration-300', isExpanded && 'rotate-180')} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border p-4 space-y-2">
                            {mod.assumptions?.map(a => (
                              <motion.div
                                key={a.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2"
                              >
                                <StatusBadge variant={a.status === 'confirmed' ? 'green' : a.status === 'invalidated' ? 'red' : 'amber'}>
                                  {a.status}
                                </StatusBadge>
                                <span className="font-mono text-[10px] text-muted-foreground">{a.text}</span>
                              </motion.div>
                            ))}
                            {mod.dependencies?.map(d => (
                              <motion.div
                                key={d.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2"
                              >
                                <StatusBadge variant={d.status === 'overdue' ? 'red' : d.status === 'received' ? 'green' : 'amber'}>
                                  {d.status}
                                </StatusBadge>
                                <span className="font-mono text-[10px] text-muted-foreground">{d.description}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section: Brain Activity */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(195_100%_50%)] shadow-[0_0_6px_hsl(195_100%_50%/0.8)]" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
            Recent Brain Activity
          </p>
        </div>

        {extQ.isLoading ? <LoadingSpinner /> : extractions.length === 0 ? (
          <EmptyState
            title="No meeting transcripts processed yet"
            description="Go to Ingestion Feed to add one."
            actionLabel="Go to Ingestion"
            onAction={() => navigate(`/projects/${id}/ingestion`)}
          />
        ) : (
          <div className="space-y-2">
            {extractions.map((ext, i) => (
              <motion.div
                key={ext.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-sm border border-[hsl(195_100%_50%/0.12)] bg-card p-4 border-l-2 border-l-[hsl(195_100%_50%/0.5)]"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
                  <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>
                    {ext.extraction_type.replace('_', ' ')}
                  </StatusBadge>
                  {ext.affected_module_name && (
                    <span className="font-mono text-[10px] text-muted-foreground/50">→ {ext.affected_module_name}</span>
                  )}
                </div>
                <p className="text-sm text-foreground/90">{ext.summary}</p>
                <p className="font-mono text-[10px] text-muted-foreground/40 mt-1.5">
                  {formatDistanceToNow(new Date(ext.created_at), { addSuffix: true })}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
