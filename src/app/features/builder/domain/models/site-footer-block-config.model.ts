import type { BlockConfig } from './block-config.model';
import type { LandingFooterVariant } from './landing-wizard.model';
import type { LinkConfig, LinkConfigUpdate } from './link-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export interface FooterMapConfig {
  readonly label: string;
  readonly address: string;
  readonly embedUrl: string;
}

export interface FooterMapUpdate {
  readonly label?: string;
  readonly address?: string;
  readonly embedUrl?: string;
}

export interface SiteFooterBlockConfig extends BlockConfig<'siteFooter'> {
  readonly inheritBusiness: boolean;
  readonly variant: LandingFooterVariant;
  readonly brandName: string;
  readonly logo?: MediaAsset;
  readonly cta: LinkConfig;
  readonly contactLines: readonly string[];
  readonly links: readonly LinkConfig[];
  readonly socialLinks?: readonly LinkConfig[];
  readonly map?: FooterMapConfig;
}

export interface SiteFooterBlockUpdate {
  readonly inheritBusiness?: boolean;
  readonly variant?: LandingFooterVariant;
  readonly brandName?: string;
  readonly logo?: MediaAssetUpdate | null;
  readonly cta?: LinkConfigUpdate;
  readonly contactLines?: readonly string[];
  readonly links?: readonly LinkConfig[];
  readonly socialLinks?: readonly LinkConfig[];
  readonly map?: FooterMapUpdate;
}
