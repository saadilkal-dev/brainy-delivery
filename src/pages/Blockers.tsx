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
import { X, Copy, Eye } from 'lucide-react';
import type { Nudge } from '@/types';
import { format } from 'date-fns';

export default function Blockers() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [nudgeModal, setNudgeModal] = useState<Nudge | null>(null);
  const [viewNudge, setViewNudge] = useState<Nudge | null>(null);
  const [editBody, setEditBody] = useState('');

  const blockersQ = useQuery({ queryKey: ['blockers', projectId], queryFn: () => getBlockers(projectId!), enabled: !!projectId });
  const nudgesQ = useQuery({ queryKey: ['nudges', projectId], queryFn: () => getNudges(projectId!), enabled: !!projectId });

  const genNudge = useMutation({
    mutationFn: (depId: string) => generateNudge(depId),
    onSuccess: (nudge) => { setNudgeModal(nudge); setEditBody(nudge.body); toast.success('✅ Nudge email generated'); },
    onError: (e: any) => toast.error(`❌ ${e.message}`),
  });

  const sendNudgeMut = useMutation({
    mutationFn: (nudgeId: string) => sendNudge(nudgeId),
    onSuccess: () => {
      toast.success('✅ Nudge marked as sent');
      setNudgeModal(null);
      qc.invalidateQueries({ queryKey: ['nudges', projectId] });
    },
    onError: (e: any) => toast.error(`❌ ${e.message}`),
  });

  if (blockersQ.isLoading) return <LoadingSpinner />;
  if (blockersQ.isError) return <ErrorMessage message={blockersQ.error.message} onRetry={() => blockersQ.refetch()} />;

  const blockers = blockersQ.data ?? [];
  const nudges = nudgesQ.data ?? [];

  return (
    <div className="space-y-8">
      {/* Active Blockers */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Blockers</h2>
        {blockers.length === 0 ? (
          <EmptyState title="No active blockers" description="All clear! No modules are currently blocked." />
        ) : (
          <div className="space-y-4">
            {blockers.map(b => (
              <div key={b.module_id} className="rounded-lg border border-destructive/30 bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{b.module_name}</h3>
                  <StatusBadge variant="red">Blocked</StatusBadge>
                </div>
                <p className="text-sm text-foreground">{b.blocker_reason}</p>
                {b.blocked_since && <p className="text-xs text-muted-foreground">Blocked since {b.blocked_since}</p>}
                {b.downstream_modules && b.downstream_modules.length > 0 && (
                  <p className="text-xs text-muted-foreground">Downstream affected: {b.downstream_modules.join(', ')}</p>
                )}

                {b.overdue_dependencies.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-destructive/30">
                    {b.overdue_dependencies.map(d => (
                      <div key={d.id} className="rounded border border-border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge variant="red">Overdue</StatusBadge>
                          <StatusBadge variant={d.type === 'client' ? 'purple' : d.type === 'third_party' ? 'blue' : 'grey'}>{d.type}</StatusBadge>
                          <span className="text-xs text-muted-foreground">{d.owner}</span>
                        </div>
                        <p className="text-sm">{d.description}</p>
                        <p className="text-xs text-muted-foreground">Expected: {d.expected_date}</p>
                        {d.days_overdue && <p className="text-xs text-destructive font-medium">Overdue by {d.days_overdue} days</p>}
                        <Button size="sm" className="mt-2" onClick={() => genNudge.mutate(d.id)} disabled={genNudge.isPending}>
                          {genNudge.isPending ? 'Generating...' : 'Generate Nudge Email'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nudge History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Nudge History</h2>
        {nudgesQ.isLoading ? <LoadingSpinner /> : nudges.length === 0 ? (
          <EmptyState title="No nudges sent yet" />
        ) : (
          <div className="space-y-2">
            {nudges.map(n => (
              <div key={n.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{n.dependency_description}</p>
                  <p className="text-xs text-muted-foreground">To: {n.recipient} · {format(new Date(n.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={n.status === 'sent' ? 'green' : 'amber'}>{n.status}</StatusBadge>
                  <Button size="sm" variant="ghost" onClick={() => setViewNudge(n)}><Eye className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nudge Modal */}
      {nudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Generated Nudge Email</h3>
              <button onClick={() => setNudgeModal(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Subject</label>
              <p className="text-sm font-medium mt-1">{nudgeModal.subject}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Body</label>
              <Textarea value={editBody} onChange={e => setEditBody(e.target.value)} className="mt-1 bg-secondary min-h-[150px]" />
            </div>
            <p className="text-xs text-muted-foreground italic">Actual email delivery coming in v2. Copy the text and send manually for now.</p>
            <div className="flex gap-3">
              <Button onClick={() => sendNudgeMut.mutate(nudgeModal.id)} disabled={sendNudgeMut.isPending}>Mark as Sent</Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`Subject: ${nudgeModal.subject}\n\n${editBody}`); toast.success('Copied to clipboard'); }}>
                <Copy className="h-4 w-4 mr-1" /> Copy to Clipboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Nudge Modal */}
      {viewNudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Nudge Details</h3>
              <button onClick={() => setViewNudge(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div><label className="text-xs text-muted-foreground">Subject</label><p className="text-sm font-medium mt-1">{viewNudge.subject}</p></div>
            <div><label className="text-xs text-muted-foreground">Body</label><p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">{viewNudge.body}</p></div>
            <Button variant="outline" onClick={() => setViewNudge(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
