import { mockApi } from './mockData';
import type { Blocker, Nudge } from '@/types';

export const getBlockers = (projectId: string): Promise<Blocker[]> => mockApi.getBlockers(projectId);

export const generateNudge = (dependencyId: string): Promise<Nudge> => mockApi.generateNudge(dependencyId);

export const sendNudge = (nudgeId: string): Promise<any> => mockApi.sendNudge(nudgeId);

export const getNudges = (projectId: string): Promise<Nudge[]> => mockApi.getNudges(projectId);
