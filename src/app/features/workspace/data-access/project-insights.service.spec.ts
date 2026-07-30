import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../../builder/data-access/default-site.config';
import type { LeadSubmission, Project, PublishedRelease } from '../../builder/domain/models';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../builder/domain/ports/project.repository';
import { ProjectInsightsService } from './project-insights.service';

describe('ProjectInsightsService', () => {
  it('uses the canonical active-release route after the draft slug changes', async () => {
    const publishedConfig = {
      ...DEFAULT_SITE_CONFIG,
      pages: DEFAULT_SITE_CONFIG.pages.map((page, index) =>
        index === 0 ? { ...page, slug: 'published-home' } : page,
      ),
    };
    const draftConfig = {
      ...publishedConfig,
      pages: publishedConfig.pages.map((page, index) =>
        index === 0 ? { ...page, slug: 'changed-draft-home' } : page,
      ),
    };
    const project: Project = {
      id: 'project-1',
      name: draftConfig.name,
      draft: draftConfig,
      draftVersion: 3,
      publishedReleaseId: 'release-1',
      releases: [
        {
          id: 'release-1',
          version: 1,
          siteConfig: publishedConfig,
          publishedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
      revisions: [],
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    };
    const repository = createRepository(project);
    TestBed.configureTestingModule({
      providers: [ProjectInsightsService, { provide: PROJECT_REPOSITORY, useValue: repository }],
    });

    const metrics = await TestBed.inject(ProjectInsightsService).getMetrics();

    expect(metrics.projects[0]?.publicUrl).toBe('/p/project-1');
  });
});

function createRepository(project: Project): ProjectRepository {
  return {
    listProjects: vi.fn(async (): Promise<readonly Project[]> => [project]),
    getProject: vi.fn(async (): Promise<Project | null> => project),
    getActiveProject: vi.fn(async (): Promise<Project | null> => project),
    setActiveProject: vi.fn(async (): Promise<void> => undefined),
    createProject: vi.fn(async (): Promise<Project> => project),
    saveDraft: vi.fn(async (): Promise<Project> => project),
    publishProject: vi.fn(async (): Promise<Project> => project),
    getPublishedRelease: vi.fn(
      async (): Promise<PublishedRelease | null> => project.releases[0] ?? null,
    ),
    submitLead: vi.fn(async (): Promise<LeadSubmission> => {
      throw new Error('Not implemented in this test.');
    }),
    listLeads: vi.fn(async (): Promise<readonly LeadSubmission[]> => []),
  };
}
