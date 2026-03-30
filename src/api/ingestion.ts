import { mockApi } from './mockData';
import type { Meeting } from '@/types';

export const getMeetings = (projectId: string): Promise<Meeting[]> =>
  mockApi.getMeetings(projectId);

export const getExtractions = (projectId: string, limit?: number) =>
  mockApi.getExtractions(projectId, limit);
