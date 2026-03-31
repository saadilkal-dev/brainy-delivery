import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDashboard } from '@/api/dashboard';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  plan: 'Plan',
  ingestion: 'Ingestion Feed',
  blockers: 'Blockers & Nudges',
};

export function TopBar() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const segment = location.pathname.split('/').pop() || '';
  const title = pageTitles[segment] || 'Delivery Brain';

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', id],
    queryFn: () => getDashboard(id!),
    enabled: !!id,
  });

  const blockerCount = dashboard?.active_blockers ?? 0;

  return (
    <header className="h-12 border-b border-white/[0.07] flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3 md:pl-0 pl-10">
        {/* Live dot */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(195_100%_50%)] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(195_100%_50%)]" />
        </span>
        <h1 className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {blockerCount > 0 && (
          <button
            onClick={() => id && navigate(`/projects/${id}/blockers`)}
            className="relative flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
            </span>
            {blockerCount} blocker{blockerCount > 1 ? 's' : ''}
          </button>
        )}
        <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider hidden sm:block">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
