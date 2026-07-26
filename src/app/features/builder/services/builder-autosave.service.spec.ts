import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import {
  LocalProjectRepository,
  PROJECT_STORAGE,
  PROJECT_STORAGE_LOCK,
} from '../data-access/local-project.repository';
import {
  ProjectVersionConflictError,
  type LeadSubmission,
  type Project,
  type PublishedRelease,
  type SiteConfig,
} from '../domain/models';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../domain/ports';
import { BuilderHistoryStore } from '../stores/builder-history.store';
import { BuilderProjectStore } from '../stores/builder-project.store';
import { BuilderStore } from '../stores/builder.store';
import { BuilderAutosaveService } from './builder-autosave.service';

describe('BuilderAutosaveService', () => {
  let autosave: BuilderAutosaveService;
  let builderStore: BuilderStore;
  let projectStore: BuilderProjectStore;
  let repository: ProjectRepository;
  let save: MockInstance<BuilderProjectStore['save']>;

  beforeEach(() => {
    vi.useFakeTimers();
    repository = createRepository();
    TestBed.configureTestingModule({
      providers: [
        BuilderAutosaveService,
        BuilderStore,
        BuilderProjectStore,
        BuilderHistoryStore,
        { provide: PROJECT_REPOSITORY, useValue: repository },
      ],
    });
    autosave = TestBed.inject(BuilderAutosaveService);
    builderStore = TestBed.inject(BuilderStore);
    projectStore = TestBed.inject(BuilderProjectStore);
    save = vi
      .spyOn(projectStore, 'save')
      .mockImplementation(async (siteConfig) => createProject(siteConfig));
  });

  afterEach(() => {
    autosave.stop();
    vi.useRealTimers();
  });

  it('saves once after 800 ms of inactivity and starts idempotently', async () => {
    autosave.start();
    autosave.start();
    TestBed.tick();

    builderStore.updateSiteName('A');
    builderStore.updateSiteName('AB');
    builderStore.updateSiteName('ABC');
    TestBed.tick();

    await vi.advanceTimersByTimeAsync(799);
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'ABC' }));
  });

  it('serializes saves in document revision order', async () => {
    const firstSave = createDeferred<Project | null>();
    const secondSave = createDeferred<Project | null>();
    save.mockReset();
    save.mockReturnValueOnce(firstSave.promise).mockReturnValueOnce(secondSave.promise);
    autosave.start();
    TestBed.tick();

    builderStore.updateSiteName('First');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(800);

    builderStore.updateSiteName('Second');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(800);

    expect(save).toHaveBeenCalledTimes(1);

    firstSave.resolve(createProject({ ...DEFAULT_SITE_CONFIG, name: 'First' }, 2));
    await firstSave.promise;
    await vi.advanceTimersByTimeAsync(0);

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Second' }));

    secondSave.resolve(createProject({ ...DEFAULT_SITE_CONFIG, name: 'Second' }, 3));
    await autosave.flush();
  });

  it('flushes a pending revision immediately without saving it twice', async () => {
    autosave.start();
    TestBed.tick();
    builderStore.updateSiteName('Flush now');
    TestBed.tick();

    await autosave.flush();
    await vi.advanceTimersByTimeAsync(800);

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Flush now' }));
  });

  it('cancels a pending autosave when stopped', async () => {
    autosave.start();
    TestBed.tick();
    builderStore.updateSiteName('Do not save');
    TestBed.tick();

    autosave.stop();
    autosave.stop();
    await vi.advanceTimersByTimeAsync(800);

    expect(save).not.toHaveBeenCalled();
  });

  it('does not retry a conflicting document revision', async () => {
    const project = createProject(DEFAULT_SITE_CONFIG, 2);
    save.mockRestore();
    vi.mocked(repository.getActiveProject).mockResolvedValue(project);
    vi.mocked(repository.saveDraft).mockRejectedValue(
      new ProjectVersionConflictError(project.id, 2, 3),
    );
    await builderStore.initialize();
    autosave.start();
    TestBed.tick();

    builderStore.updateSiteName('Conflicting edit');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(800);
    await autosave.flush();

    expect(repository.saveDraft).toHaveBeenCalledTimes(1);
    expect(projectStore.projectError()).toBe(
      'Проект изменён в другой вкладке. Экспортируйте текущую версию или перезагрузите последнюю сохранённую.',
    );
  });
});

describe('BuilderAutosaveService recovery', () => {
  let autosave: BuilderAutosaveService;
  let builderStore: BuilderStore;
  let storage: MemoryStorage;

  beforeEach(() => {
    vi.useFakeTimers();
    storage = new MemoryStorage();
    configureRecoveryTestBed(storage);
    autosave = TestBed.inject(BuilderAutosaveService);
    builderStore = TestBed.inject(BuilderStore);
  });

  afterEach(() => {
    autosave.stop();
    vi.useRealTimers();
  });

  it('creates a project and recovers editor state after autosave', async () => {
    autosave.start();
    TestBed.tick();
    builderStore.updateSiteName('Recovered project');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(800);

    expect(builderStore.currentProject()).toMatchObject({
      name: 'Recovered project',
      draftVersion: 1,
    });

    autosave.stop();
    TestBed.resetTestingModule();
    configureRecoveryTestBed(storage);
    const recoveredStore = TestBed.inject(BuilderStore);

    await recoveredStore.initialize();

    expect(recoveredStore.siteConfig().name).toBe('Recovered project');
    expect(recoveredStore.activePageId()).toBe(recoveredStore.pages()[0]?.id);
    expect(recoveredStore.selectedBlockId()).toBe(recoveredStore.pages()[0]?.blocks[0]?.id);
    expect(recoveredStore.canUndo()).toBe(false);
  });

  it('updates the active project and recovers the latest autosave', async () => {
    const repository = TestBed.inject(LocalProjectRepository);
    const project = await repository.createProject({ siteConfig: DEFAULT_SITE_CONFIG });
    await builderStore.initialize(project.id);
    autosave.start();
    TestBed.tick();
    builderStore.updateSiteName('Updated project');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(800);

    autosave.stop();
    TestBed.resetTestingModule();
    configureRecoveryTestBed(storage);
    const recoveredStore = TestBed.inject(BuilderStore);

    await recoveredStore.initialize();

    expect(recoveredStore.siteConfig().name).toBe('Updated project');
    expect(recoveredStore.currentProject()?.draftVersion).toBe(2);
  });
});

function createProject(siteConfig: SiteConfig, draftVersion = 1, id = 'project-1'): Project {
  const timestamp = '2026-07-26T00:00:00.000Z';

  return {
    id,
    name: siteConfig.name,
    draft: siteConfig,
    draftVersion,
    publishedReleaseId: null,
    releases: [],
    revisions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
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
    createProject: vi.fn(async ({ siteConfig }): Promise<Project> => createProject(siteConfig)),
    saveDraft: vi.fn(async ({ siteConfig }): Promise<Project> => createProject(siteConfig, 2)),
    publishProject: vi.fn(async ({ siteConfig }): Promise<Project> => createProject(siteConfig, 2)),
    getPublishedRelease: vi.fn(async (): Promise<PublishedRelease | null> => null),
    submitLead: vi.fn(async (): Promise<LeadSubmission> => {
      throw new Error('Not implemented in this test.');
    }),
    listLeads: vi.fn(async (): Promise<readonly LeadSubmission[]> => []),
  };
}

function configureRecoveryTestBed(storage: Storage): void {
  TestBed.configureTestingModule({
    providers: [
      BuilderAutosaveService,
      BuilderStore,
      BuilderProjectStore,
      BuilderHistoryStore,
      LocalProjectRepository,
      { provide: PROJECT_REPOSITORY, useExisting: LocalProjectRepository },
      { provide: PROJECT_STORAGE, useValue: storage },
      { provide: PROJECT_STORAGE_LOCK, useValue: null },
    ],
  });
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
