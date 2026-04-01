import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getModules } from '@/api/modules';
import { getDashboard } from '@/api/dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MapPin, AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react';

const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string; icon: any }> = {
  complete:    { color: 'text-success', bg: 'bg-success/8', dot: 'bg-success', label: 'Complete', icon: CheckCircle2 },
  in_progress: { color: 'text-primary', bg: 'bg-primary/8', dot: 'bg-primary', label: 'In Progress', icon: Zap },
  blocked:     { color: 'text-destructive', bg: 'bg-destructive/8', dot: 'bg-destructive', label: 'Blocked', icon: AlertTriangle },
  not_started: { color: 'text-muted-foreground/50', bg: 'bg-muted/60', dot: 'bg-muted-foreground/30', label: 'Not Started', icon: Clock },
};

export default function LiveMap() {
  const { id } = useParams();
  const modsQ = useQuery({ queryKey: ['modules', id], queryFn: () => getModules(id!), enabled: !!id });
  const dashQ = useQuery({ queryKey: ['dashboard', id], queryFn: () => getDashboard(id!), enabled: !!id });

  if (modsQ.isLoading || dashQ.isLoading) return <div className="p-8"><LoadingSpinner /></div>;

  const modules = modsQ.data ?? [];
  const dash = dashQ.data;
  const completeCount = modules.filter(m => m.status === 'complete').length;

  // First non-complete module = "you are here"
  const currentIdx = modules.findIndex(m => m.status !== 'complete');

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-white/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-lg font-bold text-foreground">Live Roadmap</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time delivery progress · updated from code, meetings, and signals
              </p>
            </div>
            {dash && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Target</p>
                  <p className="font-mono text-sm font-semibold text-foreground">{dash.predicted_delivery.date}</p>
                </div>
                <div className={cn(
                  'text-right px-3 py-1.5 rounded-lg border',
                  dash.predicted_delivery.drift_days <= 0
                    ? 'bg-success/6 border-success/15'
                    : dash.predicted_delivery.drift_days <= 5
                    ? 'bg-warning/6 border-warning/15'
                    : 'bg-destructive/6 border-destructive/15'
                )}>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Drift</p>
                  <p className={cn(
                    'font-mono text-sm font-bold',
                    dash.predicted_delivery.drift_days <= 0 ? 'text-success'
                    : dash.predicted_delivery.drift_days <= 5 ? 'text-warning'
                    : 'text-destructive'
                  )}>
                    {dash.predicted_delivery.drift_days === 0
                      ? 'On track'
                      : `${dash.predicted_delivery.drift_days > 0 ? '+' : ''}${dash.predicted_delivery.drift_days}d`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">Overall Progress</span>
              </div>
              <span className="text-xs font-mono font-semibold text-foreground">
                {completeCount}/{modules.length} modules
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completeCount / Math.max(modules.length, 1)) * 100}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module timeline */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-border via-border to-transparent" />

          <div className="space-y-4">
            {modules.map((mod, i) => {
              const config = statusConfig[mod.status] || statusConfig.not_started;
              const StatusIcon = config.icon;
              const isCurrent = i === currentIdx;

              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex gap-4"
                >
                  {/* Node */}
                  <div className="relative z-10 flex items-start shrink-0 pt-4">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all',
                      isCurrent
                        ? 'border-primary bg-primary/10 ring-4 ring-primary/10 shadow-sm'
                        : mod.status === 'complete'
                        ? 'border-success/40 bg-success/8'
                        : mod.status === 'blocked'
                        ? 'border-destructive/40 bg-destructive/8'
                        : mod.status === 'in_progress'
                        ? 'border-primary/30 bg-primary/6'
                        : 'border-border bg-white'
                    )}>
                      {isCurrent ? (
                        <MapPin className="h-4 w-4 text-primary" />
                      ) : (
                        <StatusIcon className={cn('h-3.5 w-3.5', config.color)} />
                      )}
                    </div>
                  </div>

                  {/* Card */}
                  <div className={cn(
                    'flex-1 card-elevated p-4 min-w-0 transition-all',
                    isCurrent && 'ring-2 ring-primary/15',
                    mod.status === 'blocked' && 'ring-1 ring-destructive/15 border-l-2 border-l-destructive'
                  )}>
                    {/* Header row */}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full shrink-0">
                              You are here
                            </span>
                          )}
                          <h3 className="font-semibold text-foreground text-sm leading-tight">{mod.name}</h3>
                        </div>
                        {mod.owner && (
                          <p className="text-xs text-muted-foreground">{mod.owner}</p>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shrink-0',
                        config.bg, config.color
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
                        {config.label}
                      </div>
                    </div>

                    {/* Blocker reason */}
                    {mod.status === 'blocked' && mod.blocker_reason && (
                      <div className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/5 rounded-lg px-2.5 py-1.5 mb-2">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>{mod.blocker_reason}</span>
                      </div>
                    )}

                    {/* Progress row */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            mod.status === 'blocked' ? 'bg-destructive/50'
                            : mod.status === 'complete' ? 'bg-success'
                            : 'bg-primary'
                          )}
                          style={{ width: `${mod.progress_pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-8 text-right">
                        {mod.progress_pct}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-10 pt-6 border-t border-border">
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className={cn('h-3.5 w-3.5', config.color)} />
                {config.label}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <MapPin className="h-3.5 w-3.5" />
            Current position
          </div>
        </div>
      </div>
    </div>
  );
}
