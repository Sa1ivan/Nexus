import { Injectable } from '@angular/core';

import { validateSiteConfig } from '../domain/utils/site-config-validation';
import type {
  DraftRevision,
  LeadSubmission,
  LeadSubmissionRequest,
  Project,
  PublishedRelease,
  SiteConfig,
} from '../domain/models';

interface ProjectStorageState {
  readonly projects: readonly Project[];
  readonly leads: readonly LeadSubmission[];
  readonly activeProjectId: string | null;
}

const STORAGE_KEY = 'nexus.builder.projects.v1';

@Injectable({
  providedIn: 'root',
})
export class ProjectPersistenceService {
  listProjects(): readonly Project[] {
    return this.readState().projects;
  }

  getProject(projectId: string): Project | null {
    return this.readState().projects.find((project) => project.id === projectId) ?? null;
  }

  getActiveProject(): Project | null {
    const state = this.readState();

    if (state.activeProjectId === null) {
      return state.projects[0] ?? null;
    }

    return state.projects.find((project) => project.id === state.activeProjectId) ?? null;
  }

  setActiveProject(projectId: string): void {
    const state = this.readState();

    this.writeState({
      ...state,
      activeProjectId: projectId,
    });
  }

  saveDraft(project: Project, siteConfig: SiteConfig): Project {
    const validation = validateSiteConfig(siteConfig);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    const now = new Date().toISOString();
    const version = project.draftVersion + 1;
    const revision: DraftRevision = {
      id: this.createId('revision'),
      version,
      siteConfig: this.clone(siteConfig),
      createdAt: now,
    };
    const nextProject: Project = {
      ...project,
      name: siteConfig.name,
      draft: this.clone(siteConfig),
      draftVersion: version,
      revisions: [...project.revisions, revision],
      updatedAt: now,
    };

    return this.upsertProject(nextProject);
  }

  createProject(siteConfig: SiteConfig): Project {
    const validation = validateSiteConfig(siteConfig);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: this.createId('project'),
      name: siteConfig.name,
      draft: this.clone(siteConfig),
      draftVersion: 1,
      publishedReleaseId: null,
      releases: [],
      revisions: [
        {
          id: this.createId('revision'),
          version: 1,
          siteConfig: this.clone(siteConfig),
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    return this.upsertProject(project);
  }

  publishProject(project: Project, siteConfig: SiteConfig): Project {
    const validation = validateSiteConfig(siteConfig);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    const now = new Date().toISOString();
    const nextVersion = project.releases.length + 1;
    const release: PublishedRelease = {
      id: this.createId('release'),
      version: nextVersion,
      siteConfig: this.clone(siteConfig),
      publishedAt: now,
    };
    const nextProject: Project = {
      ...project,
      name: siteConfig.name,
      draft: this.clone(siteConfig),
      draftVersion: project.draftVersion + 1,
      publishedReleaseId: release.id,
      releases: [...project.releases, release],
      revisions: [
        ...project.revisions,
        {
          id: this.createId('revision'),
          version: project.draftVersion + 1,
          siteConfig: this.clone(siteConfig),
          createdAt: now,
        },
      ],
      updatedAt: now,
    };

    return this.upsertProject(nextProject);
  }

  getPublishedRelease(projectId: string): PublishedRelease | null {
    const project = this.getProject(projectId);

    if (project?.publishedReleaseId === undefined || project.publishedReleaseId === null) {
      return null;
    }

    return project.releases.find((release) => release.id === project.publishedReleaseId) ?? null;
  }

  submitLead(request: LeadSubmissionRequest): LeadSubmission {
    const state = this.readState();
    const lead: LeadSubmission = {
      id: this.createId('lead'),
      projectId: request.projectId,
      blockId: request.blockId,
      fields: { ...request.fields },
      status: 'stored',
      createdAt: new Date().toISOString(),
    };

    this.writeState({
      ...state,
      leads: [...state.leads, lead],
    });

    return lead;
  }

  listLeads(projectId: string): readonly LeadSubmission[] {
    return this.readState().leads.filter((lead) => lead.projectId === projectId);
  }

  private upsertProject(project: Project): Project {
    const state = this.readState();
    const projects = state.projects.some((storedProject) => storedProject.id === project.id)
      ? state.projects.map((storedProject) =>
          storedProject.id === project.id ? project : storedProject,
        )
      : [...state.projects, project];

    this.writeState({
      projects,
      leads: state.leads,
      activeProjectId: project.id,
    });

    return project;
  }

  private readState(): ProjectStorageState {
    if (!this.hasLocalStorage()) {
      return this.createEmptyState();
    }

    const rawState = globalThis.localStorage.getItem(STORAGE_KEY);

    if (rawState === null) {
      return this.createEmptyState();
    }

    try {
      const parsedState = JSON.parse(rawState) as Partial<ProjectStorageState>;

      return {
        projects: parsedState.projects ?? [],
        leads: parsedState.leads ?? [],
        activeProjectId: parsedState.activeProjectId ?? null,
      };
    } catch {
      return this.createEmptyState();
    }
  }

  private writeState(state: ProjectStorageState): void {
    if (!this.hasLocalStorage()) {
      return;
    }

    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private createEmptyState(): ProjectStorageState {
    return {
      projects: [],
      leads: [],
      activeProjectId: null,
    };
  }

  private clone<TValue>(value: TValue): TValue {
    return JSON.parse(JSON.stringify(value)) as TValue;
  }

  private hasLocalStorage(): boolean {
    return typeof globalThis.localStorage !== 'undefined';
  }

  private createId(prefix: string): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now().toString(36)}`;
  }
}
