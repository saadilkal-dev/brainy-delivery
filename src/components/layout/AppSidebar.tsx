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
      {/* Wordmark */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Brain className="h-5 w-5 text-primary" />
            <div className="absolute inset-0 blur-sm bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="leading-none">
            <div className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground/70">
              DELIVERY
            </div>
            <div className="font-heading text-base font-bold tracking-tight text-foreground">
              Brain
            </div>
          </div>
        </Link>
      </div>

      {/* Project selector */}
      {id && projects && projects.length > 0 && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Projects</p>
          <div className="relative">
            <button
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="w-full flex items-center justify-between rounded-sm bg-sidebar-accent px-3 py-2 text-xs font-mono text-foreground/80 transition-colors border border-sidebar-border hover:bg-sidebar-accent/80"
            >
              <span className="truncate">{currentProject?.name || 'Select project'}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ml-2', selectorOpen && 'rotate-180')} />
            </button>
            {selectorOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-sm border border-border bg-popover shadow-xl backdrop-blur-sm">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigate(`/projects/${p.id}/dashboard`);
                      setSelectorOpen(false);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 text-xs font-mono transition-colors hover:bg-accent/50',
                      p.id === id ? 'text-primary bg-primary/5' : 'text-foreground/70'
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

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {id && navItems.map(item => {
          const to = `/projects/${id}/${item.path}`;
          const active = location.pathname === to;
          return (
            <Link
              key={item.path}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-[13px] font-mono transition-all relative',
                active
                  ? 'text-primary border-l-2 border-primary bg-primary/[0.06] pl-[10px]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30 border-l-2 border-transparent pl-[10px]'
              )}
            >
              <item.icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">
          HumAIn PDLC v1
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden rounded-sm bg-card/80 backdrop-blur-sm p-2 text-foreground border border-border"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full bg-sidebar border-r border-sidebar-border">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </aside>
    </>
  );
}
