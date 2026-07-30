import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLandingAccentRgb } from '../../domain/models';
import type { Project } from '../../domain/models';
import { LANDING_WIZARD_STEPS } from '../../data-access/landing-wizard-options';
import { BuilderStore } from '../../stores/builder.store';
import { CreateLandingPageComponent } from './create-landing-page.component';

describe('CreateLandingPageComponent', () => {
  const createLandingDraft = vi.fn();
  const navigate = vi.fn();
  const projectError = signal<string | null>(null);
  let component: CreateLandingPageComponent;

  beforeEach(() => {
    createLandingDraft.mockReset();
    navigate.mockReset();
    projectError.set(null);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BuilderStore,
          useValue: {
            createLandingDraft,
            projectError: projectError.asReadonly(),
          },
        },
        { provide: Router, useValue: { navigate } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new CreateLandingPageComponent());
    expect(LANDING_WIZARD_STEPS).toBeDefined();
    expect(component.stepDefinitions).toBe(LANDING_WIZARD_STEPS);
    component.selection.set({
      industry: 'restaurant',
      tone: 'premium',
      header: 'centeredHero',
      offerList: 'menuGrid',
      footer: 'contactMap',
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

  it('updates an RGB channel only for the current wizard step', () => {
    component.currentStepIndex.set(1);
    const industryAccent = component.designByStep().industry.accentColor;

    component.updateAccentRgbChannel('red', inputEvent('255'));
    component.updateAccentRgbChannel('green', inputEvent('34'));
    component.updateAccentRgbChannel('blue', inputEvent('56'));

    expect(getLandingAccentRgb(component.design().accentColor)).toEqual({
      red: 255,
      green: 34,
      blue: 56,
    });
    expect(component.designByStep().industry.accentColor).toBe(industryAccent);
  });

  it('clamps RGB channels to the supported range', () => {
    component.updateAccentRgbChannel('red', inputEvent('999'));

    expect(getLandingAccentRgb(component.design().accentColor).red).toBe(255);
  });

  it('propagates base design updates while preserving explicit per-step differences', () => {
    component.currentStepIndex.set(1);
    component.selectAccentColor('rose');
    component.currentStepIndex.set(0);
    component.selectAccentColor('blue');
    component.selectFontPairing('humanist');

    expect(component.designByStep().industry).toMatchObject({
      accentColor: 'blue',
      fontPairing: 'humanist',
    });
    expect(component.designByStep().tone).toMatchObject({
      accentColor: 'rose',
      fontPairing: 'humanist',
    });
    expect(component.designByStep().header).toMatchObject({
      accentColor: 'blue',
      fontPairing: 'humanist',
    });

    component.currentStepIndex.set(5);
    expect(component.design()).toBe(component.designByStep().industry);
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

function inputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;

  return { target: input } as unknown as Event;
}
