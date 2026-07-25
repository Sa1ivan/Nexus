import { InjectionToken } from '@angular/core';

import type {
  CreateProjectRequest,
  LeadSubmission,
  LeadSubmissionRequest,
  Project,
  PublishedRelease,
  PublishProjectRequest,
  SaveDraftRequest,
} from '../models';

export interface ProjectRepository {
  listProjects(): Promise<readonly Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  getActiveProject(): Promise<Project | null>;
  setActiveProject(projectId: string): Promise<void>;
  createProject(request: CreateProjectRequest): Promise<Project>;
  saveDraft(request: SaveDraftRequest): Promise<Project>;
  publishProject(request: PublishProjectRequest): Promise<Project>;
  getPublishedRelease(projectId: string): Promise<PublishedRelease | null>;
  submitLead(request: LeadSubmissionRequest): Promise<LeadSubmission>;
  listLeads(projectId: string): Promise<readonly LeadSubmission[]>;
}

export const PROJECT_REPOSITORY = new InjectionToken<ProjectRepository>('PROJECT_REPOSITORY');
