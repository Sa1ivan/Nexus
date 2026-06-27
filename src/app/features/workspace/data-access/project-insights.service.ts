import { inject, Injectable } from '@angular/core';

import { ProjectPersistenceService } from '../../builder/data-access/project-persistence.service';
import type { BlockType, Project } from '../../builder/domain/models';

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

const BLOCK_TYPE_META: readonly BlockTypeMeta[] = [
  {
    type: 'siteHeader',
    label: 'Хедеры',
    icon: 'web_asset',
  },
  {
    type: 'hero',
    label: 'Hero',
    icon: 'auto_awesome',
  },
  {
    type: 'offerList',
    label: 'Предложения',
    icon: 'view_module',
  },
  {
    type: 'leadForm',
    label: 'Формы',
    icon: 'dynamic_form',
  },
  {
    type: 'siteFooter',
    label: 'Футеры',
    icon: 'call_to_action',
  },
] as const;

@Injectable({
  providedIn: 'root',
})
export class ProjectInsightsService {
  private readonly projectPersistence = inject(ProjectPersistenceService);
  private readonly dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  getMetrics(): WorkspaceMetrics {
    const projects = [...this.projectPersistence.listProjects()]
      .map((project) => this.createProjectSummary(project))
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

  getBlockDistribution(): readonly BlockDistributionItem[] {
    const projects = this.projectPersistence.listProjects();
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

  getProjectLeadStats(): readonly ProjectLeadStats[] {
    const metrics = this.getMetrics();

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

  private createProjectSummary(project: Project): ProjectSummary {
    const published = project.publishedReleaseId !== null;

    return {
      project,
      status: published ? 'published' : 'draft',
      pageCount: project.draft.pages.length,
      blockCount: this.countBlocks(project),
      releaseCount: project.releases.length,
      revisionCount: project.revisions.length,
      leadCount: this.projectPersistence.listLeads(project.id).length,
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
