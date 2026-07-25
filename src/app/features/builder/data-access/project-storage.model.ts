import type { LeadSubmission, Project } from '../domain/models';

export interface ProjectStorageState {
  readonly projects: readonly Project[];
  readonly leads: readonly LeadSubmission[];
  readonly activeProjectId: string | null;
}
