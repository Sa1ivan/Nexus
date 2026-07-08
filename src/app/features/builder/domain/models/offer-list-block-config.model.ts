import type { BlockConfig } from './block-config.model';
import type { LandingOfferListVariant } from './landing-wizard.model';
import type { LinkConfig, LinkConfigUpdate } from './link-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export interface OfferListItem {
  readonly title: string;
  readonly description: string;
  readonly meta: string;
  readonly price?: string;
  readonly badge?: string;
  readonly image?: MediaAsset;
  readonly cta?: LinkConfig;
}

export interface OfferListItemUpdate {
  readonly title?: string;
  readonly description?: string;
  readonly meta?: string;
  readonly price?: string;
  readonly badge?: string;
  readonly image?: MediaAssetUpdate | null;
  readonly cta?: LinkConfigUpdate | null;
}

export interface OfferListBlockConfig extends BlockConfig<'offerList'> {
  readonly variant: LandingOfferListVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly items: readonly OfferListItem[];
}

export interface OfferListBlockUpdate {
  readonly variant?: LandingOfferListVariant;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly items?: readonly OfferListItem[];
}
