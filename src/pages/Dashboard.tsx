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
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldAlert, Calendar, Brain, TrendingUp } from 'lucide-react';

function ProgressRing({ value, total, status }: { value: number; total: number; status: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    status === 'on_track' ? 'hsl(160 68% 48%)' :
    status === 'at_risk'  ? 'hsl(265 85% 70%)' :
                            'hsl(0 68% 56%)';

  return (
    <svg width="84" height="84" className="transform -rotate-90">
      <circle cx="42" cy="42" r={r} fill="none" stroke="hsl(240 6% 11%)" strokeWidth="4" />
      <circle
        cx="42" cy="42" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

const moduleStatusConfig: Record<string, { bg: string; dot: string }> = {
  complete:    { bg: 'bg-success/5 border-success/20',    dot: 'bg-success shadow-[0_0_6px_hsl(160_68%_48%/0.8)]' },
  in_progress: { bg: 'bg-primary/5 border-primary/20',    dot: 'bg-primary shadow-[0_0_6px_hsl(265_85%_70%/0.8)]' },
  blocked:     { bg: 'bg-destructive/5 border-destructive/20', dot: 'bg-destructive shadow-[0_0_6px_hsl(0_68%_56%/0.8)]' },
  not_started: { bg: 'border-border',               dot: 'bg-muted-foreground/30' },
};

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  


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
    <div className="space-y-10">
      {/* Section: Stats */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-5">Project Health</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Progress ring card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-xl bg-card p-5 flex items-center gap-4 overflow-hidden card-shadow"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
            <ProgressRing
              value={dash.overall_progress.completed}
              total={dash.overall_progress.total}
              status={dash.overall_progress.status}
            />
            <div className="relative">
              <p className="text-xs text-muted-foreground mb-1">Progress</p>
              <p className="font-mono text-2xl font-bold text-foreground">
                {dash.overall_progress.completed}
                <span className="text-muted-foreground/40 text-base">/{dash.overall_progress.total}</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">modules done</p>
            </div>
          </motion.div>

          {/* Blockers card */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate(`/projects/${id}/blockers`)}
            className={cn(
              'relative rounded-xl bg-card p-5 text-left overflow-hidden transition-all group card-shadow',
              dash.active_blockers > 0
                ? 'border-destructive/20 hover:border-destructive/40 red-glow'
                : 'border-border hover:border-border/70'
            )}
          >
            {dash.active_blockers > 0 && (
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />
            )}
            <div className={cn(
              'absolute inset-0 transition-opacity pointer-events-none',
              dash.active_blockers > 0 ? 'bg-gradient-to-br from-destructive/[0.05] to-transparent' : 'opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/[0.02] to-transparent'
            )} />
            <div className="flex items-center gap-2 mb-4 relative">
              <ShieldAlert className={cn('h-4 w-4', dash.active_blockers > 0 ? 'text-destructive' : 'text-muted-foreground')} />
              <p className="text-xs font-medium text-muted-foreground">Blockers</p>
            </div>
            <p className={cn('font-mono text-3xl font-bold relative', dash.active_blockers > 0 ? 'text-destructive' : 'text-foreground')}>
              {dash.active_blockers}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 relative">active right now</p>
          </motion.button>

          {/* Predicted delivery card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-xl bg-card p-5 overflow-hidden card-shadow"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(175_85%_55%/0.6)] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(175_85%_55%/0.04)] to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 relative">
              <Calendar className="h-4 w-4 text-[hsl(175_85%_55%)]" />
              <p className="text-xs font-medium text-muted-foreground">Delivery</p>
            </div>
            <p className={cn('font-mono text-xl font-bold relative', driftColor)}>{dash.predicted_delivery.date}</p>
            <div className="flex items-center gap-2 mt-1.5 relative">
              <span className={cn('font-mono text-sm font-semibold', driftColor)}>{driftLabel}</span>
              <span className="text-xs text-muted-foreground/50">vs target {dash.predicted_delivery.original_target}</span>
            </div>
          </motion.div>

          {/* Brain activity card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-xl bg-card p-5 overflow-hidden card-shadow"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 relative">
              <Brain className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">AI Activity</p>
            </div>
            <p className="font-mono text-3xl font-bold text-primary relative">{dash.brain_activity.count}</p>
            <p className="text-xs text-muted-foreground/60 mt-1 relative">extractions this week</p>
          </motion.div>
        </div>
      </div>

      {/* Section: Modules */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-5">Module Status</p>
        {modsQ.isLoading ? <LoadingSpinner /> : modules.length === 0 ? (
          <EmptyState
            title="No modules yet"
            description="Go to the Plan page to create your first module."
            actionLabel="Go to Plan"
            onAction={() => navigate(`/projects/${id}/plan`)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules.map((mod, i) => {
              const config = moduleStatusConfig[mod.status] || moduleStatusConfig.not_started;
              return (
                <motion.div
                  data-module-card
                  key={mod.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'rounded-xl bg-card overflow-hidden transition-all card-shadow',
                    config.bg
                  )}
                >
                  <button
                    onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', config.dot)} />
                        <h3 className="font-semibold text-sm text-foreground leading-snug">{mod.name}</h3>
                      </div>
                      <StatusBadge variant={getModuleStatusVariant(mod.status)}>
                        {mod.status.replace('_', ' ')}
                      </StatusBadge>
                    </div>
                    {mod.owner && (
                      <p className="text-xs text-muted-foreground/60 mb-3 ml-4">{mod.owner}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2 ml-4">
                      <ProgressBar
                        value={mod.progress_pct}
                        blocked={mod.status === 'blocked'}
                        className="flex-1"
                      />
                      <span className="font-mono text-xs text-muted-foreground/60 shrink-0">{mod.progress_pct}%</span>
                    </div>
                    {mod.status === 'blocked' && mod.blocker_reason && (
                      <p className="text-xs text-destructive/80 mt-2 ml-4">⛔ {mod.blocker_reason}</p>
                    )}
                    {mod.assumptions && mod.assumptions.length > 0 && (
                      <div className="mt-2 ml-4">
                        <StatusBadge variant="amber">⚠ {mod.assumptions.length} assumption{mod.assumptions.length > 1 ? 's' : ''}</StatusBadge>
                      </div>
                    )}
                    <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/40 mt-2 ml-4 transition-transform', expandedModule === mod.id && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {expandedModule === mod.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border p-4 space-y-2">
                          {mod.assumptions?.map(a => (
                            <div key={a.id} className="flex items-center gap-2">
                              <StatusBadge variant={a.status === 'confirmed' ? 'green' : a.status === 'invalidated' ? 'red' : 'amber'}>
                                {a.status}
                              </StatusBadge>
                              <span className="text-xs text-muted-foreground">{a.text}</span>
                            </div>
                          ))}
                          {mod.dependencies?.map(d => (
                            <div key={d.id} className="flex items-center gap-2">
                              <StatusBadge variant={d.status === 'overdue' ? 'red' : d.status === 'received' ? 'green' : 'amber'}>
                                {d.status}
                              </StatusBadge>
                              <span className="text-xs text-muted-foreground">{d.description}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Brain Activity */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(175_85%_55%)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(175_85%_55%)]" />
          </span>
          <p className="text-xs font-medium text-muted-foreground">Recent AI Extractions</p>
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
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-xl bg-card p-4 overflow-hidden card-shadow border border-[hsl(175_85%_55%/0.2)]"
              >
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[hsl(175_85%_55%/0.6)] to-transparent" />
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
                  <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>
                    {ext.extraction_type.replace('_', ' ')}
                  </StatusBadge>
                  {ext.affected_module_name && (
                    <span className="text-xs text-muted-foreground/50">→ {ext.affected_module_name}</span>
                  )}
                </div>
                <p className="text-sm text-foreground/90">{ext.summary}</p>
                <p className="font-mono text-xs text-muted-foreground/40 mt-1.5">
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
