import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import { ProjectTransferService } from '../data-access/project-transfer.service';
import type { LeadSubmission, Project, PublishedRelease, SiteConfig } from '../domain/models';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../domain/ports/project.repository';
import { BuilderHistoryStore } from './builder-history.store';
import { BuilderProjectStore } from './builder-project.store';
import { BuilderStore } from './builder.store';

describe('BuilderStore project transfer', () => {
  let builderStore: BuilderStore;
  let projectTransferService: ProjectTransferService;
  let repository: ProjectRepository;

  beforeEach(() => {
    repository = createRepository();
    TestBed.configureTestingModule({
      providers: [
        BuilderStore,
        BuilderProjectStore,
        BuilderHistoryStore,
        { provide: PROJECT_REPOSITORY, useValue: repository },
      ],
    });
    builderStore = TestBed.inject(BuilderStore);
    projectTransferService = TestBed.inject(ProjectTransferService);
  });

  it('exports the current document', () => {
    builderStore.updateSiteName('Exported project');

    const download = builderStore.exportCurrentProject();

    expect(download.fileName).toBe('exported-project.nexus.json');
  });

  it('imports a valid file as a new active project and resets history', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    const importedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'Imported project',
    };
    const importedProject = createProject(importedConfig, 'imported-project');
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);
    vi.mocked(repository.createProject).mockResolvedValue(importedProject);

    await builderStore.initialize();
    builderStore.updateSiteName('Unsaved local edit');
    expect(builderStore.canUndo()).toBe(true);

    const didImport = await builderStore.importProjectFile(
      createProjectFile(projectTransferService, importedConfig),
    );

    expect(didImport).toBe(true);
    expect(repository.createProject).toHaveBeenCalledWith({
      siteConfig: importedConfig,
    });
    expect(builderStore.currentProject()?.id).toBe(importedProject.id);
    expect(builderStore.siteConfig()).toEqual(importedConfig);
    expect(builderStore.canUndo()).toBe(false);
    expect(builderStore.saveStatus()).toBe('saved');
  });

  it('keeps the current project and document unchanged when the file is invalid', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);
    await builderStore.initialize();
    builderStore.updateSiteName('Keep this document');
    const projectBefore = builderStore.currentProject();
    const documentBefore = builderStore.siteConfig();

    const didImport = await builderStore.importProjectFile(
      new File(['not JSON'], 'broken.nexus.json', {
        type: 'application/json',
      }),
    );

    expect(didImport).toBe(false);
    expect(builderStore.currentProject()).toBe(projectBefore);
    expect(builderStore.siteConfig()).toBe(documentBefore);
    expect(repository.createProject).not.toHaveBeenCalled();
    expect(builderStore.saveStatus()).toBe('error');
    expect(builderStore.projectError()).toBe(
      'Не удалось импортировать проект. Проверьте файл и повторите попытку.',
    );
  });

  it('keeps the current project and document unchanged when project creation fails', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    const importedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'Imported project',
    };
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);
    vi.mocked(repository.createProject).mockRejectedValue(new Error('Storage failed.'));
    await builderStore.initialize();
    const projectBefore = builderStore.currentProject();
    const documentBefore = builderStore.siteConfig();

    const didImport = await builderStore.importProjectFile(
      createProjectFile(projectTransferService, importedConfig),
    );

    expect(didImport).toBe(false);
    expect(builderStore.currentProject()).toBe(projectBefore);
    expect(builderStore.siteConfig()).toBe(documentBefore);
    expect(builderStore.saveStatus()).toBe('error');
    expect(builderStore.projectError()).toBe(
      'Не удалось создать проект из импортированного файла.',
    );
  });

  it('cancels a pending file read when the document changes', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    const importedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'Imported project',
    };
    const delayedRead = createDeferred<{
      readonly ok: true;
      readonly value: SiteConfig;
    }>();
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);
    vi.spyOn(projectTransferService, 'readFile').mockReturnValue(delayedRead.promise);
    await builderStore.initialize();

    const importProject = builderStore.importProjectFile(
      new File(['pending'], 'project.nexus.json'),
    );
    builderStore.updateSiteName('Newer local edit');
    delayedRead.resolve({ ok: true, value: importedConfig });

    await expect(importProject).resolves.toBe(false);
    expect(repository.createProject).not.toHaveBeenCalled();
    expect(builderStore.currentProject()).toBe(initialProject);
    expect(builderStore.siteConfig().name).toBe('Newer local edit');
    expect(builderStore.projectError()).toBeNull();
  });

  it('does not report a stale import as an error after project navigation', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    const navigatedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'Navigated project',
    };
    const navigatedProject = createProject(navigatedConfig, 'navigated-project');
    const importedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'Imported project',
    };
    const importedProject = createProject(importedConfig, 'imported-project');
    const delayedCreation = createDeferred<Project>();
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);
    vi.mocked(repository.getProject).mockResolvedValue(navigatedProject);
    vi.mocked(repository.createProject).mockReturnValue(delayedCreation.promise);
    await builderStore.initialize();

    const importProject = builderStore.importProjectFile(
      createProjectFile(projectTransferService, importedConfig),
    );
    await vi.waitFor(() => expect(repository.createProject).toHaveBeenCalled());
    await builderStore.initialize(navigatedProject.id);
    delayedCreation.resolve(importedProject);

    await expect(importProject).resolves.toBe(false);
    expect(builderStore.currentProject()).toBe(navigatedProject);
    expect(builderStore.siteConfig()).toBe(navigatedConfig);
    expect(builderStore.projectError()).toBeNull();
    expect(repository.setActiveProject).toHaveBeenLastCalledWith(navigatedProject.id);
  });

  it('cancels project creation when the document changes before it resolves', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    const importedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'Imported project',
    };
    const importedProject = createProject(importedConfig, 'imported-project');
    const delayedCreation = createDeferred<Project>();
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);
    vi.mocked(repository.createProject).mockReturnValue(delayedCreation.promise);
    await builderStore.initialize();

    const importProject = builderStore.importProjectFile(
      createProjectFile(projectTransferService, importedConfig),
    );
    await vi.waitFor(() => expect(repository.createProject).toHaveBeenCalled());
    builderStore.updateSiteName('Edit made during import');
    delayedCreation.resolve(importedProject);

    await expect(importProject).resolves.toBe(false);
    expect(builderStore.currentProject()).toBe(initialProject);
    expect(builderStore.siteConfig().name).toBe('Edit made during import');
    expect(builderStore.projectError()).toBeNull();
    expect(repository.setActiveProject).toHaveBeenLastCalledWith(initialProject.id);
  });

  it('rejects a second import while the first project creation is pending', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    const firstImportedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'First imported project',
    };
    const secondImportedConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'Second imported project',
    };
    const firstImportedProject = createProject(firstImportedConfig, 'first-imported-project');
    const delayedCreation = createDeferred<Project>();
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);
    vi.mocked(repository.createProject).mockReturnValue(delayedCreation.promise);
    await builderStore.initialize();

    const firstImport = builderStore.importProjectFile(
      createProjectFile(projectTransferService, firstImportedConfig),
    );
    await vi.waitFor(() => expect(repository.createProject).toHaveBeenCalled());
    const secondImport = await builderStore.importProjectFile(
      createProjectFile(projectTransferService, secondImportedConfig),
    );

    expect(secondImport).toBe(false);
    expect(repository.createProject).toHaveBeenCalledTimes(1);
    expect(builderStore.projectError()).toBe(
      'Дождитесь завершения текущего сохранения или импорта.',
    );
    expect(builderStore.saveStatus()).toBe('saving');

    const thirdImport = await builderStore.importProjectFile(
      createProjectFile(projectTransferService, secondImportedConfig),
    );

    expect(thirdImport).toBe(false);
    expect(repository.createProject).toHaveBeenCalledTimes(1);
    expect(builderStore.saveStatus()).toBe('saving');

    delayedCreation.resolve(firstImportedProject);

    await expect(firstImport).resolves.toBe(true);
    expect(builderStore.currentProject()).toBe(firstImportedProject);
    expect(builderStore.siteConfig()).toBe(firstImportedConfig);
    expect(builderStore.projectError()).toBeNull();
  });
});

function createProjectFile(service: ProjectTransferService, siteConfig: SiteConfig): File {
  return new File([service.serialize(siteConfig)], 'project.nexus.json', {
    type: 'application/json',
  });
}

function createProject(siteConfig: SiteConfig, id: string): Project {
  const now = '2026-07-26T00:00:00.000Z';

  return {
    id,
    name: siteConfig.name,
    draft: siteConfig,
    draftVersion: 1,
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
    createProject: vi.fn(
      async ({ siteConfig }): Promise<Project> => createProject(siteConfig, 'created-project'),
    ),
    saveDraft: vi.fn(
      async ({ siteConfig }): Promise<Project> => createProject(siteConfig, 'saved-project'),
    ),
    publishProject: vi.fn(
      async ({ siteConfig }): Promise<Project> => createProject(siteConfig, 'published-project'),
    ),
    getPublishedRelease: vi.fn(async (): Promise<PublishedRelease | null> => null),
    submitLead: vi.fn(async (): Promise<LeadSubmission> => {
      throw new Error('Not implemented in this test.');
    }),
    listLeads: vi.fn(async (): Promise<readonly LeadSubmission[]> => []),
  };
}
