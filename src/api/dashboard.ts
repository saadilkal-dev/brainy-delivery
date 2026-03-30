import { mockApi } from './mockData';
import type { DashboardData } from '@/types';

export const getDashboard = (projectId: string): Promise<DashboardData> => mockApi.getDashboard(projectId);
