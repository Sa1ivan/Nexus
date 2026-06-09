import type { BlockConfig } from './block-config.model';
import type { LandingOfferListVariant } from './landing-wizard.model';

export interface OfferListItem {
  readonly title: string;
  readonly description: string;
  readonly meta: string;
}

export interface OfferListBlockConfig extends BlockConfig<'offerList'> {
  readonly variant: LandingOfferListVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly items: readonly OfferListItem[];
}
