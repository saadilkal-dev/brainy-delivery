import { mockApi } from './mockData';
import type { Module, Assumption, Dependency } from '@/types';

export const getModules = (projectId: string): Promise<Module[]> => mockApi.getModules(projectId);

export const createModule = (projectId: string, data: Partial<Module>): Promise<Module> =>
  mockApi.createModule(projectId, data);

export const updateModule = (id: string, data: Partial<Module>): Promise<Module> =>
  mockApi.updateModule(id, data);

export const addAssumption = (moduleId: string, data: { text: string; risk_level: string }): Promise<Assumption> =>
  mockApi.addAssumption(moduleId, data);

export const updateAssumption = (id: string, data: Partial<Assumption>): Promise<any> =>
  mockApi.updateAssumption(id, data);

export const addDependency = (moduleId: string, data: { description: string; owner: string; type: string; expected_date: string }): Promise<Dependency> =>
  mockApi.addDependency(moduleId, data);

export const updateDependency = (id: string, data: Partial<Dependency>): Promise<any> =>
  mockApi.updateDependency(id, data);
