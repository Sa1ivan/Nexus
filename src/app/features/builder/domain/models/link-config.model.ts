export type LinkKind = 'anchor' | 'internal' | 'external' | 'email' | 'phone';

export interface LinkConfig {
  readonly id: string;
  readonly label: string;
  readonly target: string;
  readonly kind: LinkKind;
  readonly openInNewTab: boolean;
}

export interface LinkConfigUpdate {
  readonly label?: string;
  readonly target?: string;
  readonly kind?: LinkKind;
  readonly openInNewTab?: boolean;
}
