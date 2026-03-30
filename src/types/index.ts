export interface Project {
  id: string;
  name: string;
  client_name: string;
  target_date: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  owner?: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete';
  progress_pct: number;
  estimated_hours?: number;
  planned_start?: string;
  planned_end?: string;
  order: number;
  blocker_reason?: string;
  assumptions?: Assumption[];
  dependencies?: Dependency[];
  created_at: string;
  updated_at: string;
}

export interface Assumption {
  id: string;
  module_id: string;
  text: string;
  status: 'pending' | 'confirmed' | 'invalidated';
  risk_level: 'low' | 'medium' | 'high';
  invalidation_reason?: string;
  created_at: string;
}

export interface Dependency {
  id: string;
  module_id: string;
  description: string;
  owner: string;
  type: 'client' | 'internal' | 'third_party';
  expected_date: string;
  status: 'waiting' | 'received' | 'overdue';
  days_overdue?: number;
  created_at: string;
}

export interface Extraction {
  id: string;
  project_id: string;
  source_type: 'meet' | 'chat' | 'calendar';
  source_name: string;
  extraction_type: 'blocker' | 'decision' | 'priority_change' | 'progress_update' | 'client_dependency' | 'assumption_risk';
  summary: string;
  source_quote?: string;
  affected_module_id?: string;
  affected_module_name?: string;
  action_taken?: string;
  created_at: string;
}

export interface DashboardData {
  project: Project;
  overall_progress: {
    completed: number;
    total: number;
    status: 'on_track' | 'at_risk' | 'behind';
  };
  active_blockers: number;
  predicted_delivery: {
    date: string;
    original_target: string;
    drift_days: number;
  };
  brain_activity: {
    count: number;
    sources: Record<string, number>;
  };
}

export interface Blocker {
  module_id: string;
  module_name: string;
  blocker_reason: string;
  blocked_since?: string;
  downstream_modules?: string[];
  overdue_dependencies: Dependency[];
}

export interface Nudge {
  id: string;
  dependency_id: string;
  dependency_description: string;
  recipient: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent';
  sent_at?: string;
  created_at: string;
}
