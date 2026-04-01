import { mockApi } from './mockData';
import type { Meeting, Extraction } from '@/types';

export const getMeetings = (projectId: string): Promise<Meeting[]> =>
  mockApi.getMeetings(projectId);

export const getExtractions = (projectId: string, limit?: number): Promise<Extraction[]> =>
  mockApi.getExtractions(projectId, limit);

export const processTranscript = (projectId: string, transcript: string, sourceName: string) =>
  mockApi.processTranscript(projectId, transcript, sourceName);
