import type { Project, Module, Extraction, DashboardData, Blocker, Nudge, Meeting } from '@/types';

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Daikin Service Portal',
    client_name: 'Daikin',
    target_date: '2026-05-15',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-28T10:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Internal CRM Revamp',
    client_name: 'Softway',
    target_date: '2026-06-30',
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-25T10:00:00Z',
  },
];

export const mockModules: Module[] = [
  {
    id: 'mod-1',
    project_id: 'proj-1',
    name: 'Product Catalog',
    description: 'Product listing, search, and filtering for Daikin HVAC units',
    owner: 'Ravi',
    status: 'blocked',
    progress_pct: 35,
    estimated_hours: 120,
    planned_start: '2026-03-01',
    planned_end: '2026-03-14',
    order: 1,
    blocker_reason: 'Waiting on database schema from client',
    assumptions: [
      { id: 'asm-1', module_id: 'mod-1', text: 'Client will provide PostgreSQL schema', status: 'pending', risk_level: 'high', created_at: '2026-03-05T10:00:00Z' },
      { id: 'asm-2', module_id: 'mod-1', text: 'Product images hosted on client CDN', status: 'confirmed', risk_level: 'low', created_at: '2026-03-03T10:00:00Z' },
    ],
    dependencies: [
      { id: 'dep-1', module_id: 'mod-1', description: 'Database schema document from Daikin IT', owner: 'Daikin IT Team', type: 'client', expected_date: '2026-03-10', status: 'overdue', days_overdue: 20, created_at: '2026-03-01T10:00:00Z' },
    ],
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-28T10:00:00Z',
  },
  {
    id: 'mod-2',
    project_id: 'proj-1',
    name: 'User Onboarding Flow',
    description: 'Registration, login, and guided setup for new service technicians',
    owner: 'Dev B',
    status: 'in_progress',
    progress_pct: 65,
    estimated_hours: 80,
    planned_start: '2026-03-08',
    planned_end: '2026-03-21',
    order: 2,
    assumptions: [
      { id: 'asm-3', module_id: 'mod-2', text: 'SSO integration not required for MVP', status: 'confirmed', risk_level: 'medium', created_at: '2026-03-08T10:00:00Z' },
    ],
    dependencies: [
      { id: 'dep-2', module_id: 'mod-2', description: 'Brand guidelines from marketing', owner: 'Softway Marketing', type: 'internal', expected_date: '2026-03-15', status: 'received', created_at: '2026-03-08T10:00:00Z' },
    ],
    created_at: '2026-03-08T10:00:00Z',
    updated_at: '2026-03-28T10:00:00Z',
  },
  {
    id: 'mod-3',
    project_id: 'proj-1',
    name: 'Service Request Module',
    description: 'Technician service request submission and tracking',
    owner: 'Dev A',
    status: 'not_started',
    progress_pct: 0,
    estimated_hours: 100,
    planned_start: '2026-03-22',
    planned_end: '2026-04-04',
    order: 3,
    assumptions: [],
    dependencies: [
      { id: 'dep-3', module_id: 'mod-3', description: 'Service API documentation from Daikin', owner: 'Daikin Dev Team', type: 'client', expected_date: '2026-03-20', status: 'waiting', created_at: '2026-03-10T10:00:00Z' },
    ],
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'mod-4',
    project_id: 'proj-1',
    name: 'Reporting Dashboard',
    description: 'Analytics and KPI dashboard for service managers',
    owner: 'Dev C',
    status: 'not_started',
    progress_pct: 0,
    estimated_hours: 60,
    planned_start: '2026-04-05',
    planned_end: '2026-04-18',
    order: 4,
    assumptions: [
      { id: 'asm-4', module_id: 'mod-4', text: 'Deprioritized — client wants onboarding first', status: 'invalidated', risk_level: 'medium', invalidation_reason: 'Client changed priorities in March 12 standup', created_at: '2026-03-12T10:00:00Z' },
    ],
    dependencies: [],
    created_at: '2026-03-12T10:00:00Z',
    updated_at: '2026-03-28T10:00:00Z',
  },
  {
    id: 'mod-5',
    project_id: 'proj-1',
    name: 'Notifications System',
    description: 'Email and push notifications for service updates',
    owner: 'Dev B',
    status: 'complete',
    progress_pct: 100,
    estimated_hours: 40,
    planned_start: '2026-03-01',
    planned_end: '2026-03-07',
    order: 5,
    assumptions: [],
    dependencies: [],
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-07T10:00:00Z',
  },
];

export const mockExtractions: Extraction[] = [
  {
    id: 'ext-1',
    project_id: 'proj-1',
    source_type: 'meet',
    source_name: 'Standup — March 12',
    extraction_type: 'blocker',
    summary: 'Dev A is blocked on the Product Catalog module — still waiting on the database schema from the client.',
    source_quote: "Dev A: I'm blocked. Still waiting on the database schema from the client.",
    affected_module_id: 'mod-1',
    affected_module_name: 'Product Catalog',
    action_taken: 'Module status set to blocked',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ext-2',
    project_id: 'proj-1',
    source_type: 'meet',
    source_name: 'Standup — March 12',
    extraction_type: 'decision',
    summary: 'Design team confirmed card-based layout for product catalog instead of table view.',
    source_quote: 'Dev B: Also, the design team confirmed we\'re going with the card-based layout, not the table view.',
    affected_module_id: 'mod-1',
    affected_module_name: 'Product Catalog',
    action_taken: 'Decision logged',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ext-3',
    project_id: 'proj-1',
    source_type: 'meet',
    source_name: 'Standup — March 12',
    extraction_type: 'priority_change',
    summary: 'Reporting dashboard deprioritized — client wants onboarding flow completed first.',
    source_quote: "PM: Let's also deprioritize the reporting dashboard — client said they want onboarding flow first.",
    affected_module_id: 'mod-4',
    affected_module_name: 'Reporting Dashboard',
    action_taken: 'Priority updated',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ext-4',
    project_id: 'proj-1',
    source_type: 'meet',
    source_name: 'Standup — March 12',
    extraction_type: 'assumption_risk',
    summary: 'Dev A will assume PostgreSQL and start building if schema doesn\'t arrive by Friday — risky assumption.',
    source_quote: "Dev A: But if the schema doesn't come by Friday, I'll have to assume PostgreSQL and start building.",
    affected_module_id: 'mod-1',
    affected_module_name: 'Product Catalog',
    action_taken: 'Assumption flagged as high risk',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ext-5',
    project_id: 'proj-1',
    source_type: 'chat',
    source_name: 'Slack #daikin-project',
    extraction_type: 'progress_update',
    summary: 'Onboarding flow design approved by client. Moving to implementation phase.',
    affected_module_id: 'mod-2',
    affected_module_name: 'User Onboarding Flow',
    action_taken: 'Progress updated to 65%',
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ext-6',
    project_id: 'proj-1',
    source_type: 'calendar',
    source_name: 'Client Review — March 10',
    extraction_type: 'client_dependency',
    summary: 'Client committed to delivering database schema by Wednesday March 12. Follow-up needed.',
    affected_module_id: 'mod-1',
    affected_module_name: 'Product Catalog',
    action_taken: 'Dependency expected date set',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockDashboard: DashboardData = {
  project: mockProjects[0],
  overall_progress: {
    completed: 1,
    total: 5,
    status: 'at_risk',
  },
  active_blockers: 1,
  predicted_delivery: {
    date: '2026-05-22',
    original_target: '2026-05-15',
    drift_days: 7,
  },
  brain_activity: {
    count: 6,
    sources: { meet: 4, chat: 1, calendar: 1 },
  },
};

export const mockBlockers: Blocker[] = [
  {
    module_id: 'mod-1',
    module_name: 'Product Catalog',
    blocker_reason: 'Waiting on database schema from client — Daikin IT team has not delivered.',
    blocked_since: '2026-03-10',
    downstream_modules: ['Service Request Module'],
    overdue_dependencies: [
      {
        id: 'dep-1',
        module_id: 'mod-1',
        description: 'Database schema document from Daikin IT',
        owner: 'Daikin IT Team',
        type: 'client',
        expected_date: '2026-03-10',
        status: 'overdue',
        days_overdue: 20,
        created_at: '2026-03-01T10:00:00Z',
      },
    ],
  },
];

export const mockNudges: Nudge[] = [
  {
    id: 'nudge-1',
    dependency_id: 'dep-1',
    dependency_description: 'Database schema document from Daikin IT',
    recipient: 'Daikin IT Team',
    subject: 'Follow-up: Database Schema for Service Portal',
    body: `Hi Daikin IT Team,

I hope this message finds you well. I'm reaching out regarding the database schema document for the Service Portal project.

This deliverable was originally expected by March 10, and is now 20 days overdue. Our Product Catalog module is currently blocked, which is also impacting the downstream Service Request Module.

Could you please provide an updated timeline for when we can expect the schema? If there are any blockers on your end, we'd be happy to discuss alternative approaches.

Best regards,
Project Manager`,
    status: 'sent',
    sent_at: '2026-03-20T14:00:00Z',
    created_at: '2026-03-20T13:00:00Z',
  },
];

export const mockMeetings: Meeting[] = [
  {
    id: 'mtg-1',
    project_id: 'proj-1',
    title: 'Daily Standup — Sprint 4',
    source: 'google_meet',
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 18,
    participants: [
      { name: 'Sarah K.', role: 'PM', avatar_color: '#3B82F6' },
      { name: 'Dev A', role: 'Frontend', avatar_color: '#10B981' },
      { name: 'Dev B', role: 'Backend', avatar_color: '#F59E0B' },
    ],
    summary: 'Quick sync on Product Catalog blockers. DB schema still pending from client. Design team locked in card-based layout. Reporting dashboard deprioritized in favor of onboarding.',
    key_points: [
      'Product Catalog module blocked — DB schema overdue by 20 days',
      'Card-based layout confirmed over table view',
      'Onboarding flow prioritized above Reporting Dashboard',
      'Dev A will assume PostgreSQL if schema not received by Friday',
    ],
    decisions: [
      'Go with card-based layout for product catalog',
      'Deprioritize reporting dashboard',
      'Follow up with Daikin IT on schema by EOD',
    ],
    action_items: [
      { text: 'Follow up with Daikin IT on DB schema', assignee: 'Sarah K.', due: '2026-03-30' },
      { text: 'Update component structure for card layout', assignee: 'Dev B', due: '2026-04-01' },
      { text: 'Begin PostgreSQL assumption build if no schema by Friday', assignee: 'Dev A', due: '2026-04-04' },
    ],
    blockers_identified: ['Database schema from Daikin IT — 20 days overdue'],
    mood: 'concerning',
    extractions: [],
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mtg-2',
    project_id: 'proj-1',
    title: 'Client Review — Sprint 3 Demo',
    source: 'google_meet',
    date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 45,
    participants: [
      { name: 'Sarah K.', role: 'PM', avatar_color: '#3B82F6' },
      { name: 'Dev A', role: 'Frontend', avatar_color: '#10B981' },
      { name: 'Tanaka-san', role: 'Client', avatar_color: '#EF4444' },
      { name: 'Yuki M.', role: 'Client', avatar_color: '#8B5CF6' },
    ],
    summary: 'Sprint 3 demo went well. Client approved onboarding flow designs. Discussed timeline for schema delivery. Client committed to Wednesday but delivery is uncertain.',
    key_points: [
      'Onboarding flow designs approved by client',
      'Client acknowledged schema delay',
      'New requirement: multi-language support for onboarding (JP/EN)',
      'Client satisfied with notification system demo',
    ],
    decisions: [
      'Approved onboarding flow — move to implementation',
      'Add Japanese language support to onboarding scope',
      'Schema delivery committed for March 12',
    ],
    action_items: [
      { text: 'Start onboarding implementation', assignee: 'Dev A', due: '2026-03-28' },
      { text: 'Scope i18n effort for JP/EN', assignee: 'Dev B', due: '2026-03-29' },
      { text: 'Send schema reminder to Daikin IT', assignee: 'Sarah K.', due: '2026-03-27' },
    ],
    blockers_identified: [],
    mood: 'positive',
    extractions: [],
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mtg-3',
    project_id: 'proj-1',
    title: 'Architecture Discussion — Service Layer',
    source: 'google_chat',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 32,
    participants: [
      { name: 'Dev A', role: 'Frontend', avatar_color: '#10B981' },
      { name: 'Dev B', role: 'Backend', avatar_color: '#F59E0B' },
      { name: 'Dev C', role: 'DevOps', avatar_color: '#EC4899' },
    ],
    summary: 'Discussed service layer architecture for the portal. Decided on microservices approach with API gateway. Concerns raised about deployment complexity.',
    key_points: [
      'Microservices architecture selected for scalability',
      'API gateway pattern for unified client interface',
      'Docker + K8s for deployment pipeline',
      'Concern: deployment complexity may impact timeline',
    ],
    decisions: [
      'Use microservices with API gateway',
      'Kubernetes deployment with Helm charts',
      'Start with 3 core services: auth, catalog, notifications',
    ],
    action_items: [
      { text: 'Draft architecture diagram', assignee: 'Dev C', due: '2026-03-28' },
      { text: 'Set up K8s staging cluster', assignee: 'Dev C', due: '2026-04-01' },
      { text: 'Define API contracts for core services', assignee: 'Dev B', due: '2026-03-30' },
    ],
    blockers_identified: [],
    mood: 'neutral',
    extractions: [],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mtg-4',
    project_id: 'proj-2',
    title: 'CRM Kickoff — Requirements Gathering',
    source: 'google_meet',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    participants: [
      { name: 'Alex P.', role: 'PM', avatar_color: '#3B82F6' },
      { name: 'Jordan T.', role: 'Lead Dev', avatar_color: '#10B981' },
      { name: 'Maya R.', role: 'UX Designer', avatar_color: '#F59E0B' },
    ],
    summary: 'Initial kickoff for CRM revamp. Discussed current pain points, user personas, and high-level timeline. Agreed on 4 core modules.',
    key_points: [
      'Current CRM has poor search and filtering',
      'Need mobile-responsive design',
      '4 core modules: contacts, deals, reporting, integrations',
      'Target: MVP by end of June',
    ],
    decisions: [
      'React + TypeScript for frontend',
      'Modular architecture for phased delivery',
      'Start with contacts module',
    ],
    action_items: [
      { text: 'Create user personas document', assignee: 'Maya R.', due: '2026-03-28' },
      { text: 'Set up project repository', assignee: 'Jordan T.', due: '2026-03-27' },
      { text: 'Draft module breakdown', assignee: 'Alex P.', due: '2026-03-29' },
    ],
    blockers_identified: [],
    mood: 'positive',
    extractions: [],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];


// Local state store for mutations
let _projects = [...mockProjects];
let _modules = [...mockModules];
let _extractions = [...mockExtractions];
let _nudges = [...mockNudges];
let _meetings = [...mockMeetings];

function generateId() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const mockApi = {
  // Projects
  getProjects: async () => _projects,
  getProject: async (id: string) => _projects.find(p => p.id === id) ?? _projects[0],
  createProject: async (data: { name: string; client_name: string; target_date: string }) => {
    const project: Project = { ...data, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    _projects.push(project);
    return project;
  },

  // Modules
  getModules: async (projectId: string) => _modules.filter(m => m.project_id === projectId).sort((a, b) => a.order - b.order),
  createModule: async (projectId: string, data: Partial<Module>) => {
    const mod: Module = {
      id: generateId(), project_id: projectId, name: data.name || 'New Module', description: data.description,
      owner: data.owner, status: 'not_started', progress_pct: 0, estimated_hours: data.estimated_hours,
      planned_start: data.planned_start, planned_end: data.planned_end, order: data.order ?? _modules.length + 1,
      assumptions: [], dependencies: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    _modules.push(mod);
    return mod;
  },
  updateModule: async (id: string, data: Partial<Module>) => {
    const idx = _modules.findIndex(m => m.id === id);
    if (idx >= 0) _modules[idx] = { ..._modules[idx], ...data, updated_at: new Date().toISOString() };
    return _modules[idx];
  },
  addAssumption: async (moduleId: string, data: { text: string; risk_level: string }) => {
    const assumption = { id: generateId(), module_id: moduleId, text: data.text, status: 'pending' as const, risk_level: data.risk_level as any, created_at: new Date().toISOString() };
    const mod = _modules.find(m => m.id === moduleId);
    if (mod) (mod.assumptions ??= []).push(assumption);
    return assumption;
  },
  updateAssumption: async (id: string, data: any) => {
    for (const mod of _modules) {
      const asm = mod.assumptions?.find(a => a.id === id);
      if (asm) { Object.assign(asm, data); return asm; }
    }
    return data;
  },
  addDependency: async (moduleId: string, data: any) => {
    const dep = { id: generateId(), module_id: moduleId, ...data, status: 'waiting' as const, created_at: new Date().toISOString() };
    const mod = _modules.find(m => m.id === moduleId);
    if (mod) (mod.dependencies ??= []).push(dep);
    return dep;
  },
  updateDependency: async (id: string, data: any) => {
    for (const mod of _modules) {
      const dep = mod.dependencies?.find(d => d.id === id);
      if (dep) { Object.assign(dep, data); return dep; }
    }
    return data;
  },

  // Dashboard
  getDashboard: async (projectId: string) => {
    const mods = _modules.filter(m => m.project_id === projectId);
    const completed = mods.filter(m => m.status === 'complete').length;
    const blocked = mods.filter(m => m.status === 'blocked').length;
    return {
      ...mockDashboard,
      project: _projects.find(p => p.id === projectId) ?? _projects[0],
      overall_progress: { completed, total: mods.length, status: blocked > 0 ? 'at_risk' : completed === mods.length ? 'on_track' : 'at_risk' as any },
      active_blockers: blocked,
    };
  },

  // Extractions
  getExtractions: async (projectId: string, limit?: number) => {
    const exts = _extractions.filter(e => e.project_id === projectId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return limit ? exts.slice(0, limit) : exts;
  },
  processTranscript: async (projectId: string, transcript: string, sourceName: string) => {
    // Simulate AI extraction
    await new Promise(r => setTimeout(r, 1500));
    const newExtractions: Extraction[] = [
      { id: generateId(), project_id: projectId, source_type: 'meet', source_name: sourceName, extraction_type: 'progress_update', summary: `Transcript processed from "${sourceName}". Key updates extracted and logged.`, source_quote: transcript.slice(0, 150) + '...', affected_module_name: 'Product Catalog', affected_module_id: 'mod-1', action_taken: 'Updates logged', created_at: new Date().toISOString() },
      { id: generateId(), project_id: projectId, source_type: 'meet', source_name: sourceName, extraction_type: 'blocker', summary: 'Developer reported being blocked waiting on client deliverable.', source_quote: "I'm blocked. Still waiting on the database schema from the client.", affected_module_name: 'Product Catalog', affected_module_id: 'mod-1', action_taken: 'Blocker flagged', created_at: new Date().toISOString() },
      { id: generateId(), project_id: projectId, source_type: 'meet', source_name: sourceName, extraction_type: 'decision', summary: 'Team decided to go with card-based layout instead of table view.', source_quote: "the design team confirmed we're going with the card-based layout, not the table view.", affected_module_name: 'Product Catalog', affected_module_id: 'mod-1', action_taken: 'Decision recorded', created_at: new Date().toISOString() },
    ];
    _extractions.push(...newExtractions);
    return { extractions: newExtractions };
  },

  // Blockers
  getBlockers: async (projectId: string) => {
    return _modules
      .filter(m => m.project_id === projectId && m.status === 'blocked')
      .map(m => ({
        module_id: m.id,
        module_name: m.name,
        blocker_reason: m.blocker_reason || 'Unknown blocker',
        blocked_since: m.planned_start,
        downstream_modules: _modules.filter(dm => dm.order > m.order && dm.project_id === projectId).map(dm => dm.name).slice(0, 2),
        overdue_dependencies: (m.dependencies ?? []).filter(d => d.status === 'overdue'),
      }));
  },
  generateNudge: async (dependencyId: string) => {
    await new Promise(r => setTimeout(r, 1000));
    let dep: any = null;
    for (const mod of _modules) { dep = mod.dependencies?.find(d => d.id === dependencyId); if (dep) break; }
    const nudge: Nudge = {
      id: generateId(), dependency_id: dependencyId,
      dependency_description: dep?.description ?? 'Unknown dependency',
      recipient: dep?.owner ?? 'Unknown',
      subject: `Follow-up: ${dep?.description ?? 'Pending Deliverable'}`,
      body: `Hi ${dep?.owner ?? 'Team'},\n\nI'm following up on the pending deliverable: "${dep?.description ?? 'Unknown'}".\n\nThis was originally expected by ${dep?.expected_date ?? 'TBD'} and is now ${dep?.days_overdue ?? '?'} days overdue. This is currently blocking progress on our project.\n\nCould you please provide an update on the expected delivery timeline?\n\nBest regards,\nProject Manager`,
      status: 'draft', created_at: new Date().toISOString(),
    };
    _nudges.push(nudge);
    return nudge;
  },
  sendNudge: async (nudgeId: string) => {
    const nudge = _nudges.find(n => n.id === nudgeId);
    if (nudge) { nudge.status = 'sent'; nudge.sent_at = new Date().toISOString(); }
    return nudge;
  },
  getNudges: async (projectId: string) => _nudges,

  // Meetings
  getMeetings: async (projectId: string) => {
    return _meetings
      .filter(m => m.project_id === projectId)
      .map(m => ({ ...m, extractions: _extractions.filter(e => e.project_id === projectId && e.source_name === m.title) }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
};
