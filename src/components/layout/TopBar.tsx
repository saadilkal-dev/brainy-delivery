import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ThemeToggle } from '@/components/ThemeToggle';
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
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
      <h1 className="text-lg font-semibold text-foreground md:pl-0 pl-10">{title}</h1>
      <button
        onClick={() => id && navigate(`/projects/${id}/blockers`)}
        className="relative text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {blockerCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {blockerCount}
          </span>
        )}
      </button>
    </header>
  );
}
