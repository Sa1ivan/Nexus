import type { SiteConfig } from './site-config.model';

export interface CreateProjectRequest {
  readonly siteConfig: SiteConfig;
}

export interface SaveDraftRequest {
  readonly projectId: string;
  readonly expectedDraftVersion: number;
  readonly siteConfig: SiteConfig;
}

export interface PublishProjectRequest {
  readonly projectId: string;
  readonly expectedDraftVersion: number;
  readonly siteConfig: SiteConfig;
}

export class ProjectVersionConflictError extends Error {
  constructor(
    readonly projectId: string,
    readonly expectedVersion: number,
    readonly actualVersion: number,
  ) {
    super('Project draft version conflict.');
  }
}
