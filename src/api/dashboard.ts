import { api } from './client';
import type { DashboardData } from '@/types';

export const getDashboard = (projectId: string) =>
  api.get<DashboardData>(`/api/projects/${projectId}/dashboard`).then(r => r.data);
