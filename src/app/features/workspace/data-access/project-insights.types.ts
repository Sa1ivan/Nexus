import type { BlockType, Project } from '../../builder/domain/models';

export type ProjectPublicationStatus = 'draft' | 'published';

export interface BlockTypeMeta {
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
