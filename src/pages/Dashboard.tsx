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
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { ViewToggle } from '@/components/dashboard/ViewToggle';
import { ActionItems } from '@/components/dashboard/ActionItems';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldAlert, Calendar, Brain, User, Clock } from 'lucide-react';
import { OwnerAvatar } from '@/components/ui/OwnerAvatar';

const CURRENT_USER = 'Ravi';

const moduleStatusBorderColor: Record<string, string> = {
  complete:    'border-l-success',
  in_progress: 'border-l-primary',
  blocked:     'border-l-destructive',
  not_started: 'border-l-muted-foreground/20',
};

const statusSortOrder: Record<string, number> = {
  blocked: 0,
  in_progress: 1,
  not_started: 2,
  complete: 3,
};

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [view, setView] = useState<'project' | 'my'>('project');

  const dashQ = useQuery({ queryKey: ['dashboard', id], queryFn: () => getDashboard(id!), enabled: !!id });
  const modsQ = useQuery({ queryKey: ['modules', id], queryFn: () => getModules(id!), enabled: !!id });
  const extQ  = useQuery({ queryKey: ['extractions', id, 5], queryFn: () => getExtractions(id!, 5), enabled: !!id });

  // Close expanded card on outside click
  useEffect(() => {
    if (!expandedModule) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-module-card]')) setExpandedModule(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expandedModule]);

  if (dashQ.isLoading) return <LoadingSpinner />;
  if (dashQ.isError)   return <ErrorMessage message={dashQ.error.message} onRetry={() => dashQ.refetch()} />;

  const dash = dashQ.data!;
  const allModules = modsQ.data ?? [];
  const extractions = extQ.data ?? [];

  const isMyView = view === 'my';
  const myModules = allModules.filter(m => m.owner === CURRENT_USER);
  const displayModules = isMyView
    ? [...myModules].sort((a, b) => (statusSortOrder[a.status] ?? 9) - (statusSortOrder[b.status] ?? 9))
    : allModules;

  // My View stats
  const myCompleted = myModules.filter(m => m.status === 'complete').length;
  const myBlockers = myModules.filter(m => m.status === 'blocked').length;
  const myNextDeadline = myModules
    .filter(m => m.planned_end && m.status !== 'complete')
    .sort((a, b) => new Date(a.planned_end!).getTime() - new Date(b.planned_end!).getTime())[0];
  const myExtractionCount = extractions.filter(e =>
    myModules.some(m => m.name === e.affected_module_name)
  ).length;

  const drift = dash.predicted_delivery.drift_days;
  const driftLabel = drift === 0 ? 'On target' : drift > 0 ? `+${drift}d` : `${drift}d`;
  const driftColor = drift <= 0 ? 'text-success' : drift <= 5 ? 'text-primary' : 'text-destructive';

  return (
    <div className="space-y-8">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <ViewToggle view={view} onChange={setView} />
        {isMyView && (
          <span className="text-xs text-muted-foreground">
            Viewing as <span className="font-semibold text-foreground">{CURRENT_USER}</span>
          </span>
        )}
      </div>

      {/* Section: Stats */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
          {isMyView ? 'My Stats' : 'Project Health'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isMyView ? (
            <>
              {/* My Progress */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-sm border border-border bg-card p-5 flex items-center gap-4 border-t-2 border-t-primary/40"
              >
                <ProgressRing value={myCompleted} total={myModules.length} status="on_track" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">My Progress</p>
                  <p className="text-2xl font-bold text-foreground">
                    {myCompleted}<span className="text-muted-foreground/40 text-base">/{myModules.length}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">modules done</p>
                </div>
              </motion.div>

              {/* My Blockers */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'rounded-sm border border-border bg-card p-5 border-t-2',
                  myBlockers > 0 ? 'border-t-destructive/60' : 'border-t-muted-foreground/20'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">My Blockers</p>
                </div>
                <p className={cn('text-3xl font-bold', myBlockers > 0 ? 'text-destructive' : 'text-foreground')}>
                  {myBlockers}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">on my modules</p>
              </motion.div>

              {/* Next Deadline */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-sm border border-border bg-card p-5 border-t-2 border-t-[hsl(195_100%_50%/0.3)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3.5 w-3.5 text-[hsl(195_100%_50%)]" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Next Deadline</p>
                </div>
                {myNextDeadline ? (
                  <>
                    <p className="text-xl font-bold text-foreground">{myNextDeadline.planned_end}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">{myNextDeadline.name}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground/50">No upcoming deadlines</p>
                )}
              </motion.div>

              {/* My Extractions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-sm border border-border bg-card p-5 border-t-2 border-t-[hsl(195_100%_50%/0.3)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-3.5 w-3.5 text-[hsl(195_100%_50%)]" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">My Extractions</p>
                </div>
                <p className="text-3xl font-bold text-[hsl(195_100%_50%)]">{myExtractionCount}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">linked to my modules</p>
              </motion.div>
            </>
          ) : (
            <>
              {/* Project View Stats — same as before */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-sm border border-border bg-card p-5 flex items-center gap-4 border-t-2 border-t-primary/40"
              >
                <ProgressRing value={dash.overall_progress.completed} total={dash.overall_progress.total} status={dash.overall_progress.status} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Progress</p>
                  <p className="text-2xl font-bold text-foreground">
                    {dash.overall_progress.completed}<span className="text-muted-foreground/40 text-base">/{dash.overall_progress.total}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">modules done</p>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => navigate(`/projects/${id}/blockers`)}
                className={cn(
                  'rounded-sm border border-border bg-card p-5 text-left border-t-2 transition-colors',
                  dash.active_blockers > 0 ? 'border-t-destructive/60 hover:border-destructive/40' : 'border-t-muted-foreground/20'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Blockers</p>
                </div>
                <p className={cn('text-3xl font-bold', dash.active_blockers > 0 ? 'text-destructive' : 'text-foreground')}>
                  {dash.active_blockers}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">active right now</p>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-sm border border-border bg-card p-5 border-t-2 border-t-[hsl(195_100%_50%/0.3)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-3.5 w-3.5 text-[hsl(195_100%_50%)]" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Delivery</p>
                </div>
                <p className={cn('text-xl font-bold', driftColor)}>{dash.predicted_delivery.date}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-xs font-bold', driftColor)}>{driftLabel}</span>
                  <span className="text-[10px] text-muted-foreground/40">vs target {dash.predicted_delivery.original_target}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-sm border border-border bg-card p-5 border-t-2 border-t-[hsl(195_100%_50%/0.3)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-3.5 w-3.5 text-[hsl(195_100%_50%)]" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Brain Activity</p>
                </div>
                <p className="text-3xl font-bold text-[hsl(195_100%_50%)]">{dash.brain_activity.count}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">extractions this week</p>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Section: Modules */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
          {isMyView ? 'My Modules' : 'Module Status'}
        </p>
        {modsQ.isLoading ? <LoadingSpinner /> : displayModules.length === 0 ? (
          <EmptyState
            title={isMyView ? 'No modules assigned to you' : 'No modules yet'}
            description={isMyView ? 'You don\'t have any modules assigned.' : 'Go to the Plan page to create your first module.'}
            actionLabel={isMyView ? undefined : 'Go to Plan'}
            onAction={isMyView ? undefined : () => navigate(`/projects/${id}/plan`)}
          />
        ) : (
          <div className="relative">
            <AnimatePresence>
              {expandedModule && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-20 bg-background/40 backdrop-blur-[2px]"
                  onClick={() => setExpandedModule(null)}
                />
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayModules.map((mod) => {
                const isExpanded = expandedModule === mod.id;
                const isOtherExpanded = expandedModule !== null && !isExpanded;

                return (
                  <motion.div
                    data-module-card
                    key={mod.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: 1, y: 0,
                      scale: isExpanded ? 1.03 : 1,
                      zIndex: isExpanded ? 30 : 1,
                    }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'rounded-sm border border-border bg-card border-l-2 relative',
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
                        <h3 className="font-semibold text-sm text-foreground leading-snug">{mod.name}</h3>
                        <StatusBadge variant={getModuleStatusVariant(mod.status)}>
                          {mod.status.replace('_', ' ')}
                        </StatusBadge>
                      </div>
                      {mod.owner && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <OwnerAvatar name={mod.owner} />
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{mod.owner}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <ProgressBar value={mod.progress_pct} blocked={mod.status === 'blocked'} className="flex-1" />
                        <span className="text-[10px] text-muted-foreground/60 shrink-0">{mod.progress_pct}%</span>
                      </div>
                      {mod.status === 'blocked' && mod.blocker_reason && (
                        <p className="text-[10px] text-destructive/80 mt-1">⛔ {mod.blocker_reason}</p>
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
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute left-0 right-0 top-full z-30 rounded-b-sm border border-t-0 border-border bg-card shadow-xl"
                        >
                          <div className="border-t border-border p-4 space-y-2">
                            {mod.assumptions?.map(a => (
                              <motion.div key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-3">
                                <span className="w-[72px] shrink-0">
                                  <StatusBadge variant={a.status === 'confirmed' ? 'green' : a.status === 'invalidated' ? 'red' : 'amber'}>{a.status}</StatusBadge>
                                </span>
                                <span className="text-[10px] text-muted-foreground">{a.text}</span>
                              </motion.div>
                            ))}
                            {mod.dependencies?.map(d => (
                              <motion.div key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-3">
                                <span className="w-[72px] shrink-0">
                                  <StatusBadge variant={d.status === 'overdue' ? 'red' : d.status === 'received' ? 'green' : 'amber'}>{d.status}</StatusBadge>
                                </span>
                                <span className="text-[10px] text-muted-foreground">{d.description}</span>
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

      {/* Section: Brain Activity / Action Items */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(195_100%_50%)] shadow-[0_0_6px_hsl(195_100%_50%/0.8)]" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
            {isMyView ? 'My Action Items' : 'Recent Brain Activity'}
          </p>
        </div>

        {isMyView ? (
          <ActionItems modules={myModules} />
        ) : (
          extQ.isLoading ? <LoadingSpinner /> : extractions.length === 0 ? (
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
                      <span className="text-[10px] text-muted-foreground/50">→ {ext.affected_module_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90">{ext.summary}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                    {formatDistanceToNow(new Date(ext.created_at), { addSuffix: true })}
                  </p>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
