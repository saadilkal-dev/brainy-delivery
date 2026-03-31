import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getModules, createModule, addAssumption, updateAssumption, addDependency } from '@/api/modules';
import { getExtractions } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, getModuleStatusVariant, getExtractionTypeVariant, getSourceVariant } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Plus, X, Brain, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Module } from '@/types';

export default function Plan() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddAssumption, setShowAddAssumption] = useState<string | null>(null);
  const [showAddDep, setShowAddDep] = useState<string | null>(null);

  const modsQ = useQuery({ queryKey: ['modules', projectId], queryFn: () => getModules(projectId!), enabled: !!projectId });
  const extQ  = useQuery({ queryKey: ['extractions', projectId], queryFn: () => getExtractions(projectId!), enabled: !!projectId });

  const createMod = useMutation({
    mutationFn: (data: Partial<Module>) => createModule(projectId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules', projectId] }); setShowAddModule(false); toast.success('Module created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const addAssump = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: { text: string; risk_level: string } }) => addAssumption(moduleId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules', projectId] }); setShowAddAssumption(null); toast.success('Assumption added'); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAssump = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAssumption(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules', projectId] }); toast.success('Assumption updated'); },
    onError: (e: any) => toast.error(e.message),
  });

  const addDepMut = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: any }) => addDependency(moduleId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules', projectId] }); setShowAddDep(null); toast.success('Dependency added'); },
    onError: (e: any) => toast.error(e.message),
  });

  if (modsQ.isLoading) return <LoadingSpinner />;
  if (modsQ.isError)   return <ErrorMessage message={modsQ.error.message} onRetry={() => modsQ.refetch()} />;

  const modules = (modsQ.data ?? []).sort((a, b) => a.order - b.order);
  const extractions = extQ.data ?? [];
  const getTab = (modId: string) => activeTab[modId] || 'assumptions';

  return (
    <div className="space-y-6">
      {/* AI Plan Generator card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-xl border border-primary/20 bg-primary/[0.04] p-5 violet-glow overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-3 relative">
          <Brain className="h-4 w-4 text-primary animate-violet-pulse" />
          <h2 className="font-heading font-semibold text-foreground">AI Plan Generator</h2>
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <p className="text-sm text-muted-foreground/70 mb-4 relative">
          Paste your estimation sheet or client brief — AI will propose modules and ask clarifying questions
        </p>
        <Textarea
          placeholder="Paste your estimation sheet or project brief here..."
          className="mb-3 bg-secondary/60 border-primary/10 text-sm placeholder:text-muted-foreground/30 resize-none rounded-lg relative"
          rows={4}
        />
        <Button
          onClick={() => toast.info('Connect your estimation sheet to unlock AI plan generation')}
          className="relative rounded-lg"
        >
          Generate Modules →
        </Button>
      </motion.div>

      {/* Module list */}
      {modules.length === 0 ? (
        <EmptyState title="No modules yet" description="Add your first module to start planning." />
      ) : (
        <div className="space-y-2">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-border/60"
            >
              <button
                onClick={() => setExpanded(expanded === mod.id ? null : mod.id)}
                className="w-full flex items-center gap-4 p-4 text-left group hover:bg-muted/10 transition-colors"
              >
                {/* Zero-padded order number */}
                <span className="font-mono text-sm font-bold text-primary/50 shrink-0 w-8 text-right">
                  {String(mod.order).padStart(2, '0')}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-heading font-semibold text-sm text-foreground truncate">{mod.name}</span>
                    {mod.owner && <StatusBadge variant="grey">{mod.owner}</StatusBadge>}
                    <StatusBadge variant={getModuleStatusVariant(mod.status)}>
                      {mod.status.replace('_', ' ')}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar
                      value={mod.progress_pct}
                      blocked={mod.status === 'blocked'}
                      className="flex-1 max-w-xs"
                    />
                    <span className="font-mono text-[10px] text-muted-foreground/50">{mod.progress_pct}%</span>
                    {mod.estimated_hours && (
                      <span className="font-mono text-[10px] text-muted-foreground/40">{mod.estimated_hours}hrs</span>
                    )}
                  </div>
                </div>

                <ChevronDown className={cn(
                  'h-3.5 w-3.5 text-muted-foreground/30 transition-transform shrink-0',
                  expanded === mod.id && 'rotate-180'
                )} />
              </button>

              {expanded === mod.id && (
                <div className="border-t border-border">
                  {/* Tabs */}
                  <div className="flex border-b border-border px-2 pt-1 gap-1">
                    {['assumptions', 'dependencies', 'brain_updates'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(p => ({ ...p, [mod.id]: tab }))}
                        className={cn(
                          'px-3 py-2 text-xs font-medium transition-colors rounded-t-md border-b-2 -mb-px',
                          getTab(mod.id) === tab
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
                        )}
                      >
                        {tab === 'brain_updates' ? 'AI Updates' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 space-y-3">
                    {getTab(mod.id) === 'assumptions' && (
                      <>
                        {(mod.assumptions ?? []).length === 0 && (
                          <p className="font-mono text-[11px] text-muted-foreground/40">No assumptions logged</p>
                        )}
                        {(mod.assumptions ?? []).map(a => (
                          <div
                            key={a.id}
                            className={cn(
                              'rounded-sm border p-3 space-y-2',
                              a.status === 'confirmed'   ? 'border-success/20 border-l-2 border-l-success' :
                              a.status === 'invalidated' ? 'border-destructive/20 border-l-2 border-l-destructive' :
                              'border-primary/20 border-l-2 border-l-primary'
                            )}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <StatusBadge variant={a.status === 'confirmed' ? 'green' : a.status === 'invalidated' ? 'red' : 'amber'}>
                                {a.status}
                              </StatusBadge>
                              <StatusBadge variant={a.risk_level === 'high' ? 'red' : a.risk_level === 'medium' ? 'amber' : 'grey'}>
                                {a.risk_level} risk
                              </StatusBadge>
                              <span className="font-mono text-xs text-muted-foreground flex-1">{a.text}</span>
                            </div>
                            {a.status === 'invalidated' && a.invalidation_reason && (
                              <p className="font-mono text-[10px] text-destructive/80">{a.invalidation_reason}</p>
                            )}
                            {a.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="font-mono text-xs h-7" onClick={() => updateAssump.mutate({ id: a.id, data: { status: 'confirmed' } })}>
                                  Confirm
                                </Button>
                                <Button size="sm" variant="outline" className="font-mono text-xs h-7 text-destructive" onClick={() => {
                                  const reason = prompt('Invalidation reason:');
                                  if (reason) updateAssump.mutate({ id: a.id, data: { status: 'invalidated', invalidation_reason: reason } });
                                }}>
                                  Invalidate
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        {showAddAssumption === mod.id ? (
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              const fd = new FormData(e.currentTarget);
                              addAssump.mutate({ moduleId: mod.id, data: { text: fd.get('text') as string, risk_level: fd.get('risk_level') as string } });
                            }}
                            className="space-y-2 rounded-sm border border-border p-3"
                          >
                            <Input name="text" placeholder="Assumption text" required className="bg-secondary/60 font-mono text-xs" />
                            <select name="risk_level" className="w-full rounded-sm border border-border bg-secondary/60 px-3 py-2 font-mono text-xs text-foreground" defaultValue="medium">
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <div className="flex gap-2">
                              <Button size="sm" type="submit" disabled={addAssump.isPending} className="font-mono text-xs h-7">Add</Button>
                              <Button size="sm" variant="ghost" type="button" className="font-mono text-xs h-7" onClick={() => setShowAddAssumption(null)}>Cancel</Button>
                            </div>
                          </form>
                        ) : (
                          <Button size="sm" variant="outline" className="font-mono text-[10px] h-7 uppercase tracking-wider" onClick={() => setShowAddAssumption(mod.id)}>
                            <Plus className="h-3 w-3 mr-1" /> Add Assumption
                          </Button>
                        )}
                      </>
                    )}

                    {getTab(mod.id) === 'dependencies' && (
                      <>
                        {(mod.dependencies ?? []).length === 0 && (
                          <p className="font-mono text-[11px] text-muted-foreground/40">No dependencies</p>
                        )}
                        {(mod.dependencies ?? []).map(d => (
                          <div
                            key={d.id}
                            className={cn(
                              'rounded-sm border p-3',
                              d.status === 'overdue' ? 'border-destructive/30 border-l-2 border-l-destructive' : 'border-border'
                            )}
                          >
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <StatusBadge variant={d.status === 'overdue' ? 'red' : d.status === 'received' ? 'green' : 'amber'}>{d.status}</StatusBadge>
                              <StatusBadge variant={d.type === 'client' ? 'purple' : d.type === 'third_party' ? 'blue' : 'grey'}>{d.type}</StatusBadge>
                              <span className="font-mono text-[10px] text-muted-foreground/50">{d.owner}</span>
                            </div>
                            <p className="font-mono text-xs text-foreground/80">{d.description}</p>
                            <p className="font-mono text-[10px] text-muted-foreground/40 mt-1">Expected: {d.expected_date}</p>
                            {d.days_overdue && d.days_overdue > 0 && (
                              <p className="font-mono text-[10px] text-destructive font-bold mt-1">+{d.days_overdue}d overdue</p>
                            )}
                          </div>
                        ))}
                        {showAddDep === mod.id ? (
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              const fd = new FormData(e.currentTarget);
                              addDepMut.mutate({ moduleId: mod.id, data: { description: fd.get('description'), owner: fd.get('owner'), type: fd.get('type'), expected_date: fd.get('expected_date') } });
                            }}
                            className="space-y-2 rounded-sm border border-border p-3"
                          >
                            <Input name="description" placeholder="Description" required className="bg-secondary/60 font-mono text-xs" />
                            <Input name="owner" placeholder="Owner" required className="bg-secondary/60 font-mono text-xs" />
                            <select name="type" className="w-full rounded-sm border border-border bg-secondary/60 px-3 py-2 font-mono text-xs text-foreground">
                              <option value="client">Client</option>
                              <option value="internal">Internal</option>
                              <option value="third_party">Third-party</option>
                            </select>
                            <Input name="expected_date" type="date" required className="bg-secondary/60 font-mono text-xs" />
                            <div className="flex gap-2">
                              <Button size="sm" type="submit" disabled={addDepMut.isPending} className="font-mono text-xs h-7">Add</Button>
                              <Button size="sm" variant="ghost" type="button" className="font-mono text-xs h-7" onClick={() => setShowAddDep(null)}>Cancel</Button>
                            </div>
                          </form>
                        ) : (
                          <Button size="sm" variant="outline" className="font-mono text-[10px] h-7 uppercase tracking-wider" onClick={() => setShowAddDep(mod.id)}>
                            <Plus className="h-3 w-3 mr-1" /> Add Dependency
                          </Button>
                        )}
                      </>
                    )}

                    {getTab(mod.id) === 'brain_updates' && (
                      <>
                        {extractions.filter(e => e.affected_module_id === mod.id).length === 0 ? (
                          <p className="font-mono text-[11px] text-muted-foreground/40">No updates captured for this module yet</p>
                        ) : (
                          extractions.filter(e => e.affected_module_id === mod.id).map(ext => (
                            <div key={ext.id} className="rounded-sm border border-[hsl(195_100%_50%/0.15)] p-3 border-l-2 border-l-[hsl(195_100%_50%/0.5)]">
                              <div className="flex items-center gap-2 mb-1.5">
                                <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
                                <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>
                                  {ext.extraction_type.replace('_', ' ')}
                                </StatusBadge>
                              </div>
                              <p className="font-mono text-xs text-foreground/80">{ext.summary}</p>
                              <p className="font-mono text-[10px] text-muted-foreground/40 mt-1">
                                {formatDistanceToNow(new Date(ext.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Module button */}
      <Button
        onClick={() => setShowAddModule(true)}
        variant="outline"
        className="font-mono text-[10px] uppercase tracking-wider h-8"
      >
        <Plus className="h-3 w-3 mr-1.5" /> Add Module
      </Button>

      {/* Add Module modal */}
      {showAddModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-foreground">Add Module</h3>
              <button onClick={() => setShowAddModule(false)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createMod.mutate({
                  name: fd.get('name') as string,
                  description: fd.get('description') as string,
                  owner: fd.get('owner') as string,
                  estimated_hours: Number(fd.get('estimated_hours')) || undefined,
                  planned_start: fd.get('planned_start') as string || undefined,
                  planned_end: fd.get('planned_end') as string || undefined,
                  order: modules.length + 1,
                });
              }}
              className="space-y-3"
            >
              <Input name="name" placeholder="Module name" required className="bg-secondary/60 border-border font-mono text-sm" />
              <Textarea name="description" placeholder="Description" className="bg-secondary/60 border-border font-mono text-sm resize-none" />
              <Input name="owner" placeholder="Owner" className="bg-secondary/60 border-border font-mono text-sm" />
              <Input name="estimated_hours" type="number" placeholder="Estimated hours" className="bg-secondary/60 border-border font-mono text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <Input name="planned_start" type="date" className="bg-secondary/60 border-border font-mono text-sm" />
                <Input name="planned_end" type="date" className="bg-secondary/60 border-border font-mono text-sm" />
              </div>
              <Button type="submit" disabled={createMod.isPending} className="w-full font-mono text-xs uppercase tracking-wider">
                {createMod.isPending ? 'Creating...' : 'Create Module'}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
