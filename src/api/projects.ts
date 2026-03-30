import { api } from './client';
import type { Project } from '@/types';

export const getProjects = () => api.get<Project[]>('/api/projects').then(r => r.data);

export const getProject = (id: string) => api.get<Project>(`/api/projects/${id}`).then(r => r.data);

export const createProject = (data: { name: string; client_name: string; target_date: string }) =>
  api.post<Project>('/api/projects', data).then(r => r.data);
