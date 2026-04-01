import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/api/dashboard';
import { getBlockers } from '@/api/blockers';
import { getExtractions } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ShieldAlert, Brain, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, ArrowRight, Zap,
} from 'lucide-react';

const extractionTypeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  blocker: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/8', label: 'Blocker' },
  decision: { icon: Brain, color: 'text-primary', bg: 'bg-primary/8', label: 'Decision' },
  progress_update: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/8', label: 'Progress' },
  priority_change: { icon: Zap, color: 'text-warning', bg: 'bg-warning/8', label: 'Priority' },
};

export default function Tracking() {
  const { id } = useParams();
  const dashQ = useQuery({ queryKey: ['dashboard', id], queryFn: () => getDashboard(id!), enabled: !!id });
  const blockersQ = useQuery({ queryKey: ['blockers', id], queryFn: () => getBlockers(id!), enabled: !!id });
  const extQ = useQuery({ queryKey: ['extractions', id, 10], queryFn: () => getExtractions(id!, 10), enabled: !!id });

  if (dashQ.isLoading) return <div className="p-8"><LoadingSpinner /></div>;

  const dash = dashQ.data;
  const blockers = blockersQ.data ?? [];
  const extractions = extQ.data ?? [];

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Health overview */}
        {dash && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold text-foreground">Project Health</h2>
              <span className="text-xs text-muted-foreground/50 font-mono">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Progress card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="card-elevated p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-primary" />
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/6">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Progress</span>
                </div>
                <p className="font-heading text-3xl font-bold tracking-tight text-foreground">
                  {dash.overall_progress.completed}
                  <span className="text-muted-foreground/40 text-base font-normal ml-1">
                    /{dash.overall_progress.total}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">modules complete</p>
              </motion.div>

              {/* Blockers card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="card-elevated p-5 relative overflow-hidden"
                style={blockers.length > 0 ? { boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04), 0 0 0 1px hsl(var(--destructive) / 0.2)' } : undefined}
              >
                <div className={cn('absolute top-0 left-0 right-0 h-0.5 rounded-t-xl', blockers.length > 0 ? 'bg-destructive' : 'bg-muted-foreground/20')} />
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2 rounded-lg', blockers.length > 0 ? 'bg-destructive/8' : 'bg-muted')}>
                    <ShieldAlert className={cn('h-4 w-4', blockers.length > 0 ? 'text-destructive' : 'text-muted-foreground')} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Blockers</span>
                </div>
                <p className={cn('font-heading text-3xl font-bold tracking-tight', blockers.length > 0 ? 'text-destructive' : 'text-foreground')}>
                  {blockers.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">active right now</p>
              </motion.div>

              {/* AI Signals card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-elevated p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-primary/50" />
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/6">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">AI Signals</span>
                </div>
                <p className="font-heading text-3xl font-bold tracking-tight text-primary">
                  {dash.brain_activity.count}
                </p>
                <p className="text-xs text-muted-foreground mt-1">extractions this week</p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Active blockers */}
        {blockers.length > 0 && (
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Active Blockers
              <span className="text-xs font-normal font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded-full ml-1">
                {blockers.length}
              </span>
            </h2>
            <div className="space-y-3">
              {blockers.map((b, i) => (
                <motion.div
                  key={b.module_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-elevated p-4 border-l-2 border-l-destructive"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04), 0 0 0 1px hsl(var(--destructive) / 0.12)' }}
                >
                  <h3 className="font-semibold text-foreground mb-0.5">{b.module_name}</h3>
                  {b.blocker_reason && (
                    <p className="text-sm text-foreground/60 mt-1">{b.blocker_reason}</p>
                  )}
                  {b.overdue_dependencies.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {b.overdue_dependencies.map(d => (
                        <div key={d.id} className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="flex-1">{d.description}</span>
                          {d.days_overdue && d.days_overdue > 0 && (
                            <span className="font-mono font-bold shrink-0 bg-destructive/10 px-1.5 py-0.5 rounded">
                              +{d.days_overdue}d
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent AI signals */}
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Recent AI Signals
            {extractions.length > 0 && (
              <span className="text-xs font-normal font-mono bg-primary/8 text-primary px-2 py-0.5 rounded-full ml-1">
                {extractions.length}
              </span>
            )}
          </h2>

          {extractions.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <Brain className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No signals yet. Process meeting notes to see AI-extracted insights.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {extractions.map((ext, i) => {
                const cfg = extractionTypeConfig[ext.extraction_type] || extractionTypeConfig.decision;
                const TypeIcon = cfg.icon;
                return (
                  <motion.div
                    key={ext.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="card-elevated p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', cfg.bg)}>
                        <TypeIcon className={cn('h-3.5 w-3.5', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', cfg.color)}>
                            {cfg.label}
                          </span>
                          {ext.affected_module_name && (
                            <>
                              <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                              <span className="text-xs font-medium text-foreground/70">{ext.affected_module_name}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed">{ext.summary}</p>
                        <p className="text-xs text-muted-foreground/40 mt-1.5 font-mono">
                          {formatDistanceToNow(new Date(ext.created_at), { addSuffix: true })} · {ext.source_type}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
