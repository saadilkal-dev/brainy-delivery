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
import { ChevronDown, AlertTriangle, Activity, Calendar, Target, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ProgressRing({ value, total, status }: { value: number; total: number; status: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = status === 'on_track' ? 'hsl(var(--success))' : status === 'at_risk' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0 -rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
    </svg>
  );
}

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
  const extQ = useQuery({ queryKey: ['extractions', id, 5], queryFn: () => getExtractions(id!, 5), enabled: !!id });

  if (dashQ.isLoading) return <LoadingSpinner />;
  if (dashQ.isError) return <ErrorMessage message={dashQ.error.message} onRetry={() => dashQ.refetch()} />;

  const dash = dashQ.data!;
  const modules = modsQ.data ?? [];
  const extractions = extQ.data ?? [];

  const driftColor = dash.predicted_delivery.drift_days <= 0 ? 'text-success' : dash.predicted_delivery.drift_days <= 5 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-6">
      {/* Stats Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress */}
        <div className="rounded-lg border border-border bg-card p-4 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">Progress</h3>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {dash.overall_progress.completed}
              <span className="text-muted-foreground font-normal text-lg">/{dash.overall_progress.total}</span>
            </p>
            <p className="text-xs text-muted-foreground">modules complete</p>
          </div>
          <div className="pt-1">
            <ProgressRing value={dash.overall_progress.completed} total={dash.overall_progress.total} status={dash.overall_progress.status} />
          </div>
        </div>

        {/* Blockers */}
        <button
          onClick={() => navigate(`/projects/${id}/blockers`)}
          className="rounded-lg border border-border bg-card p-4 space-y-4 text-left hover:bg-accent transition-colors group cursor-pointer"
        >
          <h3 className="font-semibold text-sm text-foreground">Blockers</h3>
          <p className="text-3xl font-bold text-destructive tabular-nums">{dash.active_blockers}</p>
          <div className="h-1" />
          <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">View details →</p>
        </button>

        {/* Delivery */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm text-foreground">Delivery</h3>
          <p className={cn('text-xl font-bold tabular-nums whitespace-nowrap', driftColor)}>
            {dash.predicted_delivery.date}
          </p>
          <div className="h-1" />
          <p className="text-xs text-muted-foreground">Target: {dash.predicted_delivery.original_target}</p>
        </div>

        {/* Activity */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm text-foreground">Activity</h3>
          <p className="text-3xl font-bold tabular-nums">{dash.brain_activity.count}</p>
          <div className="h-1" />
          <p className="text-xs text-muted-foreground">extractions this week</p>
        </div>
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Modules</h2>
        {modsQ.isLoading ? <LoadingSpinner /> : modules.length === 0 ? (
          <EmptyState title="No modules yet" description="Go to the Plan page to create your first module." actionLabel="Go to Plan" onAction={() => navigate(`/projects/${id}/plan`)} />
        ) : (
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(mod => {
              const isExpanded = expandedModule === mod.id;
              const hasExpanded = expandedModule !== null;
              return (
                <div
                  data-module-card
                  key={mod.id}
                  className={cn(
                    'rounded-lg border border-border bg-card overflow-visible relative transition-all duration-300',
                    isExpanded ? 'z-20 ring-2 ring-primary/30 shadow-xl shadow-primary/10 scale-[1.02]' : '',
                    hasExpanded && !isExpanded ? 'opacity-40 blur-[1px] pointer-events-none' : ''
                  )}
                >
                  <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} className="w-full h-full p-4 text-left">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{mod.name}</h3>
                      <StatusBadge variant={getModuleStatusVariant(mod.status)}>{mod.status.replace('_', ' ')}</StatusBadge>
                    </div>
                    {mod.owner && <p className="text-xs text-muted-foreground mb-2">{mod.owner}</p>}
                    <ProgressBar value={mod.progress_pct} className="mb-2" />
                    {mod.status === 'blocked' && mod.blocker_reason && (
                      <p className="text-xs text-destructive mt-1">⛔ {mod.blocker_reason}</p>
                    )}
                    {mod.assumptions && mod.assumptions.length > 0 && (
                      <StatusBadge variant="amber" className="mt-1">⚠ {mod.assumptions.length} assumptions</StatusBadge>
                    )}
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground mt-2 transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute left-0 right-0 top-full mt-1 rounded-b-lg border border-border bg-card shadow-lg z-30"
                      >
                        <div className="p-4 space-y-2 text-sm">
                          {mod.assumptions?.map(a => (
                            <div key={a.id} className="flex items-start gap-3">
                              <StatusBadge variant={a.status === 'confirmed' ? 'green' : a.status === 'invalidated' ? 'red' : 'amber'} className="shrink-0 mt-0.5 min-w-[80px] justify-center">{a.status}</StatusBadge>
                              <span className="text-muted-foreground">{a.text}</span>
                            </div>
                          ))}
                          {mod.dependencies?.map(d => (
                            <div key={d.id} className="flex items-start gap-3">
                              <StatusBadge variant={d.status === 'overdue' ? 'red' : d.status === 'received' ? 'green' : 'amber'} className="shrink-0 mt-0.5 min-w-[80px] justify-center">{d.status}</StatusBadge>
                              <span className="text-muted-foreground">{d.description}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Brain Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Brain Activity</h2>
        {extQ.isLoading ? <LoadingSpinner /> : extractions.length === 0 ? (
          <EmptyState title="No meeting transcripts processed yet" description="Go to Ingestion Feed to add one." actionLabel="Go to Ingestion" onAction={() => navigate(`/projects/${id}/ingestion`)} />
        ) : (
          <div className="space-y-3">
            {extractions.map(ext => (
              <div key={ext.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
                  <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>{ext.extraction_type.replace('_', ' ')}</StatusBadge>
                  {ext.affected_module_name && <span className="text-xs text-muted-foreground">→ {ext.affected_module_name}</span>}
                </div>
                <p className="text-sm text-foreground">{ext.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(ext.created_at), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
