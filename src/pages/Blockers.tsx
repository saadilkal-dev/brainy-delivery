import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getBlockers, generateNudge, sendNudge, getNudges } from '@/api/blockers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Eye, ShieldAlert, Brain } from 'lucide-react';
import type { Nudge } from '@/types';
import { format } from 'date-fns';

export default function Blockers() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [nudgeModal, setNudgeModal] = useState<Nudge | null>(null);
  const [viewNudge, setViewNudge] = useState<Nudge | null>(null);
  const [editBody, setEditBody] = useState('');

  const blockersQ = useQuery({ queryKey: ['blockers', projectId], queryFn: () => getBlockers(projectId!), enabled: !!projectId });
  const nudgesQ   = useQuery({ queryKey: ['nudges', projectId],   queryFn: () => getNudges(projectId!),   enabled: !!projectId });

  const genNudge = useMutation({
    mutationFn: (depId: string) => generateNudge(depId),
    onSuccess: (nudge) => { setNudgeModal(nudge); setEditBody(nudge.body); toast.success('Nudge email generated'); },
    onError: (e: any) => toast.error(`❌ ${e.message}`),
  });

  const sendNudgeMut = useMutation({
    mutationFn: (nudgeId: string) => sendNudge(nudgeId),
    onSuccess: () => {
      toast.success('Nudge marked as sent');
      setNudgeModal(null);
      qc.invalidateQueries({ queryKey: ['nudges', projectId] });
    },
    onError: (e: any) => toast.error(`❌ ${e.message}`),
  });

  if (blockersQ.isLoading) return <LoadingSpinner />;
  if (blockersQ.isError)   return <ErrorMessage message={blockersQ.error.message} onRetry={() => blockersQ.refetch()} />;

  const blockers = blockersQ.data ?? [];
  const nudges   = nudgesQ.data ?? [];

  return (
    <div className="space-y-10">
      {/* Active Blockers */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <h2 className="font-heading font-semibold text-foreground">Active Blockers</h2>
          {blockers.length > 0 && (
            <span className="font-mono text-xs text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-sm">
              {blockers.length}
            </span>
          )}
        </div>

        {blockers.length === 0 ? (
          <EmptyState title="No active blockers" description="All clear! No modules are currently blocked." />
        ) : (
          <div className="space-y-4">
            {blockers.map((b, i) => (
              <motion.div
                key={b.module_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-xl bg-card p-5 space-y-4 overflow-hidden red-glow"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />
                <div className="flex items-center gap-3">
                  <h3 className="font-heading text-base font-semibold text-destructive">{b.module_name}</h3>
                  <StatusBadge variant="red">Blocked</StatusBadge>
                </div>

                {b.blocker_reason && (
                  <p className="text-sm text-foreground/70">{b.blocker_reason}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
                  {b.blocked_since && (
                    <span>Blocked since {b.blocked_since}</span>
                  )}
                  {b.downstream_modules && b.downstream_modules.length > 0 && (
                    <span>Downstream: {b.downstream_modules.join(', ')}</span>
                  )}
                </div>

                {b.overdue_dependencies.length > 0 && (
                  <div className="space-y-2">
                    {b.overdue_dependencies.map(d => (
                      <div key={d.id} className="rounded-xl border border-destructive/15 bg-destructive/[0.03] p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge variant="red">Overdue</StatusBadge>
                          <StatusBadge variant={d.type === 'client' ? 'purple' : d.type === 'third_party' ? 'blue' : 'grey'}>
                            {d.type}
                          </StatusBadge>
                          <span className="font-mono text-[10px] text-muted-foreground/50">{d.owner}</span>
                        </div>
                        <p className="text-sm text-foreground/80">{d.description}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground/50">Expected: {d.expected_date}</p>
                            {d.days_overdue && d.days_overdue > 0 && (
                              <p className="font-mono text-base font-bold text-destructive leading-tight mt-0.5">+{d.days_overdue}d overdue</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => genNudge.mutate(d.id)}
                            disabled={genNudge.isPending}
                            className="text-xs h-8 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:text-primary rounded-lg"
                            variant="ghost"
                          >
                            {genNudge.isPending ? 'Generating...' : 'Generate Nudge →'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Nudge History */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(195_100%_50%)] shadow-[0_0_6px_hsl(195_100%_50%/0.8)]" />
          <h2 className="font-heading font-semibold text-foreground">Nudge History</h2>
        </div>

        {nudgesQ.isLoading ? <LoadingSpinner /> : nudges.length === 0 ? (
          <EmptyState title="No nudges sent yet" />
        ) : (
          <div className="space-y-2">
            {nudges.map(n => (
              <div key={n.id} className="rounded-xl bg-card p-4 flex items-center justify-between gap-4 card-shadow">
                <div className="min-w-0">
                  <p className="text-sm text-foreground/80 truncate">{n.dependency_description}</p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">
                    To: {n.recipient} · {format(new Date(n.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge variant={n.status === 'sent' ? 'green' : 'amber'}>{n.status}</StatusBadge>
                  <button
                    onClick={() => setViewNudge(n)}
                    className="p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nudge Modal */}
      {nudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Generated Nudge Email</h3>
              </div>
              <button onClick={() => setNudgeModal(null)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/60">Subject</label>
              <p className="text-sm text-foreground/90 bg-secondary/40 border border-border rounded-lg px-3 py-2">
                {nudgeModal.subject}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/60">Body</label>
              <Textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                className="bg-secondary/40 border-border text-sm min-h-[150px] resize-none rounded-lg"
              />
            </div>

            <p className="text-xs text-muted-foreground/40 italic">
              Copy and send manually — direct email delivery coming in v2
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => sendNudgeMut.mutate(nudgeModal.id)}
                disabled={sendNudgeMut.isPending}
                className="text-sm rounded-lg"
              >
                Mark as Sent
              </Button>
              <Button
                variant="outline"
                className="text-sm rounded-lg"
                onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${nudgeModal.subject}\n\n${editBody}`);
                  toast.success('Copied to clipboard');
                }}
              >
                <Copy className="h-3 w-3 mr-1.5" /> Copy
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Nudge Modal */}
      {viewNudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-foreground">Nudge Details</h3>
              <button onClick={() => setViewNudge(null)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/60">Subject</label>
              <p className="text-sm text-foreground/90">{viewNudge.subject}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/60">Body</label>
              <p className="text-sm text-muted-foreground/70 whitespace-pre-wrap leading-relaxed">{viewNudge.body}</p>
            </div>
            <Button variant="outline" className="text-sm rounded-lg" onClick={() => setViewNudge(null)}>
              Close
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
