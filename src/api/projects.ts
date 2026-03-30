import { mockApi } from './mockData';
import type { Project } from '@/types';

export const getProjects = (): Promise<Project[]> => mockApi.getProjects();

export const getProject = (id: string): Promise<Project> => mockApi.getProject(id);

export const createProject = (data: { name: string; client_name: string; target_date: string }): Promise<Project> =>
  mockApi.createProject(data);
