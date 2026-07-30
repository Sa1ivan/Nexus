import { DOCUMENT } from '@angular/common';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../../data-access/default-site.config';
import type { ProjectSaveStatus } from '../../domain/models';
import { BuilderAutosaveService } from '../../services/builder-autosave.service';
import { BuilderStore } from '../../stores/builder.store';
import { BuilderPageComponent } from './builder-page.component';

describe('BuilderPageComponent', () => {
  it('flushes the current project before loading a changed route project id', async () => {
    const routeParams = new ReplaySubject<ReturnType<typeof convertToParamMap>>(1);
    const initialize = vi.fn(async (): Promise<boolean> => true);
    const flushPending = vi.fn(async (): Promise<boolean> => true);
    const autosave = {
      start: vi.fn(),
      stop: vi.fn(),
      flush: vi.fn(async (): Promise<void> => undefined),
      flushPending,
    };
    const builderStore = createBuilderStoreMock(initialize);
    const initialParamMap = convertToParamMap({ projectId: 'project-a' });
    const injector = Injector.create({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams.asObservable(),
            snapshot: { paramMap: initialParamMap },
          },
        },
        { provide: DOCUMENT, useValue: document },
        { provide: BuilderAutosaveService, useValue: autosave },
        { provide: BuilderStore, useValue: builderStore },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const component = runInInjectionContext(injector, () => new BuilderPageComponent());

    component.ngOnInit();
    routeParams.next(initialParamMap);
    await new Promise<void>((resolve) => setTimeout(resolve));
    routeParams.next(convertToParamMap({ projectId: 'project-b' }));
    await new Promise<void>((resolve) => setTimeout(resolve));

    expect(initialize).toHaveBeenNthCalledWith(1, 'project-a');
    expect(flushPending).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenNthCalledWith(2, 'project-b');
    expect(flushPending.mock.invocationCallOrder[0]).toBeLessThan(
      initialize.mock.invocationCallOrder[1] ?? Number.POSITIVE_INFINITY,
    );
    component.ngOnDestroy();
  });

  it('keeps the current project loaded when pending changes cannot be saved', async () => {
    const routeParams = new ReplaySubject<ReturnType<typeof convertToParamMap>>(1);
    const initialize = vi.fn(async (): Promise<boolean> => true);
    const autosave = {
      start: vi.fn(),
      stop: vi.fn(),
      flush: vi.fn(async (): Promise<void> => undefined),
      flushPending: vi.fn(async (): Promise<boolean> => false),
    };
    const initialParamMap = convertToParamMap({ projectId: 'project-a' });
    const navigate = vi.fn(async (): Promise<boolean> => true);
    const injector = Injector.create({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams.asObservable(),
            snapshot: { paramMap: initialParamMap },
          },
        },
        { provide: DOCUMENT, useValue: document },
        { provide: BuilderAutosaveService, useValue: autosave },
        { provide: BuilderStore, useValue: createBuilderStoreMock(initialize) },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const component = runInInjectionContext(injector, () => new BuilderPageComponent());

    component.ngOnInit();
    routeParams.next(initialParamMap);
    await new Promise<void>((resolve) => setTimeout(resolve));
    routeParams.next(convertToParamMap({ projectId: 'project-b' }));
    await new Promise<void>((resolve) => setTimeout(resolve));

    expect(autosave.flushPending).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledWith('project-a');
    expect(navigate).toHaveBeenCalledWith(['/builder', 'project-a'], { replaceUrl: true });
    component.ngOnDestroy();
  });

  it('restores the previous project after a failed route load and still allows later navigation', async () => {
    const routeParams = new ReplaySubject<ReturnType<typeof convertToParamMap>>(1);
    const projectError = signal<string | null>(null);
    const initialize = vi.fn(async (projectId?: string): Promise<boolean> => {
      projectError.set(projectId === 'missing-project' ? 'Проект не найден.' : null);
      return projectId !== 'missing-project';
    });
    const autosave = {
      start: vi.fn(),
      stop: vi.fn(),
      flush: vi.fn(async (): Promise<void> => undefined),
      flushPending: vi.fn(async (): Promise<boolean> => true),
    };
    const navigate = vi.fn(async (): Promise<boolean> => true);
    const initialParamMap = convertToParamMap({ projectId: 'project-a' });
    const injector = Injector.create({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams.asObservable(),
            snapshot: { paramMap: initialParamMap },
          },
        },
        { provide: DOCUMENT, useValue: document },
        { provide: BuilderAutosaveService, useValue: autosave },
        {
          provide: BuilderStore,
          useValue: createBuilderStoreMock(initialize, projectError),
        },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const component = runInInjectionContext(injector, () => new BuilderPageComponent());

    component.ngOnInit();
    routeParams.next(initialParamMap);
    await new Promise<void>((resolve) => setTimeout(resolve));
    routeParams.next(convertToParamMap({ projectId: 'missing-project' }));
    await new Promise<void>((resolve) => setTimeout(resolve));
    routeParams.next(convertToParamMap({ projectId: 'project-c' }));
    await new Promise<void>((resolve) => setTimeout(resolve));

    expect(initialize).toHaveBeenNthCalledWith(1, 'project-a');
    expect(initialize).toHaveBeenNthCalledWith(2, 'missing-project');
    expect(initialize).toHaveBeenNthCalledWith(3, 'project-c');
    expect(navigate).toHaveBeenCalledWith(['/builder', 'project-a'], { replaceUrl: true });
    component.ngOnDestroy();
  });
});

function createBuilderStoreMock(
  initialize: (projectId?: string) => Promise<boolean>,
  projectError = signal<string | null>(null),
) {
  return {
    initialize,
    siteConfig: signal(DEFAULT_SITE_CONFIG),
    activePage: signal(DEFAULT_SITE_CONFIG.pages[0] ?? null),
    activeBlocks: signal(DEFAULT_SITE_CONFIG.pages[0]?.blocks ?? []),
    selectedBlock: signal(DEFAULT_SITE_CONFIG.pages[0]?.blocks[0] ?? null),
    saveStatus: signal<ProjectSaveStatus>('saved'),
    projectError,
    publishedUrl: signal<string | null>(null),
    canUndo: signal(false),
    canRedo: signal(false),
  };
}
