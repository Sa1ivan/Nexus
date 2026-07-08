export type LinkKind = 'anchor' | 'internal' | 'external' | 'email' | 'phone';

export interface LinkConfig {
  readonly label: string;
  readonly target: string;
  readonly kind: LinkKind;
}

export interface LinkConfigUpdate {
  readonly label?: string;
  readonly target?: string;
  readonly kind?: LinkKind;
}
