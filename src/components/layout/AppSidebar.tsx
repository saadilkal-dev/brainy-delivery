import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Brain, LayoutDashboard, ListChecks, Rss, ShieldAlert, ChevronDown, Menu, X } from 'lucide-react';
import { getProjects } from '@/api/projects';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { label: 'Plan', icon: ListChecks, path: 'plan' },
  { label: 'Ingestion Feed', icon: Rss, path: 'ingestion' },
  { label: 'Blockers & Nudges', icon: ShieldAlert, path: 'blockers' },
];

export function AppSidebar() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const currentProject = projects?.find(p => p.id === id);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Delivery Brain</span>
        </Link>
      </div>

      {id && projects && projects.length > 0 && (
        <div className="p-3 border-b border-border">
          <div className="relative">
            <button
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="w-full flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <span className="truncate">{currentProject?.name || 'Select project'}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', selectorOpen && 'rotate-180')} />
            </button>
            {selectorOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigate(`/projects/${p.id}/dashboard`);
                      setSelectorOpen(false);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                      p.id === id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1">
        {id && navItems.map(item => {
          const to = `/projects/${id}/${item.path}`;
          const active = location.pathname === to;
          return (
            <Link
              key={item.path}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden rounded-md bg-card p-2 text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full glass-sidebar border-r border-border theme-transition">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 glass-sidebar border-r border-border theme-transition">
        {sidebarContent}
      </aside>
    </>
  );
}
