import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/projects';
import { getModules } from '@/api/modules';
import { getExtractions } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OwnerAvatar } from '@/components/ui/OwnerAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Code2, Brain, FolderOpen, ArrowRight, AlertTriangle,
  CheckCircle2, Zap, Clock, TrendingUp, LogOut, ChevronDown,
  FileText, Link2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  complete:     { color: 'text-success', bg: 'bg-success/8', label: 'Complete', icon: CheckCircle2 },
  in_progress:  { color: 'text-primary', bg: 'bg-primary/8', label: 'In Progress', icon: Zap },
  blocked:      { color: 'text-destructive', bg: 'bg-destructive/8', label: 'Blocked', icon: AlertTriangle },
  not_started:  { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Not Started', icon: Clock },
};

function ProjectDetail({ projectId }: { projectId: string }) {
  const modsQ = useQuery({ queryKey: ['modules', projectId], queryFn: () => getModules(projectId) });
  const extQ = useQuery({ queryKey: ['extractions', projectId, 5], queryFn: () => getExtractions(projectId, 5) });
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const modules = modsQ.data ?? [];
  const extractions = extQ.data ?? [];

  // Click outside to collapse
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) {
        setExpandedModule(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (modsQ.isLoading) return <div className="py-4"><LoadingSpinner /></div>;

  const completedCount = modules.filter(m => m.status === 'complete').length;
  const progressPct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress overview */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Overall Progress</span>
            <span className="text-xs font-mono font-semibold text-foreground">{progressPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-mono">{completedCount}/{modules.length}</span>
        </div>
      </div>

      {/* Modules — clickable to expand */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Modules</h3>
        <div className="space-y-2" ref={expandedRef}>
          {modules.map((mod, i) => {
            const config = statusConfig[mod.status] || statusConfig.not_started;
            const StatusIcon = config.icon;
            const isExpanded = expandedModule === mod.id;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'card-elevated overflow-hidden cursor-pointer transition-all',
                  mod.status === 'blocked' && 'ring-1 ring-destructive/10',
                  isExpanded && 'ring-1 ring-primary/20'
                )}
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              >
                <div className="p-3.5 flex items-center gap-3">
                  <div className={cn('p-1.5 rounded-lg', config.bg)}>
                    <StatusIcon className={cn('h-3.5 w-3.5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{mod.name}</h4>
                    {mod.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{mod.description}</p>
                    )}
                    {mod.status === 'blocked' && mod.blocker_reason && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mod.blocker_reason}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <OwnerAvatar name={mod.owner} />
                    <div className="text-right">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden mb-1">
                        <div
                          className={cn('h-full rounded-full', mod.status === 'blocked' ? 'bg-destructive/50' : 'bg-primary/50')}
                          style={{ width: `${mod.progress_pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">{mod.progress_pct}%</span>
                    </div>
                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 text-muted-foreground/40 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="border-t border-border"
                    >
                      <div className="p-4 space-y-4">
                        {/* Assumptions */}
                        <div>
                          <h5 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="h-3 w-3" /> Assumptions
                          </h5>
                          {mod.assumptions && mod.assumptions.length > 0 ? (
                            <ul className="space-y-1">
                              {mod.assumptions.map((a, idx) => (
                                <li key={idx} className="text-xs text-foreground/70 flex items-start gap-2">
                                  <span className={cn(
                                    'inline-block mt-0.5 h-1.5 w-1.5 rounded-full shrink-0',
                                    a.status === 'confirmed' ? 'bg-success' :
                                    a.status === 'invalidated' ? 'bg-destructive' : 'bg-warning'
                                  )} />
                                  <span>{a.text} <span className="text-muted-foreground/50">({a.status})</span></span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground/40 italic">No assumptions recorded</p>
                          )}
                        </div>

                        {/* Dependencies */}
                        <div>
                          <h5 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Link2 className="h-3 w-3" /> Dependencies
                          </h5>
                          {mod.dependencies && mod.dependencies.length > 0 ? (
                            <ul className="space-y-1">
                              {mod.dependencies.map((d, idx) => (
                                <li key={idx} className="text-xs text-foreground/70 flex items-start gap-2">
                                  <span className={cn(
                                    'inline-block mt-0.5 h-1.5 w-1.5 rounded-full shrink-0',
                                    d.status === 'received' ? 'bg-success' :
                                    d.status === 'overdue' ? 'bg-destructive' : 'bg-warning'
                                  )} />
                                  <span>{d.description} <span className="text-muted-foreground/50">({d.status})</span></span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground/40 italic">No dependencies</p>
                          )}
                        </div>

                        {/* Status label */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-md', config.bg, config.color)}>
                            {config.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Owner: {mod.owner}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent signals */}
      {extractions.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent Signals</h3>
          <div className="space-y-1.5">
            {extractions.map((ext, i) => (
              <motion.div
                key={ext.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="flex items-start gap-2.5 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className={cn(
                  'p-1 rounded shrink-0 mt-0.5',
                  ext.extraction_type === 'blocker' ? 'bg-destructive/8' :
                  ext.extraction_type === 'progress_update' ? 'bg-success/8' :
                  'bg-primary/8'
                )}>
                  {ext.extraction_type === 'blocker' ? <AlertTriangle className="h-3 w-3 text-destructive" /> :
                   ext.extraction_type === 'progress_update' ? <CheckCircle2 className="h-3 w-3 text-success" /> :
                   <Brain className="h-3 w-3 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/80 line-clamp-2">{ext.summary}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {formatDistanceToNow(new Date(ext.created_at), { addSuffix: true })}
                    {ext.affected_module_name && ` · ${ext.affected_module_name}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamHome() {
  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (projectsQ.isLoading) return <LoadingSpinner />;

  const projects = projectsQ.data ?? [];
  const currentProject = projects.find(p => p.id === selectedProject);

  const handleSwitchRole = () => {
    sessionStorage.removeItem('delivery-brain-role');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[500px] rounded-full bg-success/[0.03] blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/8 border border-success/10">
              <Code2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Delivery Team</h1>
              <p className="text-sm text-muted-foreground">
                Requirements, progress, and real-time delivery signals
              </p>
            </div>
          </div>
          <button
            onClick={handleSwitchRole}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground/40 hover:text-muted-foreground"
            title="Switch role"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 blur-xl bg-muted-foreground/5 rounded-full scale-150" />
              <Brain className="relative h-12 w-12 text-muted-foreground/20" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You'll be notified when a consultant creates a delivery plan. Projects and their requirements will appear here automatically.
            </p>
          </motion.div>
        ) : !selectedProject ? (
          /* Initial view — show all projects as cards */
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Your Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedProject(p.id)}
                  className="card-interactive p-5 w-full text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/6 shrink-0">
                      <FolderOpen className="h-4 w-4 text-primary/60" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors ml-auto shrink-0" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.client_name}</p>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          /* Project selected — dropdown selector + detail view */
          <div>
            {/* Project dropdown selector */}
            <div className="relative mb-6" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="card-elevated px-4 py-3 flex items-center gap-3 w-full sm:w-auto sm:min-w-[280px] transition-colors hover:bg-muted/30"
              >
                <div className="p-1.5 rounded-lg bg-primary/8">
                  <FolderOpen className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{currentProject?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{currentProject?.client_name}</p>
                </div>
                <ChevronDown className={cn(
                  'h-4 w-4 text-muted-foreground/40 transition-transform',
                  dropdownOpen && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1.5 w-full sm:w-[280px] card-elevated p-1.5 z-50"
                  >
                    <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider px-2.5 py-1.5">
                      Switch project
                    </p>
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProject(p.id); setDropdownOpen(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2.5',
                          p.id === selectedProject
                            ? 'bg-primary/8 text-primary font-medium'
                            : 'text-foreground/70 hover:bg-muted/60'
                        )}
                      >
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        <div className="min-w-0">
                          <span className="block truncate text-sm">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground/50">{p.client_name}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Project detail */}
            <motion.div
              key={selectedProject}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectDetail projectId={selectedProject} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
