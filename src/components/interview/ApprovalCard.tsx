import { useState } from 'react';
import { Check, X, Edit3, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposedModule } from '@/api/cocreate';

interface ApprovalCardProps {
  module: ProposedModule;
  onDecide: (id: string, decision: ProposedModule['decision']) => void;
  onEdit: (id: string, fields: { name?: string; days?: number }) => void;
}

export function ApprovalCard({ module, onDecide, onEdit }: ApprovalCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(module.editedName ?? module.name);
  const [daysVal, setDaysVal] = useState(module.editedDays ?? module.estimated_days);

  const displayName = module.editedName ?? module.name;
  const displayDays = module.editedDays ?? module.estimated_days;

  const isApproved = module.decision === 'approved';
  const isRejected = module.decision === 'rejected';
  const isPending = module.decision === 'pending';

  function saveEdit() {
    onEdit(module.id, { name: nameVal, days: daysVal });
    onDecide(module.id, 'approved');
    setEditing(false);
  }

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        isApproved && 'border-violet-200 bg-violet-50/50',
        isRejected && 'border-black/8 bg-black/3 opacity-50',
        isPending && 'border-black/8 bg-white',
      )}
    >
      {!editing ? (
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isApproved && <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                {isRejected && <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isApproved ? 'text-violet-800' : isRejected ? 'text-gray-400' : 'text-gray-900',
                  )}
                >
                  {displayName}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{module.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {displayDays}d
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {module.owner}
            </span>
          </div>

          {isPending && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDecide(module.id, 'approved')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors"
              >
                <Check className="w-3 h-3" /> Approve
              </button>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 bg-white text-gray-600 text-xs font-medium hover:border-violet-300 hover:text-violet-700 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Modify
              </button>
              <button
                onClick={() => onDecide(module.id, 'rejected')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/8 text-gray-400 text-xs font-medium hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" /> Reject
              </button>
            </div>
          )}

          {!isPending && (
            <button
              onClick={() => onDecide(module.id, 'pending')}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Undo
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Module Name</label>
            <input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-gray-900 bg-white focus:outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Days Estimate</label>
            <input
              type="number"
              value={daysVal}
              onChange={(e) => setDaysVal(Number(e.target.value))}
              className="mt-1 w-24 px-3 py-2 rounded-lg border border-black/10 text-sm text-gray-900 bg-white focus:outline-none focus:border-violet-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors"
            >
              Save & Approve
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-black/10 text-gray-500 text-xs hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
