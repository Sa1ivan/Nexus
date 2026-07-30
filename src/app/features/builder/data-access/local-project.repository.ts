import { inject, Injectable, InjectionToken } from '@angular/core';

import {
  ProjectVersionConflictError,
  type CreateProjectRequest,
  type DraftRevision,
  type LeadSubmission,
  type LeadSubmissionRequest,
  type Project,
  type PublishedRelease,
  type PublishProjectRequest,
  type SaveDraftRequest,
  type SiteConfig,
} from '../domain/models';
import type { ProjectRepository } from '../domain/ports';
import { validateSiteConfig } from '../domain/utils/site-config-validation';
import type { ProjectStorageLock } from './local-project-repository.types';
import { ProjectStorageCodec } from './project-storage.codec';
import type { ProjectStorageState } from './project-storage.model';

const STORAGE_KEY = 'nexus.builder.projects.v1';
const MAX_REVISIONS_PER_PROJECT = 30;
const MAX_RELEASES_PER_PROJECT = 12;
const MAX_STORED_LEADS = 500;
const MAX_STORAGE_CHARACTERS = 4_500_000;
const STORAGE_LOCK_NAME = 'nexus.builder.projects.write';

export type { ProjectStorageLock } from './local-project-repository.types';

export const PROJECT_STORAGE = new InjectionToken<Storage | null>('PROJECT_STORAGE', {
  providedIn: 'root',
  factory: () => (typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage),
});

export const PROJECT_STORAGE_LOCK = new InjectionToken<ProjectStorageLock | null>(
  'PROJECT_STORAGE_LOCK',
  {
    providedIn: 'root',
    factory: () => {
      if (typeof globalThis.navigator === 'undefined' || globalThis.navigator.locks === undefined) {
        return null;
      }

      const lockManager = globalThis.navigator.locks;

      return {
        request<TValue>(
          name: string,
          callback: () => TValue | PromiseLike<TValue>,
        ): Promise<TValue> {
          return lockManager.request(name, callback);
        },
      };
    },
  },
);

@Injectable()
export class LocalProjectRepository implements ProjectRepository {
  private readonly projectStorageCodec = inject(ProjectStorageCodec);
  private readonly storage = inject(PROJECT_STORAGE);
  private readonly storageLock = inject(PROJECT_STORAGE_LOCK);
  private fallbackIdCounter = 0;

  async listProjects(): Promise<readonly Project[]> {
    return this.readState().projects;
  }

  async getProject(projectId: string): Promise<Project | null> {
    return this.readState().projects.find((project) => project.id === projectId) ?? null;
  }

  async getActiveProject(): Promise<Project | null> {
    const state = this.readState();

    if (state.activeProjectId === null) {
      return state.projects[0] ?? null;
    }

    return state.projects.find((project) => project.id === state.activeProjectId) ?? null;
  }

  async setActiveProject(projectId: string): Promise<void> {
    await this.withStorageLock(() => {
      const state = this.readState();

      this.writeState({
        ...state,
        activeProjectId: projectId,
      });
    });
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    return this.withStorageLock(() => {
      this.assertValidSiteConfig(request.siteConfig);

      const now = new Date().toISOString();
      const project: Project = {
        id: this.createId('project'),
        name: request.siteConfig.name,
        draft: this.clone(request.siteConfig),
        draftVersion: 1,
        publishedReleaseId: null,
        releases: [],
        revisions: [
          {
            id: this.createId('revision'),
            version: 1,
            siteConfig: this.clone(request.siteConfig),
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      return this.upsertProject(project);
    });
  }

  async saveDraft(request: SaveDraftRequest): Promise<Project> {
    return this.withStorageLock(() => {
      const project = this.requireStoredProject(request.projectId);
      this.assertExpectedVersion(project, request.expectedDraftVersion);
      this.assertValidSiteConfig(request.siteConfig);

      const now = new Date().toISOString();
      const version = project.draftVersion + 1;
      const revision: DraftRevision = {
        id: this.createId('revision'),
        version,
        siteConfig: this.clone(request.siteConfig),
        createdAt: now,
      };
      const nextProject: Project = {
        ...project,
        name: request.siteConfig.name,
        draft: this.clone(request.siteConfig),
        draftVersion: version,
        revisions: [...project.revisions, revision].slice(-MAX_REVISIONS_PER_PROJECT),
        updatedAt: now,
      };

      return this.upsertProject(nextProject);
    });
  }

  async publishProject(request: PublishProjectRequest): Promise<Project> {
    return this.withStorageLock(() => {
      const project = this.requireStoredProject(request.projectId);
      this.assertExpectedVersion(project, request.expectedDraftVersion);
      this.assertValidSiteConfig(request.siteConfig);

      const now = new Date().toISOString();
      const nextVersion = Math.max(0, ...project.releases.map((item) => item.version)) + 1;
      const release: PublishedRelease = {
        id: this.createId('release'),
        version: nextVersion,
        siteConfig: this.clone(request.siteConfig),
        publishedAt: now,
      };
      const nextProject: Project = {
        ...project,
        name: request.siteConfig.name,
        draft: this.clone(request.siteConfig),
        draftVersion: project.draftVersion + 1,
        publishedReleaseId: release.id,
        releases: [...project.releases, release].slice(-MAX_RELEASES_PER_PROJECT),
        revisions: [
          ...project.revisions,
          {
            id: this.createId('revision'),
            version: project.draftVersion + 1,
            siteConfig: this.clone(request.siteConfig),
            createdAt: now,
          },
        ].slice(-MAX_REVISIONS_PER_PROJECT),
        updatedAt: now,
      };

      return this.upsertProject(nextProject);
    });
  }

  async getPublishedRelease(projectId: string): Promise<PublishedRelease | null> {
    const project = this.readState().projects.find((item) => item.id === projectId);

    if (project?.publishedReleaseId === undefined || project.publishedReleaseId === null) {
      return null;
    }

    return project.releases.find((release) => release.id === project.publishedReleaseId) ?? null;
  }

  async submitLead(request: LeadSubmissionRequest): Promise<LeadSubmission> {
    return this.withStorageLock(() => {
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
        leads: [...state.leads, lead].slice(-MAX_STORED_LEADS),
      });

      return lead;
    });
  }

  async listLeads(projectId: string): Promise<readonly LeadSubmission[]> {
    return this.readState().leads.filter((lead) => lead.projectId === projectId);
  }

  private requireStoredProject(projectId: string): Project {
    const project = this.readState().projects.find((item) => item.id === projectId);

    if (project === undefined) {
      throw new Error(`Project ${projectId} was not found.`);
    }

    return project;
  }

  private withStorageLock<TValue>(callback: () => TValue | PromiseLike<TValue>): Promise<TValue> {
    return this.storageLock === null
      ? Promise.resolve(callback())
      : this.storageLock.request(STORAGE_LOCK_NAME, callback);
  }

  private assertExpectedVersion(project: Project, expectedVersion: number): void {
    if (project.draftVersion !== expectedVersion) {
      throw new ProjectVersionConflictError(project.id, expectedVersion, project.draftVersion);
    }
  }

  private assertValidSiteConfig(siteConfig: SiteConfig): void {
    const validation = validateSiteConfig(siteConfig);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }
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
    const rawState = this.storage?.getItem(STORAGE_KEY);

    return rawState === null || rawState === undefined
      ? this.createEmptyState()
      : this.projectStorageCodec.decode(rawState);
  }

  private writeState(state: ProjectStorageState): void {
    if (this.storage === null) {
      return;
    }

    const rawState = this.storage.getItem(STORAGE_KEY);

    if (rawState !== null) {
      this.projectStorageCodec.assertSupportedSchemaVersions(rawState);
    }

    const serializedState = this.projectStorageCodec.encode(state);

    if (serializedState.length > MAX_STORAGE_CHARACTERS) {
      throw new Error(
        'Локальное хранилище Nexus переполнено. Удалите тяжелые изображения или старые проекты.',
      );
    }

    this.storage.setItem(STORAGE_KEY, serializedState);
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

  private createId(prefix: string): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    this.fallbackIdCounter += 1;

    return `${prefix}-${Date.now().toString(36)}-${this.fallbackIdCounter.toString(36)}`;
  }
}
