import { api } from './client';
import type { Module, Assumption, Dependency } from '@/types';

export const getModules = (projectId: string) =>
  api.get<Module[]>(`/api/projects/${projectId}/modules`).then(r => r.data);

export const createModule = (projectId: string, data: Partial<Module>) =>
  api.post<Module>(`/api/projects/${projectId}/modules`, data).then(r => r.data);

export const updateModule = (id: string, data: Partial<Module>) =>
  api.put<Module>(`/api/modules/${id}`, data).then(r => r.data);

export const addAssumption = (moduleId: string, data: { text: string; risk_level: string }) =>
  api.post<Assumption>(`/api/modules/${moduleId}/assumptions`, data).then(r => r.data);

export const updateAssumption = (id: string, data: Partial<Assumption>) =>
  api.put<Assumption>(`/api/assumptions/${id}`, data).then(r => r.data);

export const addDependency = (moduleId: string, data: { description: string; owner: string; type: string; expected_date: string }) =>
  api.post<Dependency>(`/api/modules/${moduleId}/dependencies`, data).then(r => r.data);

export const updateDependency = (id: string, data: Partial<Dependency>) =>
  api.put<Dependency>(`/api/dependencies/${id}`, data).then(r => r.data);
