import { inject, Injectable } from '@angular/core';

import type { BlockType, Project } from '../../builder/domain/models';
import { PROJECT_REPOSITORY } from '../../builder/domain/ports';
import { BLOCK_PALETTE } from '../../builder/domain/registry/block-registry';

export type ProjectPublicationStatus = 'draft' | 'published';

interface BlockTypeMeta {
  readonly type: BlockType;
  readonly label: string;
  readonly icon: string;
}

export interface ProjectSummary {
  readonly project: Project;
  readonly status: ProjectPublicationStatus;
  readonly pageCount: number;
  readonly blockCount: number;
  readonly releaseCount: number;
  readonly revisionCount: number;
  readonly leadCount: number;
  readonly firstPageTitle: string;
  readonly publicUrl: string | null;
  readonly createdAtLabel: string;
  readonly updatedAtLabel: string;
}

export interface WorkspaceMetrics {
  readonly projects: readonly ProjectSummary[];
  readonly totalProjects: number;
  readonly publishedProjects: number;
  readonly draftProjects: number;
  readonly totalLeads: number;
  readonly totalBlocks: number;
  readonly totalReleases: number;
  readonly totalRevisions: number;
  readonly averageBlocksPerProject: number;
  readonly latestProject: ProjectSummary | null;
}

export interface BlockDistributionItem extends BlockTypeMeta {
  readonly count: number;
  readonly percentage: number;
}

export interface ProjectLeadStats {
  readonly summary: ProjectSummary;
  readonly percentage: number;
}

export const EMPTY_WORKSPACE_METRICS: WorkspaceMetrics = {
  projects: [],
  totalProjects: 0,
  publishedProjects: 0,
  draftProjects: 0,
  totalLeads: 0,
  totalBlocks: 0,
  totalReleases: 0,
  totalRevisions: 0,
  averageBlocksPerProject: 0,
  latestProject: null,
};

const BLOCK_TYPE_META: readonly BlockTypeMeta[] = BLOCK_PALETTE.map((definition) => ({
  type: definition.type,
  label: definition.label,
  icon: definition.icon,
}));

@Injectable({
  providedIn: 'root',
})
export class ProjectInsightsService {
  private readonly projectRepository = inject(PROJECT_REPOSITORY);
  private readonly dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  async getMetrics(): Promise<WorkspaceMetrics> {
    const storedProjects = await this.projectRepository.listProjects();
    const leadCounts = new Map(
      await Promise.all(
        storedProjects.map(
          async (project) =>
            [project.id, (await this.projectRepository.listLeads(project.id)).length] as const,
        ),
      ),
    );
    const projects = [...storedProjects]
      .map((project) => this.createProjectSummary(project, leadCounts.get(project.id) ?? 0))
      .sort((left, right) => this.compareUpdatedAtDesc(left, right));

    const totalProjects = projects.length;
    const publishedProjects = projects.filter((summary) => summary.status === 'published').length;
    const totalBlocks = projects.reduce((sum, summary) => sum + summary.blockCount, 0);

    return {
      projects,
      totalProjects,
      publishedProjects,
      draftProjects: totalProjects - publishedProjects,
      totalLeads: projects.reduce((sum, summary) => sum + summary.leadCount, 0),
      totalBlocks,
      totalReleases: projects.reduce((sum, summary) => sum + summary.releaseCount, 0),
      totalRevisions: projects.reduce((sum, summary) => sum + summary.revisionCount, 0),
      averageBlocksPerProject:
        totalProjects === 0 ? 0 : Math.round((totalBlocks / totalProjects) * 10) / 10,
      latestProject: projects[0] ?? null,
    };
  }

  async getBlockDistribution(): Promise<readonly BlockDistributionItem[]> {
    const projects = await this.projectRepository.listProjects();
    const totalBlocks = projects.reduce(
      (projectSum, project) => projectSum + this.countBlocks(project),
      0,
    );

    return BLOCK_TYPE_META.map((meta) => {
      const count = projects.reduce(
        (sum, project) => sum + this.countBlocksByType(project, meta.type),
        0,
      );

      return {
        ...meta,
        count,
        percentage: totalBlocks === 0 ? 0 : Math.round((count / totalBlocks) * 100),
      };
    });
  }

  async getProjectLeadStats(): Promise<readonly ProjectLeadStats[]> {
    const metrics = await this.getMetrics();

    return metrics.projects
      .map((summary) => ({
        summary,
        percentage:
          metrics.totalLeads === 0 ? 0 : Math.round((summary.leadCount / metrics.totalLeads) * 100),
      }))
      .sort((left, right) => right.summary.leadCount - left.summary.leadCount);
  }

  getBlockTypeLabel(type: BlockType): string {
    return BLOCK_TYPE_META.find((meta) => meta.type === type)?.label ?? type;
  }

  private createProjectSummary(project: Project, leadCount: number): ProjectSummary {
    const published = project.publishedReleaseId !== null;

    return {
      project,
      status: published ? 'published' : 'draft',
      pageCount: project.draft.pages.length,
      blockCount: this.countBlocks(project),
      releaseCount: project.releases.length,
      revisionCount: project.revisions.length,
      leadCount,
      firstPageTitle: project.draft.pages[0]?.title ?? 'Без страницы',
      publicUrl: published ? `/p/${project.id}` : null,
      createdAtLabel: this.formatDate(project.createdAt),
      updatedAtLabel: this.formatDate(project.updatedAt),
    };
  }

  private countBlocks(project: Project): number {
    return project.draft.pages.reduce((sum, page) => sum + page.blocks.length, 0);
  }

  private countBlocksByType(project: Project, type: BlockType): number {
    return project.draft.pages.reduce(
      (pageSum, page) => pageSum + page.blocks.filter((block) => block.type === type).length,
      0,
    );
  }

  private compareUpdatedAtDesc(left: ProjectSummary, right: ProjectSummary): number {
    return Date.parse(right.project.updatedAt) - Date.parse(left.project.updatedAt);
  }

  private formatDate(value: string): string {
    const timestamp = Date.parse(value);

    if (Number.isNaN(timestamp)) {
      return 'Дата не указана';
    }

    return this.dateFormatter.format(new Date(timestamp));
  }
}
