import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDashboard } from '@/api/dashboard';

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
    <header className="h-12 border-b border-border flex items-center justify-between px-6 bg-background/85 backdrop-blur-sm border-b border-border sticky top-0 z-30">
      <div className="flex items-center gap-2.5 md:pl-0 pl-10">
        {/* Live pulse dot */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(175_85%_55%)] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(175_85%_55%)]" />
        </span>
        <h1 className="font-heading text-sm font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {blockerCount > 0 && (
          <button
            onClick={() => id && navigate(`/projects/${id}/blockers`)}
            className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
            </span>
            {blockerCount} blocker{blockerCount > 1 ? 's' : ''}
          </button>
        )}
        <div className="text-xs text-muted-foreground/40 hidden sm:block">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
