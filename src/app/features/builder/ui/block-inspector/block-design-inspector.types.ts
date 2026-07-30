import type { HeroButtonVariant } from '../../domain/models';

export type AppearanceColor = 'backgroundColor' | 'textColor' | 'accentColor';

export type HeroStyleField =
  | 'backgroundColor'
  | 'textColor'
  | 'buttonBackgroundColor'
  | 'buttonTextColor'
  | 'minHeight';

export interface HeroButtonVariantOption {
  readonly value: HeroButtonVariant;
  readonly label: string;
}
