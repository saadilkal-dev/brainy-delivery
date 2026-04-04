import { Check, Clock, AlertCircle } from 'lucide-react';
import type { ProposedModule } from '@/api/cocreate';

interface PlanSummaryPanelProps {
  modules: ProposedModule[];
  answers: string[];
  phase: string;
}

export function PlanSummaryPanel({ modules, answers, phase }: PlanSummaryPanelProps) {
  const approved = modules.filter((m) => m.decision === 'approved');
  const rejected = modules.filter((m) => m.decision === 'rejected');
  const totalDays = approved.reduce((sum, m) => sum + (m.editedDays ?? m.estimated_days), 0);

  const questionLabels = [
    'Project type',
    'Critical outcomes',
    'Technical constraints',
    'Team & risks',
  ];

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono mb-3">
          Plan Summary
        </div>

        {/* Discovery answers */}
        {answers.length > 0 && (
          <div className="bg-white rounded-xl border border-black/6 p-3 mb-3 space-y-2 shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Discovery</div>
            {answers.map((answer, i) => (
              <div key={i} className="text-xs">
                <div className="text-gray-400">{questionLabels[i] ?? `Q${i + 1}`}</div>
                <div className="text-gray-700 mt-0.5 leading-snug line-clamp-2">{answer}</div>
              </div>
            ))}
          </div>
        )}

        {/* Module summary */}
        {modules.length > 0 && (
          <div className="bg-white rounded-xl border border-black/6 p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-2">Modules</div>

            {modules.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {modules.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={
                        m.decision === 'approved'
                          ? 'text-violet-600'
                          : m.decision === 'rejected'
                          ? 'text-gray-300 line-through'
                          : 'text-gray-400'
                      }
                    >
                      {m.decision === 'approved' ? '✓' : m.decision === 'rejected' ? '✗' : '·'}
                    </span>
                    <span
                      className={
                        m.decision === 'rejected'
                          ? 'text-gray-300 line-through'
                          : 'text-gray-700'
                      }
                    >
                      {m.editedName ?? m.name}
                    </span>
                    <span className="ml-auto text-gray-400 tabular-nums">
                      {m.editedDays ?? m.estimated_days}d
                    </span>
                  </div>
                ))}
              </div>
            )}

            {approved.length > 0 && (
              <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  Total estimate
                </span>
                <span className="font-mono font-semibold text-gray-800">{totalDays}d</span>
              </div>
            )}
          </div>
        )}

        {/* Status indicators */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Check className="w-3 h-3 text-violet-500" />
            {approved.length} modules approved
          </div>
          {rejected.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <AlertCircle className="w-3 h-3" />
              {rejected.length} modules deferred
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
