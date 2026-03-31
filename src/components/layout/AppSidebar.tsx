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
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary/50 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Brain className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="leading-none">
            <div className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/50">
              Delivery
            </div>
            <div className="font-heading text-sm font-bold tracking-tight text-foreground">
              Brain
            </div>
          </div>
        </Link>
      </div>

      {/* Project selector */}
      {id && projects && projects.length > 0 && (
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <button
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="w-full flex items-center justify-between rounded-lg bg-white/[0.04] hover:bg-white/[0.07] px-3 py-2 text-xs text-foreground/80 transition-colors border border-white/[0.06]"
            >
              <span className="truncate font-medium">{currentProject?.name || 'Select project'}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ml-2', selectorOpen && 'rotate-180')} />
            </button>
            {selectorOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/[0.1] bg-popover shadow-xl shadow-black/50 backdrop-blur-sm overflow-hidden">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigate(`/projects/${p.id}/dashboard`);
                      setSelectorOpen(false);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-white/[0.05]',
                      p.id === id ? 'text-primary bg-primary/5 font-medium' : 'text-foreground/70'
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
                'flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all relative',
                active
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              )}
            >
              {active && (
                <div className="absolute left-0 inset-y-2 w-0.5 rounded-full bg-primary" />
              )}
              <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-muted-foreground/35 uppercase tracking-widest">
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
        className="fixed top-3 left-3 z-50 md:hidden rounded-lg bg-card/80 backdrop-blur-sm p-2 text-foreground border border-white/[0.08]"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full bg-sidebar border-r border-white/[0.07]">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-white/[0.07]">
        {sidebarContent}
      </aside>
    </>
  );
}
