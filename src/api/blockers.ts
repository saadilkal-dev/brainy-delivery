import { api } from './client';
import type { Blocker, Nudge } from '@/types';

export const getBlockers = (projectId: string) =>
  api.get<Blocker[]>(`/api/projects/${projectId}/blockers`).then(r => r.data);

export const generateNudge = (dependencyId: string) =>
  api.post<Nudge>('/api/nudges/generate', { dependency_id: dependencyId }).then(r => r.data);

export const sendNudge = (nudgeId: string) =>
  api.post<Nudge>(`/api/nudges/${nudgeId}/send`).then(r => r.data);

export const getNudges = (projectId: string) =>
  api.get<Nudge[]>(`/api/projects/${projectId}/nudges`).then(r => r.data);
