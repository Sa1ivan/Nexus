import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import {
  ProjectVersionConflictError,
  type LeadSubmission,
  type Project,
  type PublishedRelease,
} from '../domain/models';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../domain/ports/project.repository';
import { BuilderProjectStore } from './builder-project.store';

describe('BuilderProjectStore', () => {
  let projectStore: BuilderProjectStore;
  let repository: ProjectRepository;

  beforeEach(() => {
    repository = createRepository();
    TestBed.configureTestingModule({
      providers: [BuilderProjectStore, { provide: PROJECT_REPOSITORY, useValue: repository }],
    });
    projectStore = TestBed.inject(BuilderProjectStore);
  });

  it('publishes with the draft version loaded during initialization', async () => {
    const project = createProject(3);
    vi.mocked(repository.getProject).mockResolvedValue(project);
    vi.mocked(repository.publishProject).mockResolvedValue({
      ...project,
      publishedReleaseId: 'release-1',
    });

    await projectStore.initialize(project.id);
    await projectStore.publish(DEFAULT_SITE_CONFIG);

    expect(repository.publishProject).toHaveBeenCalledWith({
      projectId: project.id,
      expectedDraftVersion: 3,
      siteConfig: DEFAULT_SITE_CONFIG,
    });
  });

  it('reports a version conflict without replacing the current project', async () => {
    const project = createProject(2);
    vi.mocked(repository.getProject).mockResolvedValue(project);
    vi.mocked(repository.saveDraft).mockRejectedValue(
      new ProjectVersionConflictError(project.id, 2, 3),
    );

    await projectStore.initialize(project.id);
    await projectStore.save({ ...DEFAULT_SITE_CONFIG, name: 'Changed' });

    expect(projectStore.currentProject()?.draftVersion).toBe(2);
    expect(projectStore.saveStatus()).toBe('error');
    expect(projectStore.projectError()).toContain('другой вкладке');
  });

  it('ignores an older initialization that resolves after a newer project', async () => {
    const projectA = createProject(1, 'project-a');
    const projectB = createProject(4, 'project-b');
    const delayedProjectA = createDeferred<Project | null>();
    vi.mocked(repository.getProject).mockImplementation((projectId) =>
      projectId === projectA.id ? delayedProjectA.promise : Promise.resolve(projectB),
    );

    const initializeA = projectStore.initialize(projectA.id);
    await projectStore.initialize(projectB.id);
    delayedProjectA.resolve(projectA);
    await initializeA;

    expect(projectStore.currentProject()?.id).toBe(projectB.id);
  });

  it('ignores a save result from a previous project session', async () => {
    const projectA = createProject(1, 'project-a');
    const projectB = createProject(2, 'project-b');
    const delayedSave = createDeferred<Project>();
    vi.mocked(repository.getProject).mockImplementation(async (projectId) =>
      projectId === projectA.id ? projectA : projectB,
    );
    vi.mocked(repository.saveDraft).mockReturnValue(delayedSave.promise);

    await projectStore.initialize(projectA.id);
    const saveA = projectStore.save(projectA.draft);
    await projectStore.initialize(projectB.id);
    delayedSave.resolve({ ...projectA, draftVersion: 2 });
    await saveA;

    expect(projectStore.currentProject()?.id).toBe(projectB.id);
  });

  it('stays dirty when the document changes while a save is in flight', async () => {
    const project = createProject(2);
    const delayedSave = createDeferred<Project>();
    vi.mocked(repository.getProject).mockResolvedValue(project);
    vi.mocked(repository.saveDraft).mockReturnValue(delayedSave.promise);

    await projectStore.initialize(project.id);
    const save = projectStore.save(project.draft);
    projectStore.markDirty();
    delayedSave.resolve({ ...project, draftVersion: 3 });
    await save;

    expect(projectStore.currentProject()?.draftVersion).toBe(3);
    expect(projectStore.saveStatus()).toBe('dirty');
  });

  it('keeps project activation ordered when an older request resolves last', async () => {
    const projectA = createProject(1, 'project-a');
    const projectB = createProject(1, 'project-b');
    const delayedActivationA = createDeferred<void>();
    let activeProjectId: string | null = null;
    vi.mocked(repository.getProject).mockImplementation(async (projectId) =>
      projectId === projectA.id ? projectA : projectB,
    );
    vi.mocked(repository.setActiveProject).mockImplementation(async (projectId) => {
      if (projectId === projectA.id) {
        await delayedActivationA.promise;
      }

      activeProjectId = projectId;
    });

    const initializeA = projectStore.initialize(projectA.id);
    await Promise.resolve();
    const initializeB = projectStore.initialize(projectB.id);
    await Promise.resolve();
    delayedActivationA.resolve();
    await Promise.all([initializeA, initializeB]);

    expect(activeProjectId).toBe(projectB.id);
    expect(projectStore.currentProject()?.id).toBe(projectB.id);
  });

  it('does not start a second write while save is pending', async () => {
    const project = createProject(2);
    const delayedSave = createDeferred<Project>();
    vi.mocked(repository.getProject).mockResolvedValue(project);
    vi.mocked(repository.saveDraft).mockReturnValue(delayedSave.promise);

    await projectStore.initialize(project.id);
    const save = projectStore.save(project.draft);
    const publishResult = await projectStore.publish(project.draft);

    expect(publishResult).toBeNull();
    expect(repository.publishProject).not.toHaveBeenCalled();
    expect(projectStore.saveStatus()).toBe('saving');

    delayedSave.resolve({ ...project, draftVersion: 3 });
    await save;
  });

  it('does not create duplicate projects from concurrent first writes', async () => {
    const delayedCreation = createDeferred<Project>();
    vi.mocked(repository.createProject).mockReturnValue(delayedCreation.promise);

    const save = projectStore.save(DEFAULT_SITE_CONFIG);
    const publishResult = await projectStore.publish(DEFAULT_SITE_CONFIG);

    expect(publishResult).toBeNull();
    expect(repository.createProject).toHaveBeenCalledTimes(1);

    delayedCreation.resolve(createProject(1));
    await save;
  });

  it('restores the current project activation when a stale creation resolves', async () => {
    const projectA = createProject(1, 'project-a');
    const projectB = createProject(1, 'project-b');
    const importedProject = createProject(1, 'imported-project');
    const delayedCreation = createDeferred<Project>();
    vi.mocked(repository.getProject).mockImplementation(async (projectId) =>
      projectId === projectA.id ? projectA : projectB,
    );
    vi.mocked(repository.createProject).mockReturnValue(delayedCreation.promise);

    await projectStore.initialize(projectA.id);
    const createImport = projectStore.create(importedProject.draft);
    await Promise.resolve();
    await projectStore.initialize(projectB.id);
    delayedCreation.resolve(importedProject);

    await expect(createImport).resolves.toBeNull();
    expect(projectStore.currentProject()?.id).toBe(projectB.id);
    expect(repository.setActiveProject).toHaveBeenCalledTimes(3);
    expect(repository.setActiveProject).toHaveBeenLastCalledWith(projectB.id);
  });
});

function createProject(draftVersion: number, id = 'project-1'): Project {
  const now = '2026-07-26T00:00:00.000Z';

  return {
    id,
    name: DEFAULT_SITE_CONFIG.name,
    draft: DEFAULT_SITE_CONFIG,
    draftVersion,
    publishedReleaseId: null,
    releases: [],
    revisions: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createDeferred<TValue>(): {
  readonly promise: Promise<TValue>;
  readonly resolve: (value: TValue) => void;
} {
  let resolve!: (value: TValue) => void;
  const promise = new Promise<TValue>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function createRepository(): ProjectRepository {
  return {
    listProjects: vi.fn(async (): Promise<readonly Project[]> => []),
    getProject: vi.fn(async (): Promise<Project | null> => null),
    getActiveProject: vi.fn(async (): Promise<Project | null> => null),
    setActiveProject: vi.fn(async (): Promise<void> => undefined),
    createProject: vi.fn(async (): Promise<Project> => createProject(1)),
    saveDraft: vi.fn(async (): Promise<Project> => createProject(2)),
    publishProject: vi.fn(async (): Promise<Project> => createProject(2)),
    getPublishedRelease: vi.fn(async (): Promise<PublishedRelease | null> => null),
    submitLead: vi.fn(async (): Promise<LeadSubmission> => {
      throw new Error('Not implemented in this test.');
    }),
    listLeads: vi.fn(async (): Promise<readonly LeadSubmission[]> => []),
  };
}
