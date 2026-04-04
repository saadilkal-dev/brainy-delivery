export interface MeetingNote {
  id: string;
  date: string;
  title: string;
  attendees: string[];
  summary: string;
  keyPoints: string[];
}

export const mockMeetingNotes: MeetingNote[] = [
  {
    id: 'meet-1',
    date: '2026-03-28',
    title: 'Initial Kickoff Call — Daikin Service Portal',
    attendees: ['Sarah K. (Consultant)', 'James T. (Daikin PM)', 'Ravi M. (Daikin IT)'],
    summary: 'First alignment meeting to understand project scope and technical requirements.',
    keyPoints: [
      'Dealer-facing portal with product catalog, warranty lookup, and service scheduling',
      'Target go-live: May 15, 2026',
      'PostgreSQL preferred but schema not finalized',
      'Estimated 8–10 modules across 3 phases',
    ],
  },
  {
    id: 'meet-2',
    date: '2026-04-01',
    title: 'Technical Architecture Review',
    attendees: ['Sarah K. (Consultant)', 'Ravi M. (Daikin IT)', 'Alex P. (Lead Dev)'],
    summary: 'Deep dive into technical requirements and integration points.',
    keyPoints: [
      'Integration with existing ERP via REST API',
      'SSO via Azure AD required for all users',
      'Mobile-responsive; native app explicitly out of scope',
      'Performance target: sub-2s load at 1000 concurrent users',
    ],
  },
  {
    id: 'meet-3',
    date: '2026-04-03',
    title: 'Scope Refinement — Phase 2 Features',
    attendees: ['Sarah K. (Consultant)', 'James T. (Daikin PM)', 'Priya R. (UX)'],
    summary: 'Clarified Phase 2 scope and reprioritized MVP features.',
    keyPoints: [
      'Warranty lookup moved to MVP (was Phase 2)',
      'Reporting module deferred to Phase 2',
      'Team: 4 developers + 1 UX designer',
      'Client prefers bi-weekly check-ins over weekly',
    ],
  },
];
