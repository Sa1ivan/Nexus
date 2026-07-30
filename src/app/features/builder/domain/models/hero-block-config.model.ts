import type { BlockConfig } from './block-config.model';
import type { LinkConfig, LinkConfigUpdate } from './link-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export type HeroContentAlignment = 'left' | 'center' | 'right';
export type HeroButtonVariant = 'filled' | 'outline' | 'ghost';

export interface HeroBlockStyles {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly buttonVariant: HeroButtonVariant;
  readonly buttonBackgroundColor: string;
  readonly buttonTextColor: string;
  readonly minHeight: string;
  readonly alignment: HeroContentAlignment;
}

export interface HeroBlockConfig extends BlockConfig<'hero'> {
  readonly title: string;
  readonly subtitle: string;
  readonly buttonText: string;
  readonly buttonHref: string;
  readonly media?: MediaAsset;
  readonly secondaryButton?: LinkConfig;
  readonly styles: HeroBlockStyles;
}

export interface HeroBlockUpdate {
  readonly title?: string;
  readonly subtitle?: string;
  readonly buttonText?: string;
  readonly buttonHref?: string;
  readonly media?: MediaAssetUpdate | null;
  readonly secondaryButton?: LinkConfigUpdate | null;
  readonly styles?: Partial<HeroBlockStyles>;
}
