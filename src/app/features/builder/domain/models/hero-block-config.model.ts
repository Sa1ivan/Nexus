import type { BlockConfig } from './block-config.model';
import type { ButtonAppearance, ButtonAppearanceUpdate } from './button-appearance.model';
import type { LinkConfig, LinkConfigUpdate } from './link-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export type HeroContentAlignment = 'left' | 'center' | 'right';

export interface HeroBlockStyles {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly minHeight: string;
  readonly alignment: HeroContentAlignment;
}

export interface HeroBlockConfig extends BlockConfig<'hero'> {
  readonly title: string;
  readonly subtitle: string;
  readonly buttonText: string;
  readonly buttonHref: string;
  readonly media?: MediaAsset;
  readonly primaryButtonAppearance?: ButtonAppearance;
  readonly secondaryButton?: LinkConfig;
  readonly styles: HeroBlockStyles;
}

export interface HeroBlockUpdate {
  readonly title?: string;
  readonly subtitle?: string;
  readonly buttonText?: string;
  readonly buttonHref?: string;
  readonly media?: MediaAssetUpdate | null;
  readonly primaryButtonAppearance?: ButtonAppearanceUpdate | null;
  readonly secondaryButton?: LinkConfigUpdate | null;
  readonly styles?: Partial<HeroBlockStyles>;
}
