import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SITE_CONFIG } from './default-site.config';
import {
  LocalProjectRepository,
  PROJECT_STORAGE,
  PROJECT_STORAGE_LOCK,
  type ProjectStorageLock,
} from './local-project.repository';

const PROJECTS_STORAGE_KEY = 'nexus.builder.projects.v1';

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

class SerialProjectStorageLock implements ProjectStorageLock {
  private tail: Promise<void> = Promise.resolve();

  request<TValue>(_name: string, callback: () => TValue | PromiseLike<TValue>): Promise<TValue> {
    const result = this.tail.then(callback);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }
}

describe('LocalProjectRepository', () => {
  let repository: LocalProjectRepository;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        LocalProjectRepository,
        { provide: PROJECT_STORAGE, useValue: storage },
        { provide: PROJECT_STORAGE_LOCK, useValue: new SerialProjectStorageLock() },
      ],
    });
    repository = TestBed.inject(LocalProjectRepository);
  });

  it('creates a project when stored projects use schema version 2', async () => {
    seedSchemaVersionTwoProject(storage);

    const created = await repository.createProject({
      siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'New project' },
    });
    const recoveredRepository = TestBed.runInInjectionContext(() => new LocalProjectRepository());

    expect(created).toMatchObject({
      name: 'New project',
      draftVersion: 1,
    });
    await expect(recoveredRepository.getProject(created.id)).resolves.toMatchObject({
      name: 'New project',
    });
  });

  it('saves a project loaded from schema version 2 storage', async () => {
    seedSchemaVersionTwoProject(storage);
    const project = await repository.getProject('legacy-project');

    if (project === null) {
      throw new Error('Legacy project fixture was not normalized.');
    }

    await repository.saveDraft({
      projectId: project.id,
      expectedDraftVersion: project.draftVersion,
      siteConfig: { ...project.draft, name: 'Saved legacy project' },
    });
    const recoveredRepository = TestBed.runInInjectionContext(() => new LocalProjectRepository());

    await expect(recoveredRepository.getProject(project.id)).resolves.toMatchObject({
      name: 'Saved legacy project',
      draftVersion: 2,
    });
  });

  it('saves a project loaded from schema version 3 storage', async () => {
    seedSchemaVersionThreeProject(storage);
    const project = await repository.getProject('legacy-v3-project');

    if (project === null) {
      throw new Error('Schema v3 project fixture was not normalized.');
    }

    await repository.saveDraft({
      projectId: project.id,
      expectedDraftVersion: project.draftVersion,
      siteConfig: { ...project.draft, name: 'Saved schema v3 project' },
    });
    const recoveredRepository = TestBed.runInInjectionContext(() => new LocalProjectRepository());

    await expect(recoveredRepository.getProject(project.id)).resolves.toMatchObject({
      name: 'Saved schema v3 project',
      draftVersion: 2,
      draft: {
        schemaVersion: 4,
      },
      releases: [
        {
          siteConfig: {
            schemaVersion: 4,
          },
        },
      ],
      revisions: expect.arrayContaining([
        expect.objectContaining({
          siteConfig: expect.objectContaining({
            schemaVersion: 4,
          }),
        }),
      ]),
    });
  });

  it('publishes a project loaded from schema version 2 storage', async () => {
    seedSchemaVersionTwoProject(storage);
    const project = await repository.getProject('legacy-project');

    if (project === null) {
      throw new Error('Legacy project fixture was not normalized.');
    }

    await repository.publishProject({
      projectId: project.id,
      expectedDraftVersion: project.draftVersion,
      siteConfig: project.draft,
    });
    const recoveredRepository = TestBed.runInInjectionContext(() => new LocalProjectRepository());
    const recoveredProject = await recoveredRepository.getProject(project.id);

    expect(recoveredProject).toMatchObject({
      draftVersion: 2,
      publishedReleaseId: expect.any(String),
    });
    await expect(recoveredRepository.getPublishedRelease(project.id)).resolves.toMatchObject({
      version: 1,
    });
  });

  it('rejects a stale save and preserves the latest draft', async () => {
    const created = await repository.createProject({ siteConfig: DEFAULT_SITE_CONFIG });
    const first = await repository.saveDraft({
      projectId: created.id,
      expectedDraftVersion: created.draftVersion,
      siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'Latest' },
    });

    await expect(
      repository.saveDraft({
        projectId: created.id,
        expectedDraftVersion: created.draftVersion,
        siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'Stale' },
      }),
    ).rejects.toMatchObject({
      projectId: created.id,
      expectedVersion: created.draftVersion,
      actualVersion: first.draftVersion,
    });

    await expect(repository.getProject(created.id)).resolves.toMatchObject({
      draft: { name: 'Latest' },
    });
  });

  it('rejects a stale publish before creating a release', async () => {
    const created = await repository.createProject({ siteConfig: DEFAULT_SITE_CONFIG });
    const latest = await repository.saveDraft({
      projectId: created.id,
      expectedDraftVersion: created.draftVersion,
      siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'Latest' },
    });

    await expect(
      repository.publishProject({
        projectId: created.id,
        expectedDraftVersion: created.draftVersion,
        siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'Stale' },
      }),
    ).rejects.toMatchObject({
      projectId: created.id,
      expectedVersion: created.draftVersion,
      actualVersion: latest.draftVersion,
    });

    await expect(repository.getProject(created.id)).resolves.toMatchObject({
      publishedReleaseId: null,
      releases: [],
      draft: { name: 'Latest' },
    });
  });

  it('serializes concurrent writers before checking the stored version', async () => {
    const secondRepository = TestBed.runInInjectionContext(() => new LocalProjectRepository());
    const created = await repository.createProject({ siteConfig: DEFAULT_SITE_CONFIG });

    const [firstSave, secondSave] = await Promise.allSettled([
      repository.saveDraft({
        projectId: created.id,
        expectedDraftVersion: created.draftVersion,
        siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'First writer' },
      }),
      secondRepository.saveDraft({
        projectId: created.id,
        expectedDraftVersion: created.draftVersion,
        siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'Second writer' },
      }),
    ]);

    expect(firstSave.status).toBe('fulfilled');
    expect(secondSave).toMatchObject({
      status: 'rejected',
      reason: {
        projectId: created.id,
        expectedVersion: created.draftVersion,
        actualVersion: created.draftVersion + 1,
      },
    });
    await expect(repository.getProject(created.id)).resolves.toMatchObject({
      draftVersion: created.draftVersion + 1,
      draft: { name: 'First writer' },
    });
  });
});

function seedSchemaVersionTwoProject(storage: Storage): void {
  const timestamp = '2026-07-26T00:00:00.000Z';
  const legacySiteConfig = {
    ...DEFAULT_SITE_CONFIG,
    schemaVersion: 2,
    seo: {
      title: DEFAULT_SITE_CONFIG.pages[0]?.title ?? DEFAULT_SITE_CONFIG.name,
      description: '',
      socialImage: null,
      language: DEFAULT_SITE_CONFIG.seo.language,
      favicon: DEFAULT_SITE_CONFIG.seo.favicon,
    },
    pages: DEFAULT_SITE_CONFIG.pages.map((page) => ({
      id: page.id,
      title: page.title,
      blocks: page.blocks,
    })),
  };

  storage.setItem(
    PROJECTS_STORAGE_KEY,
    JSON.stringify({
      projects: [
        {
          id: 'legacy-project',
          name: 'Legacy project',
          draft: legacySiteConfig,
          draftVersion: 1,
          publishedReleaseId: null,
          releases: [],
          revisions: [
            {
              id: 'legacy-revision',
              version: 1,
              siteConfig: legacySiteConfig,
              createdAt: timestamp,
            },
          ],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      leads: [],
      activeProjectId: 'legacy-project',
    }),
  );
}

function seedSchemaVersionThreeProject(storage: Storage): void {
  const timestamp = '2026-07-30T00:00:00.000Z';
  const { chrome, ...siteWithoutChrome } = DEFAULT_SITE_CONFIG;
  const legacySiteConfig = {
    ...siteWithoutChrome,
    schemaVersion: 3,
    pages: siteWithoutChrome.pages.map((page) => ({
      ...page,
      blocks: [chrome.header, ...page.blocks, chrome.footer],
    })),
  };

  storage.setItem(
    PROJECTS_STORAGE_KEY,
    JSON.stringify({
      projects: [
        {
          id: 'legacy-v3-project',
          name: 'Legacy v3 project',
          draft: legacySiteConfig,
          draftVersion: 1,
          publishedReleaseId: 'legacy-v3-release',
          releases: [
            {
              id: 'legacy-v3-release',
              version: 1,
              siteConfig: legacySiteConfig,
              publishedAt: timestamp,
            },
          ],
          revisions: [
            {
              id: 'legacy-v3-revision',
              version: 1,
              siteConfig: legacySiteConfig,
              createdAt: timestamp,
            },
          ],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      leads: [],
      activeProjectId: 'legacy-v3-project',
    }),
  );
}
