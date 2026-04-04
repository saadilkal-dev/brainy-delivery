import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getModules } from '@/api/modules';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Clock, Zap,
  User, Calendar, Link2, FileText, ShieldAlert, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS = {
  complete:    { label: 'Complete',    icon: CheckCircle2, color: 'text-gray-400',   bg: 'bg-gray-50' },
  in_progress: { label: 'In Progress', icon: Zap,          color: 'text-violet-600', bg: 'bg-violet-50' },
  blocked:     { label: 'Blocked',     icon: AlertTriangle, color: 'text-red-500',   bg: 'bg-red-50' },
  not_started: { label: 'Not Started', icon: Clock,        color: 'text-gray-400',   bg: 'bg-gray-50' },
};

const RISK_COLOR = { low: 'text-gray-400', medium: 'text-amber-600', high: 'text-red-500' };

export default function ModuleWorkstation() {
  const { projectId, moduleId } = useParams<{ projectId: string; moduleId: string }>();
  const navigate = useNavigate();

  const modsQ = useQuery({
    queryKey: ['modules', projectId],
    queryFn: () => getModules(projectId!),
    enabled: !!projectId,
  });

  const module = modsQ.data?.find((m) => m.id === moduleId);

  if (modsQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]">
        <div className="text-gray-400 text-sm font-mono">Module not found</div>
      </div>
    );
  }

  const st = STATUS[module.status] ?? STATUS.not_started;
  const StatusIcon = st.icon;

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-[#f4f3f0] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {/* Module header */}
        <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3', st.bg, st.color)}>
                <StatusIcon className="w-3 h-3" />
                {st.label}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{module.name}</h1>
              {module.description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{module.description}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">Progress</span>
              <span className="text-xs font-mono font-semibold text-gray-700">{module.progress_pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${module.progress_pct}%` }}
              />
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {module.owner && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Owner: <span className="font-medium text-gray-700">{module.owner}</span></span>
              </div>
            )}
            {module.estimated_hours && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Est: <span className="font-medium text-gray-700">{module.estimated_hours}h</span></span>
              </div>
            )}
            {module.planned_start && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Start: <span className="font-medium text-gray-700">{module.planned_start}</span></span>
              </div>
            )}
            {module.planned_end && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>End: <span className="font-medium text-gray-700">{module.planned_end}</span></span>
              </div>
            )}
          </div>

          {/* Blocker reason */}
          {module.status === 'blocked' && module.blocker_reason && (
            <div className="mt-4 flex items-start gap-2.5 bg-red-50 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-red-600 mb-0.5">Blocker</div>
                <div className="text-xs text-red-500">{module.blocker_reason}</div>
              </div>
            </div>
          )}
        </div>

        {/* Assumptions */}
        {module.assumptions && module.assumptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              <div className="text-sm font-semibold text-gray-800">Assumptions</div>
            </div>
            <div className="space-y-2.5">
              {module.assumptions.map((asm) => (
                <div key={asm.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'shrink-0 w-1.5 h-1.5 rounded-full mt-2',
                      asm.status === 'confirmed' ? 'bg-gray-400' :
                      asm.status === 'invalidated' ? 'bg-red-400' : 'bg-amber-400',
                    )}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">{asm.text}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 capitalize">{asm.status}</span>
                      <span className={cn('text-[10px] font-medium capitalize', RISK_COLOR[asm.risk_level])}>
                        {asm.risk_level} risk
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {module.dependencies && module.dependencies.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-gray-400" />
              <div className="text-sm font-semibold text-gray-800">Dependencies</div>
            </div>
            <div className="space-y-3">
              {module.dependencies.map((dep) => (
                <div
                  key={dep.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border',
                    dep.status === 'overdue'
                      ? 'border-red-100 bg-red-50'
                      : dep.status === 'received'
                      ? 'border-black/6 bg-gray-50'
                      : 'border-black/6 bg-white',
                  )}
                >
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 font-medium">{dep.description}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {dep.owner}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dep.expected_date}
                      </span>
                      {dep.status === 'overdue' && (
                        <span className="text-red-500 font-medium">{dep.days_overdue}d overdue</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium capitalize px-1.5 py-0.5 rounded',
                      dep.status === 'overdue' ? 'text-red-600 bg-red-100' :
                      dep.status === 'received' ? 'text-gray-500 bg-gray-100' :
                      'text-amber-600 bg-amber-50',
                    )}
                  >
                    {dep.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
