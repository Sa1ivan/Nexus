export interface ContactChannel {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly icon: string;
}

export type ContactFormStatus = 'idle' | 'sent';
