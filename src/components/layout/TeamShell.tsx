import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { Brain, LayoutDashboard, Navigation, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/projects';

export function TeamShell() {
  const { projectId } = useParams();
  const location = useLocation();
  const activePath = location.pathname.split('/').pop();
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const project = projects?.find((p) => p.id === projectId);

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: 'overview' },
    { label: 'Journey', icon: Navigation, path: 'journey' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3f0]">
      <header className="h-14 border-b border-black/6 bg-white/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link to="/team" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Delivery Brain</span>
          </Link>
          <div className="h-4 w-px bg-black/10" />
          <span className="text-sm text-gray-500">{project?.name ?? 'Project'}</span>
        </div>

        <nav className="flex items-center gap-0.5 bg-black/5 rounded-xl p-0.5">
          {navItems.map((item) => {
            const active = activePath === item.path;
            return (
              <Link
                key={item.path}
                to={`/team/${projectId}/${item.path}`}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg transition-all',
                  active
                    ? 'bg-white text-gray-900 font-medium shadow-sm'
                    : 'text-gray-500 hover:text-gray-800',
                )}
              >
                <item.icon className={cn('h-3.5 w-3.5', active && 'text-violet-600')} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => {
            sessionStorage.removeItem('delivery-brain-role');
            window.location.href = '/';
          }}
          className="p-1.5 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
          title="Switch role"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
