import { Outlet, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Map, Activity, ChevronDown, Command, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/projects';
import { useState, useEffect, useRef } from 'react';

const navItems = [
  { label: 'Co-Create', icon: Sparkles, path: 'cocreate', description: 'Plan with AI' },
  { label: 'Live Map', icon: Map, path: 'map', description: 'Roadmap view' },
  { label: 'Tracking', icon: Activity, path: 'tracking', description: 'Health & nudges' },
];

export function ConsultantShell() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const currentProject = projects?.find(p => p.id === id);
  const activePath = location.pathname.split('/').pop();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSwitchRole = () => {
    sessionStorage.removeItem('delivery-brain-role');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav bar */}
      <header className="h-14 border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link to="/consultant" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 blur-md bg-primary/15 rounded-lg scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-1.5 rounded-lg bg-primary/8 border border-primary/10 group-hover:bg-primary/12 transition-colors">
                <Brain className="h-4 w-4 text-primary" />
              </div>
            </div>
            <span className="font-heading text-sm font-bold text-foreground hidden sm:block">
              Delivery Brain
            </span>
          </Link>

          <div className="h-5 w-px bg-border" />

          {/* Project selector */}
          <div className="relative" ref={selectorRef}>
            <button
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="flex items-center gap-1.5 text-sm text-foreground/80 hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
            >
              <span className="font-medium truncate max-w-[200px]">
                {currentProject?.name || 'Project'}
              </span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', selectorOpen && 'rotate-180')} />
            </button>
            {selectorOpen && projects && (
              <div className="absolute top-full left-0 mt-2 w-60 card-elevated p-1.5 z-50 animate-scale-in">
                <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider px-2.5 py-1.5">
                  Switch project
                </p>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { navigate(`/consultant/${p.id}/${activePath}`); setSelectorOpen(false); }}
                    className={cn(
                      'w-full text-left px-2.5 py-2 text-sm rounded-lg transition-colors',
                      p.id === id ? 'bg-primary/8 text-primary font-medium' : 'text-foreground/70 hover:bg-muted/60'
                    )}
                  >
                    <span className="block truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground/50">{p.client_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center nav */}
        <nav className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-0.5">
          {navItems.map(item => {
            const active = activePath === item.path;
            return (
              <Link
                key={item.path}
                to={`/consultant/${id}/${item.path}`}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg transition-all',
                  active
                    ? 'bg-white text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-3.5 w-3.5', active && 'text-primary')} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Cmd+K hint */}
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40 transition-colors border border-transparent hover:border-border"
          >
            <Command className="h-3 w-3" />
            <span className="font-mono">K</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">Connected</span>
          </div>

          <button
            onClick={handleSwitchRole}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground/40 hover:text-muted-foreground"
            title="Switch role"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
