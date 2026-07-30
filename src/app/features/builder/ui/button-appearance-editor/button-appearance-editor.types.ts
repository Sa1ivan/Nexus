import type { ButtonVariant } from '../../domain/models';

export type ButtonColorField = 'backgroundColor' | 'textColor' | 'borderColor';

export interface ButtonVariantOption {
  readonly value: ButtonVariant;
  readonly label: string;
}
