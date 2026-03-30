import { api } from './client';
import type { Extraction } from '@/types';

export const processTranscript = (projectId: string, transcript: string, sourceName: string) =>
  api.post<{ extractions: Extraction[] }>('/api/ingest/transcript', {
    project_id: projectId,
    transcript,
    source_name: sourceName,
  }).then(r => r.data);

export const getExtractions = (projectId: string, limit?: number) =>
  api.get<Extraction[]>(`/api/projects/${projectId}/extractions`, { params: limit ? { limit } : {} }).then(r => r.data);
