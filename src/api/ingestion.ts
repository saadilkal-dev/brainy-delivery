import { mockApi } from './mockData';
import type { Extraction } from '@/types';

export const processTranscript = (projectId: string, transcript: string, sourceName: string) =>
  mockApi.processTranscript(projectId, transcript, sourceName);

export const getExtractions = (projectId: string, limit?: number): Promise<Extraction[]> =>
  mockApi.getExtractions(projectId, limit);
