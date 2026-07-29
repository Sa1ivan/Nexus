import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EMPTY_WORKSPACE_METRICS,
  ProjectInsightsService,
} from '../../data-access/project-insights.service';
import { ProjectsPageComponent } from './projects-page.component';

describe('ProjectsPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ProjectInsightsService,
          useValue: {
            getMetrics: vi.fn(async () => EMPTY_WORKSPACE_METRICS),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows one contextual action group in the empty state', async () => {
    const fixture = TestBed.createComponent(ProjectsPageComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('a'));
    const newLandingLinks = links.filter((link) => link.textContent?.includes('Новый лендинг'));
    const builderLinks = links.filter((link) => link.textContent?.includes('Конструктор'));

    expect(newLandingLinks).toHaveLength(1);
    expect(builderLinks).toHaveLength(1);
    expect(root.querySelector('.projects-page__head-action')).toBeNull();
    expect(root.querySelector('.projects-page__empty-icon')).not.toBeNull();
  });
});
