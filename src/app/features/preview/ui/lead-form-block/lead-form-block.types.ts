export type LeadFormStatus = 'idle' | 'submitting' | 'success' | 'error' | 'unavailable';

export interface LeadFormSubmitEvent {
  readonly fields: Readonly<Record<string, string>>;
  readonly complete: (saved: boolean) => void;
}
