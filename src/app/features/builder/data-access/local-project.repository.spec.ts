import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SITE_CONFIG } from './default-site.config';
import {
  LocalProjectRepository,
  PROJECT_STORAGE,
  PROJECT_STORAGE_LOCK,
  type ProjectStorageLock,
} from './local-project.repository';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocalProjectRepository,
        { provide: PROJECT_STORAGE, useValue: new MemoryStorage() },
        { provide: PROJECT_STORAGE_LOCK, useValue: new SerialProjectStorageLock() },
      ],
    });
    repository = TestBed.inject(LocalProjectRepository);
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
