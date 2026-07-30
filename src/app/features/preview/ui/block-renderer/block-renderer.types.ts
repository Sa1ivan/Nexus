import type { LeadSubmissionRequest } from '../../../builder/domain/models';

export interface LeadSubmissionEvent {
  readonly request: LeadSubmissionRequest;
  readonly complete: (saved: boolean) => void;
}
