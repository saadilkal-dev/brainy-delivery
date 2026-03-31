import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Module } from '@/types';

interface ActionItemsProps {
  modules: Module[];
}

interface ActionItem {
  id: string;
  type: 'blocker' | 'assumption' | 'dependency';
  label: string;
  description: string;
  moduleName: string;
  status: string;
  urgency: number; // lower = more urgent
}

function getUrgency(type: string, status: string): number {
  if (type === 'blocker') return 0;
  if (status === 'overdue') return 1;
  if (status === 'pending' || status === 'waiting') return 2;
  return 3;
}

function getVariant(type: string, status: string): 'red' | 'amber' | 'green' | 'blue' {
  if (type === 'blocker') return 'red';
  if (status === 'overdue') return 'red';
  if (status === 'pending' || status === 'waiting') return 'amber';
  if (status === 'confirmed' || status === 'received') return 'green';
  return 'blue';
}

function getIcon(type: string): string {
  if (type === 'blocker') return '⛔';
  if (type === 'assumption') return '⚠️';
  return '📦';
}

export function ActionItems({ modules }: ActionItemsProps) {
  const items: ActionItem[] = [];

  modules.forEach((mod) => {
    if (mod.status === 'blocked' && mod.blocker_reason) {
      items.push({
        id: `blocker-${mod.id}`,
        type: 'blocker',
        label: 'Blocker',
        description: mod.blocker_reason,
        moduleName: mod.name,
        status: 'blocked',
        urgency: getUrgency('blocker', 'blocked'),
      });
    }

    mod.assumptions?.filter(a => a.status === 'pending').forEach((a) => {
      items.push({
        id: a.id,
        type: 'assumption',
        label: 'Assumption',
        description: a.text,
        moduleName: mod.name,
        status: a.status,
        urgency: getUrgency('assumption', a.status),
      });
    });

    mod.dependencies?.filter(d => d.status !== 'received').forEach((d) => {
      items.push({
        id: d.id,
        type: 'dependency',
        label: 'Dependency',
        description: d.description,
        moduleName: mod.name,
        status: d.status,
        urgency: getUrgency('dependency', d.status),
      });
    });
  });

  items.sort((a, b) => a.urgency - b.urgency);

  if (items.length === 0) {
    return (
      <EmptyState
        title="All clear!"
        description="No pending action items for your modules."
      />
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-sm border border-border bg-card p-4 flex items-start gap-3"
        >
          <span className="text-sm mt-0.5">{getIcon(item.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge variant={getVariant(item.type, item.status)}>
                {item.label}
              </StatusBadge>
              <span className="text-[10px] text-muted-foreground/50">→ {item.moduleName}</span>
            </div>
            <p className="text-sm text-foreground/90">{item.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
