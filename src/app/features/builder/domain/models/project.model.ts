import type { SiteConfig } from './site-config.model';

export type ProjectSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
export type LeadSubmissionStatus = 'stored' | 'failed';

export interface DraftRevision {
  readonly id: string;
  readonly version: number;
  readonly siteConfig: SiteConfig;
  readonly createdAt: string;
}

export interface PublishedRelease {
  readonly id: string;
  readonly version: number;
  readonly siteConfig: SiteConfig;
  readonly publishedAt: string;
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly draft: SiteConfig;
  readonly draftVersion: number;
  readonly publishedReleaseId: string | null;
  readonly releases: readonly PublishedRelease[];
  readonly revisions: readonly DraftRevision[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LeadSubmission {
  readonly id: string;
  readonly projectId: string;
  readonly blockId: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly status: LeadSubmissionStatus;
  readonly createdAt: string;
}

export interface LeadSubmissionRequest {
  readonly projectId: string;
  readonly blockId: string;
  readonly fields: Readonly<Record<string, string>>;
}
