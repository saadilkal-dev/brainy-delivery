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
import { ChevronDown, Plus, X } from 'lucide-react';
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
  const extQ = useQuery({ queryKey: ['extractions', projectId], queryFn: () => getExtractions(projectId!), enabled: !!projectId });

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
  if (modsQ.isError) return <ErrorMessage message={modsQ.error.message} onRetry={() => modsQ.refetch()} />;

  const modules = (modsQ.data ?? []).sort((a, b) => a.order - b.order);
  const extractions = extQ.data ?? [];
  const getTab = (modId: string) => activeTab[modId] || 'assumptions';

  return (
    <div className="space-y-6">
      {/* AI Plan Generator */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">AI Plan Generator</h2>
        <p className="text-sm text-muted-foreground mb-3">Generate a plan from an estimation sheet</p>
        <Textarea placeholder="Paste your estimation sheet or project brief here..." className="mb-3 bg-secondary border-border" />
        <Button onClick={() => toast.info('Coming soon — connect estimation sheet API')}>Generate Modules</Button>
      </div>

      {/* Module List */}
      {modules.length === 0 ? (
        <EmptyState title="No modules yet" description="Add your first module to start planning." />
      ) : (
        <div className="space-y-2">
          {modules.map(mod => (
            <div key={mod.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button onClick={() => setExpanded(expanded === mod.id ? null : mod.id)} className="w-full flex items-center gap-4 p-4 text-left">
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-secondary text-xs font-bold">{mod.order}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{mod.name}</span>
                    {mod.owner && <StatusBadge variant="grey">{mod.owner}</StatusBadge>}
                    <StatusBadge variant={getModuleStatusVariant(mod.status)}>{mod.status.replace('_', ' ')}</StatusBadge>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={mod.progress_pct} className="flex-1 max-w-xs" />
                    {mod.estimated_hours && <span className="text-xs text-muted-foreground">{mod.estimated_hours}hrs</span>}
                  </div>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded === mod.id && 'rotate-180')} />
              </button>

              {expanded === mod.id && (
                <div className="border-t border-border">
                  <div className="flex border-b border-border">
                    {['assumptions', 'dependencies', 'brain_updates'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(p => ({ ...p, [mod.id]: tab }))}
                        className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                          getTab(mod.id) === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                        {tab === 'brain_updates' ? 'Brain Updates' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 space-y-3">
                    {getTab(mod.id) === 'assumptions' && (
                      <>
                        {(mod.assumptions ?? []).length === 0 && <p className="text-sm text-muted-foreground">No assumptions</p>}
                        {(mod.assumptions ?? []).map(a => (
                          <div key={a.id} className="rounded border border-border p-3 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <StatusBadge variant={a.status === 'confirmed' ? 'green' : a.status === 'invalidated' ? 'red' : 'amber'}>{a.status}</StatusBadge>
                              <StatusBadge variant={a.risk_level === 'high' ? 'red' : a.risk_level === 'medium' ? 'amber' : 'grey'}>{a.risk_level} risk</StatusBadge>
                              <span className="text-sm flex-1">{a.text}</span>
                            </div>
                            {a.status === 'invalidated' && a.invalidation_reason && <p className="text-xs text-destructive">{a.invalidation_reason}</p>}
                            {a.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => updateAssump.mutate({ id: a.id, data: { status: 'confirmed' } })}>Confirm</Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => {
                                  const reason = prompt('Invalidation reason:');
                                  if (reason) updateAssump.mutate({ id: a.id, data: { status: 'invalidated', invalidation_reason: reason } });
                                }}>Invalidate</Button>
                              </div>
                            )}
                          </div>
                        ))}
                        {showAddAssumption === mod.id ? (
                          <form onSubmit={e => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            addAssump.mutate({ moduleId: mod.id, data: { text: fd.get('text') as string, risk_level: fd.get('risk_level') as string } });
                          }} className="space-y-2 rounded border border-border p-3">
                            <Input name="text" placeholder="Assumption text" required className="bg-secondary" />
                            <select name="risk_level" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground" defaultValue="medium">
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <div className="flex gap-2">
                              <Button size="sm" type="submit" disabled={addAssump.isPending}>Add</Button>
                              <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddAssumption(null)}>Cancel</Button>
                            </div>
                          </form>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setShowAddAssumption(mod.id)}><Plus className="h-3 w-3 mr-1" /> Add Assumption</Button>
                        )}
                      </>
                    )}

                    {getTab(mod.id) === 'dependencies' && (
                      <>
                        {(mod.dependencies ?? []).length === 0 && <p className="text-sm text-muted-foreground">No dependencies</p>}
                        {(mod.dependencies ?? []).map(d => (
                          <div key={d.id} className={cn('rounded border p-3', d.status === 'overdue' ? 'border-destructive/50' : 'border-border')}>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <StatusBadge variant={d.status === 'overdue' ? 'red' : d.status === 'received' ? 'green' : 'amber'}>{d.status}</StatusBadge>
                              <StatusBadge variant={d.type === 'client' ? 'purple' : d.type === 'third_party' ? 'blue' : 'grey'}>{d.type}</StatusBadge>
                              <span className="text-xs text-muted-foreground">{d.owner}</span>
                            </div>
                            <p className="text-sm">{d.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">Expected: {d.expected_date}</p>
                            {d.days_overdue && d.days_overdue > 0 && <p className="text-xs text-destructive">Overdue by {d.days_overdue} days</p>}
                          </div>
                        ))}
                        {showAddDep === mod.id ? (
                          <form onSubmit={e => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            addDepMut.mutate({ moduleId: mod.id, data: { description: fd.get('description'), owner: fd.get('owner'), type: fd.get('type'), expected_date: fd.get('expected_date') } });
                          }} className="space-y-2 rounded border border-border p-3">
                            <Input name="description" placeholder="Description" required className="bg-secondary" />
                            <Input name="owner" placeholder="Owner" required className="bg-secondary" />
                            <select name="type" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                              <option value="client">Client</option>
                              <option value="internal">Internal</option>
                              <option value="third_party">Third-party</option>
                            </select>
                            <Input name="expected_date" type="date" required className="bg-secondary" />
                            <div className="flex gap-2">
                              <Button size="sm" type="submit" disabled={addDepMut.isPending}>Add</Button>
                              <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddDep(null)}>Cancel</Button>
                            </div>
                          </form>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setShowAddDep(mod.id)}><Plus className="h-3 w-3 mr-1" /> Add Dependency</Button>
                        )}
                      </>
                    )}

                    {getTab(mod.id) === 'brain_updates' && (
                      <>
                        {extractions.filter(e => e.affected_module_id === mod.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No updates captured for this module yet</p>
                        ) : (
                          extractions.filter(e => e.affected_module_id === mod.id).map(ext => (
                            <div key={ext.id} className="rounded border border-border p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
                                <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>{ext.extraction_type.replace('_', ' ')}</StatusBadge>
                              </div>
                              <p className="text-sm">{ext.summary}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(ext.created_at), { addSuffix: true })}</p>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Module */}
      <Button onClick={() => setShowAddModule(true)}><Plus className="h-4 w-4 mr-1" /> Add Module</Button>

      {showAddModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add Module</h3>
              <button onClick={() => setShowAddModule(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={e => {
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
            }} className="space-y-3">
              <Input name="name" placeholder="Module name" required className="bg-secondary" />
              <Textarea name="description" placeholder="Description" className="bg-secondary" />
              <Input name="owner" placeholder="Owner" className="bg-secondary" />
              <Input name="estimated_hours" type="number" placeholder="Estimated hours" className="bg-secondary" />
              <div className="grid grid-cols-2 gap-3">
                <Input name="planned_start" type="date" className="bg-secondary" />
                <Input name="planned_end" type="date" className="bg-secondary" />
              </div>
              <Button type="submit" disabled={createMod.isPending} className="w-full">Create Module</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
