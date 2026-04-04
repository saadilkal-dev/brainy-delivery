import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '@/api/projects';
import { getModules } from '@/api/modules';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Brain, Navigation, CheckCircle2, AlertTriangle, Clock, Zap, ArrowRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Module } from '@/types';
import type { Project } from '@/types';

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  complete:    { label: 'Complete',    color: 'text-gray-400',   icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-violet-600', icon: Zap },
  blocked:     { label: 'Blocked',     color: 'text-red-500',    icon: AlertTriangle },
  not_started: { label: 'Not Started', color: 'text-gray-300',   icon: Clock },
};

// ─── Module row ─────────────────────────────────────────────────────────────

function ModuleRow({
  module,
  project,
  onClick,
}: {
  module: Module;
  project: Project;
  onClick: () => void;
}) {
  const st = STATUS[module.status] ?? STATUS.not_started;
  const Icon = st.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left',
        'flex items-center gap-4 px-4 py-3.5 rounded-xl',
        'bg-white border border-black/6 shadow-sm',
        'transition-all hover:border-black/12 hover:shadow-md hover:-translate-y-px',
      )}
    >
      {/* Status indicator */}
      <Icon className={cn('w-4 h-4 shrink-0', st.color)} />

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              module.status === 'complete' ? 'text-gray-400 line-through' : 'text-gray-900',
            )}
          >
            {module.name}
          </span>
          {module.status === 'blocked' && (
            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
              BLOCKED
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{project.name}</div>
      </div>

      {/* Progress */}
      <div className="shrink-0 flex items-center gap-3">
        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full"
            style={{ width: `${module.progress_pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-gray-400 w-8 text-right">{module.progress_pct}%</span>
      </div>

      {/* Owner */}
      {module.owner && (
        <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
          <User className="w-3 h-3" />
          {module.owner}
        </div>
      )}

      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
    </button>
  );
}

// ─── Project section ─────────────────────────────────────────────────────────

function ProjectSection({ project, onModuleClick }: { project: Project; onModuleClick: (id: string) => void }) {
  const modsQ = useQuery({ queryKey: ['modules', project.id], queryFn: () => getModules(project.id) });
  const modules = modsQ.data ?? [];
  const sorted = [...modules].sort((a, b) => a.order - b.order);

  if (modsQ.isLoading) return <div className="py-4"><LoadingSpinner /></div>;
  if (sorted.length === 0) return null;

  const completed = modules.filter((m) => m.status === 'complete').length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono">{project.client_name}</div>
          <div className="text-sm font-semibold text-gray-800">{project.name}</div>
        </div>
        <div className="text-xs text-gray-400 font-mono">{completed}/{modules.length}</div>
      </div>
      <div className="space-y-2">
        {sorted.map((mod) => (
          <ModuleRow
            key={mod.id}
            module={mod}
            project={project}
            onClick={() => onModuleClick(mod.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Signal feed ─────────────────────────────────────────────────────────────

const MOCK_SIGNALS = [
  { id: 's1', type: 'progress', msg: 'Product Catalog advanced to 35%', time: '2m ago', color: 'text-violet-500' },
  { id: 's2', type: 'blocker', msg: 'Warranty Lookup blocked — awaiting API spec', time: '14m ago', color: 'text-red-500' },
  { id: 's3', type: 'update', msg: 'ERP Integration dependency received', time: '1h ago', color: 'text-gray-400' },
  { id: 's4', type: 'progress', msg: 'Auth module completed', time: '3h ago', color: 'text-violet-500' },
  { id: 's5', type: 'update', msg: 'Scope refinement meeting notes processed', time: '1d ago', color: 'text-gray-400' },
];

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MissionControl() {
  const navigate = useNavigate();
  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  if (projectsQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]">
        <LoadingSpinner />
      </div>
    );
  }

  const projects = projectsQ.data ?? [];

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-[#f4f3f0] flex overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-lg bg-violet-600 flex items-center justify-center">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono">Mission Control</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Your Modules</h1>
          </div>

          {projects[0] && (
            <button
              onClick={() => navigate(`/team/${projects[0].id}/journey`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              3D Journey
            </button>
          )}
        </div>

        {/* Stats strip rendered per-project via sections */}

        {/* Module sections per project */}
        {projects.map((p) => (
          <ProjectSection
            key={p.id}
            project={p}
            onModuleClick={(moduleId) => navigate(`/team/${p.id}/module/${moduleId}`)}
          />
        ))}
      </div>

      {/* Signal feed sidebar */}
      <aside className="w-72 shrink-0 border-l border-black/6 bg-white/40 backdrop-blur-sm p-5 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono mb-3">
          AI Signals
        </div>

        <div className="space-y-2.5">
          {MOCK_SIGNALS.map((signal) => (
            <div key={signal.id} className="bg-white rounded-xl border border-black/6 p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', signal.color.replace('text-', 'bg-'))} />
                <div className="flex-1">
                  <div className="text-xs text-gray-700 leading-snug">{signal.msg}</div>
                  <div className="text-[10px] text-gray-400 mt-1 font-mono">{signal.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-black/6">
          <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono mb-2">Quick nav</div>
          {projects.slice(0, 2).map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/team/${p.id}/overview`)}
              className="flex items-center gap-2 w-full text-xs text-gray-600 hover:text-violet-700 py-1.5 group"
            >
              <Navigation className="w-3 h-3 text-gray-400 group-hover:text-violet-500" />
              {p.name}
              <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

