export type ButtonVariant = 'filled' | 'outline' | 'ghost';

export interface ButtonAppearance {
  readonly variant: ButtonVariant;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderColor: string;
}

export type ButtonAppearanceUpdate = Partial<ButtonAppearance>;

export const DEFAULT_PRIMARY_BUTTON_APPEARANCE: ButtonAppearance = {
  variant: 'filled',
  backgroundColor: '#2563eb',
  textColor: '#ffffff',
  borderColor: '#2563eb',
};

export const DEFAULT_SECONDARY_BUTTON_APPEARANCE: ButtonAppearance = {
  variant: 'outline',
  backgroundColor: '#2563eb',
  textColor: '#111827',
  borderColor: '#2563eb',
};

export function resolveButtonAppearance(
  appearance: ButtonAppearance | undefined,
  fallback: ButtonAppearance,
): ButtonAppearance {
  return appearance ?? fallback;
}
