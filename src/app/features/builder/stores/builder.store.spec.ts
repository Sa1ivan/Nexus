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

  it('increments document revision for edits, undo and redo but not initialization or selection', async () => {
    const initialProject = createProject(DEFAULT_SITE_CONFIG, 'initial-project');
    vi.mocked(repository.getActiveProject).mockResolvedValue(initialProject);

    expect(builderStore.documentRevision()).toBe(0);

    await builderStore.initialize();
    builderStore.selectBlock(builderStore.activeBlocks()[0]?.id ?? '');

    expect(builderStore.documentRevision()).toBe(0);

    expect(builderStore.updateSiteName('First revision')).toBe(true);
    expect(builderStore.documentRevision()).toBe(1);
    expect(builderStore.updateSiteName('First revision')).toBe(false);
    expect(builderStore.documentRevision()).toBe(1);

    expect(builderStore.undo()).toBe(true);
    expect(builderStore.documentRevision()).toBe(2);
    expect(builderStore.redo()).toBe(true);
    expect(builderStore.documentRevision()).toBe(3);

    await builderStore.initialize();

    expect(builderStore.documentRevision()).toBe(3);
  });

  it('restores another project document when explicit route initialization fails', async () => {
    const firstConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'First project',
    };
    const firstProject = createProject(firstConfig, 'first-project');
    vi.mocked(repository.getProject)
      .mockResolvedValueOnce(firstProject)
      .mockRejectedValueOnce(new Error('Project loading failed.'));

    await builderStore.initialize(firstProject.id);
    expect(builderStore.siteConfig().name).toBe('First project');

    const didInitialize = await builderStore.initialize('second-project');

    expect(didInitialize).toBe(false);
    expect(builderStore.currentProject()).toBe(firstProject);
    expect(builderStore.siteConfig()).toBe(firstConfig);
    expect(builderStore.projectError()).toBe('Project loading failed.');
  });

  it('clears another project document before an explicit route lookup resolves', async () => {
    const firstConfig = {
      ...DEFAULT_SITE_CONFIG,
      name: 'First project',
    };
    const firstProject = createProject(firstConfig, 'first-project');
    const secondLookup = createDeferred<Project | null>();
    vi.mocked(repository.getProject)
      .mockResolvedValueOnce(firstProject)
      .mockReturnValueOnce(secondLookup.promise);

    await builderStore.initialize(firstProject.id);
    builderStore.updateSiteName('Unsaved stale edit');
    const secondInitialization = builderStore.initialize('second-project');

    expect(builderStore.currentProject()).toBeNull();
    expect(builderStore.siteConfig()).toBe(DEFAULT_SITE_CONFIG);
    expect(builderStore.activePageId()).toBe(DEFAULT_SITE_CONFIG.pages[0]?.id);
    expect(builderStore.selectedBlockId()).toBe(DEFAULT_SITE_CONFIG.pages[0]?.blocks[0]?.id);
    expect(builderStore.canUndo()).toBe(false);

    secondLookup.resolve(null);
    expect(await secondInitialization).toBe(false);

    expect(builderStore.currentProject()).toBe(firstProject);
    expect(builderStore.siteConfig().name).toBe('Unsaved stale edit');
    expect(builderStore.canUndo()).toBe(true);
    expect(builderStore.projectError()).toBe('Проект не найден.');
  });

  it('adds and edits a page while selecting it by stable id', () => {
    expect(builderStore.addPage('О компании')).toBe(true);

    const page = builderStore.activePage();

    expect(page).not.toBeNull();
    expect(builderStore.activePageId()).toBe(page?.id);
    expect(builderStore.activePageSlug()).toBe('o-kompanii');
    expect(page?.blocks.map((block) => block.type)).toEqual(['siteHeader', 'hero', 'siteFooter']);
    expect(builderStore.selectedBlockId()).toBe(page?.blocks[0]?.id);
    expect(builderStore.canUndo()).toBe(true);
    expect(builderStore.saveStatus()).toBe('dirty');

    expect(builderStore.renamePage(page?.id ?? '', 'О студии')).toBe(true);
    expect(builderStore.updatePageSlug(page?.id ?? '', 'about')).toBe(true);
    expect(
      builderStore.updatePageSeo(page?.id ?? '', {
        title: 'О студии — Nexus',
        description: 'Описание студии',
        noIndex: true,
      }),
    ).toBe(true);
    expect(builderStore.activePage()).toMatchObject({
      id: page?.id,
      title: 'О студии',
      slug: 'about',
      seo: {
        title: 'О студии — Nexus',
        description: 'Описание студии',
        noIndex: true,
      },
    });

    expect(builderStore.undo()).toBe(true);
    expect(builderStore.activePage()).toMatchObject({
      slug: 'about',
      seo: {
        title: 'О компании',
        description: '',
        noIndex: false,
      },
    });
  });

  it('duplicates, moves and removes pages while reconciling active state', () => {
    expect(builderStore.addPage('Услуги')).toBe(true);
    const sourcePage = builderStore.activePage();

    expect(builderStore.duplicatePage(sourcePage?.id ?? '')).toBe(true);
    const duplicatedPage = builderStore.activePage();

    expect(duplicatedPage?.id).not.toBe(sourcePage?.id);
    expect(duplicatedPage?.blocks.map((block) => block.anchor)).toEqual(
      sourcePage?.blocks.map((block) => block.anchor),
    );
    expect(builderStore.movePage(duplicatedPage?.id ?? '', 'up')).toBe(true);
    expect(builderStore.pages()[1]?.id).toBe(duplicatedPage?.id);
    expect(builderStore.removePage(duplicatedPage?.id ?? '')).toBe(true);
    expect(builderStore.pages()).toHaveLength(2);
    expect(builderStore.activePage()).not.toBeNull();
    expect(builderStore.selectedBlockId()).toBe(builderStore.activePage()?.blocks[0]?.id);
  });

  it('allows the same block anchor on different pages', () => {
    const homePage = builderStore.pages()[0];

    expect(homePage?.blocks.some((block) => block.anchor === 'lead-form')).toBe(true);
    expect(builderStore.addPage('Услуги')).toBe(true);

    const activeHeader = builderStore
      .activePage()
      ?.blocks.find((block) => block.type === 'siteHeader');

    expect(builderStore.updateBlockAnchor(activeHeader?.id ?? '', 'lead-form')).toBe(true);
    expect(builderStore.activePage()?.blocks[0]?.anchor).toBe('lead-form');
    expect(builderStore.pages()[0]).toBe(homePage);
  });

  it('reports page errors in Russian without changing the document', () => {
    const page = builderStore.pages()[0];
    const documentBefore = builderStore.siteConfig();

    expect(builderStore.updatePageSlug(page?.id ?? '', 'builder')).toBe(false);
    expect(builderStore.siteConfig()).toBe(documentBefore);
    expect(builderStore.pageError()).toBe('Этот адрес страницы зарезервирован системой.');
    expect(builderStore.canUndo()).toBe(false);

    expect(builderStore.removePage(page?.id ?? '')).toBe(false);
    expect(builderStore.siteConfig()).toBe(documentBefore);
    expect(builderStore.pageError()).toBe('Нельзя удалить единственную страницу.');
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
