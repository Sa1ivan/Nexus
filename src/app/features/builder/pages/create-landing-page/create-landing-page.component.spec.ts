import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Project } from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';
import { CreateLandingPageComponent } from './create-landing-page.component';

describe('CreateLandingPageComponent', () => {
  const createLandingDraft = vi.fn();
  const navigate = vi.fn();
  let component: CreateLandingPageComponent;

  beforeEach(() => {
    createLandingDraft.mockReset();
    navigate.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: BuilderStore, useValue: { createLandingDraft } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new CreateLandingPageComponent());
    component.selection.set({
      industry: component.industryOptions[0].id,
      tone: component.toneOptions[0].id,
      header: component.headerOptions[0].id,
      offerList: component.offerListOptions[0].id,
      footer: component.footerOptions[0].id,
    });
  });

  it('prevents duplicate project creation while the first request is pending', async () => {
    const pendingCreation = createDeferred<Project | null>();
    createLandingDraft.mockReturnValue(pendingCreation.promise);
    navigate.mockResolvedValue(true);

    const firstCreation = component.createLanding();
    const duplicateCreation = component.createLanding();

    expect(component.creating()).toBe(true);
    expect(createLandingDraft).toHaveBeenCalledTimes(1);

    pendingCreation.resolve({ id: 'project-1' } as Project);
    await Promise.all([firstCreation, duplicateCreation]);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(component.creating()).toBe(false);
  });
});

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
