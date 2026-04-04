import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '@/api/projects';
import { getModules } from '@/api/modules';
import { mockMeetingNotes } from '@/api/mockMeetingNotes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Plus, ArrowRight, Calendar, Users, Navigation,
  MessageSquare, Brain, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

// ─── Mini road SVG preview ───────────────────────────────────────────────────

function MiniRoad({ progress }: { progress: number }) {
  const w = 160;
  const h = 40;

  // Simple organic-ish SVG path
  const path = `M 4,${h / 2 + 6} C 30,${h / 2 - 10} 60,${h / 2 + 12} 90,${h / 2 - 8} S 140,${h / 2 + 10} ${w - 4},${h / 2}`;

  // Approximate point on path at `progress` t — rough linear for SVG preview
  const px = 4 + progress * (w - 8);
  const py = h / 2 + Math.sin(progress * Math.PI * 2.4) * 8;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {/* Full road (upcoming) */}
      <path d={path} fill="none" stroke="#d4d0c8" strokeWidth={3} strokeLinecap="round" />
      {/* Completed portion — clip approximation */}
      <path
        d={path}
        fill="none"
        stroke="#2d2d2d"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${progress * (w - 8) * 1.1} ${w}`}
      />
      {/* Pulse dot */}
      {progress > 0 && (
        <>
          <circle cx={px} cy={py} r={5} fill="#7c3aed" opacity={0.15} />
          <circle cx={px} cy={py} r={3} fill="#7c3aed" />
        </>
      )}
    </svg>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const modsQ = useQuery({
    queryKey: ['modules', project.id],
    queryFn: () => getModules(project.id),
  });
  const mods = modsQ.data ?? [];
  const completed = mods.filter((m) => m.status === 'complete').length;
  const progress = mods.length > 0 ? completed / mods.length : 0;
  const progressPct = Math.round(progress * 100);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left',
        'bg-white rounded-2xl border border-black/6 shadow-sm',
        'p-5 transition-all duration-200',
        'hover:shadow-md hover:border-black/10 hover:-translate-y-0.5',
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono mb-1">
            {project.client_name}
          </div>
          <div className="text-sm font-semibold text-gray-900 leading-snug">{project.name}</div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-violet-600 transition-colors">
          <Navigation className="w-3 h-3" />
          <span className="font-mono">Open</span>
        </div>
      </div>

      {/* Mini road SVG */}
      <div className="mb-3">
        <MiniRoad progress={progress} />
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="font-mono tabular-nums">{completed}/{mods.length} modules</span>
          {project.target_date && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(project.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <span className="font-mono text-xs font-semibold text-gray-700">{progressPct}%</span>
      </div>
    </button>
  );
}

// ─── Meeting note card ────────────────────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: typeof mockMeetingNotes[0] }) {
  return (
    <div className="bg-white rounded-xl border border-black/6 p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center mt-0.5">
          <Calendar className="w-3.5 h-3.5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">{meeting.title}</div>
          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{meeting.date}</div>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
            <Users className="w-3 h-3" />
            {meeting.attendees.length} attendees
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create project form ─────────────────────────────────────────────────────

function CreateForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [target, setTarget] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
      navigate(`/consultant/${project.id}/interview`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !client.trim()) return;
    createMut.mutate({ name: name.trim(), client_name: client.trim(), target_date: target || undefined } as any);
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-black/8 shadow-xl p-6 w-full max-w-sm">
        <div className="text-sm font-semibold text-gray-900 mb-4">New Project</div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Project name</label>
            <input
              ref={inputRef}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daikin Service Portal"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Client</label>
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. Daikin"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Target date (optional)</label>
            <input
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm text-gray-900 focus:outline-none focus:border-violet-400"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!name.trim() || !client.trim() || createMut.isPending}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {createMut.isPending ? 'Creating...' : 'Create & start interview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-black/10 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConsultantHome() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  if (projectsQ.isLoading) return (
    <div className="min-h-screen bg-[#f4f3f0] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  const projects = projectsQ.data ?? [];
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-[#f4f3f0] flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-black/6 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">Delivery Brain</span>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('delivery-brain-role');
            window.location.href = '/';
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Switch role
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{greeting}</h1>
            <p className="text-sm text-gray-500">
              {projects.length > 0
                ? `${projects.length} active project${projects.length > 1 ? 's' : ''} in progress`
                : 'Start your first project'}
            </p>
          </div>

          {/* Project grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => navigate(`/consultant/${p.id}/journey`)}
              />
            ))}

            {/* New project card */}
            <button
              onClick={() => setShowCreate(true)}
              className={cn(
                'group w-full text-left',
                'bg-white/60 rounded-2xl border border-dashed border-black/15',
                'p-5 transition-all duration-200',
                'hover:bg-white hover:border-violet-300 hover:shadow-sm',
                'flex flex-col items-center justify-center gap-2 min-h-[140px]',
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                <Plus className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">New Project</div>
                <div className="text-xs text-gray-400">Start AI discovery interview</div>
              </div>
            </button>
          </div>

          {/* Shortcut hint */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Navigation className="w-3 h-3" />
            <span>Click a project to enter the 3D immersive journey</span>
          </div>
        </div>

        {/* Right sidebar — meeting notes */}
        <aside className="w-72 shrink-0 border-l border-black/6 bg-white/40 backdrop-blur-sm p-5 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono mb-3">
            Recent Meetings
          </div>
          <div className="space-y-2">
            {mockMeetingNotes.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-black/6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono mb-2">
              Quick actions
            </div>
            <div className="space-y-1.5">
              {projects[0] && (
                <>
                  <button
                    onClick={() => navigate(`/consultant/${projects[0].id}/interview`)}
                    className="flex items-center gap-2 w-full text-xs text-gray-600 hover:text-violet-700 py-1.5 group"
                  >
                    <MessageSquare className="w-3 h-3 text-gray-400 group-hover:text-violet-500" />
                    Start new interview
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={() => navigate(`/consultant/${projects[0].id}/journey`)}
                    className="flex items-center gap-2 w-full text-xs text-gray-600 hover:text-violet-700 py-1.5 group"
                  >
                    <Navigation className="w-3 h-3 text-gray-400 group-hover:text-violet-500" />
                    Open 3D journey
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {showCreate && <CreateForm onClose={() => setShowCreate(false)} />}
    </div>
  );
}
