import type { ButtonAppearance, ButtonAppearanceUpdate } from './button-appearance.model';

export type LinkKind = 'anchor' | 'internal' | 'external' | 'email' | 'phone';

export interface LinkConfig {
  readonly id: string;
  readonly label: string;
  readonly target: string;
  readonly kind: LinkKind;
  readonly openInNewTab: boolean;
  readonly appearance?: ButtonAppearance;
}

export interface LinkConfigUpdate {
  readonly label?: string;
  readonly target?: string;
  readonly kind?: LinkKind;
  readonly openInNewTab?: boolean;
  readonly appearance?: ButtonAppearanceUpdate | null;
}
