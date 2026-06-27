import type { HeroBlockConfig } from './hero-block-config.model';
import type { LeadFormBlockConfig } from './lead-form-block-config.model';
import type { OfferListBlockConfig } from './offer-list-block-config.model';
import type { SiteFooterBlockConfig } from './site-footer-block-config.model';
import type { SiteHeaderBlockConfig } from './site-header-block-config.model';

export type PageBlockConfig =
  | HeroBlockConfig
  | SiteHeaderBlockConfig
  | OfferListBlockConfig
  | SiteFooterBlockConfig
  | LeadFormBlockConfig;

export type PageId = string;

export interface PageConfig {
  readonly id: PageId;
  readonly slug: string;
  readonly title: string;
  readonly blocks: readonly PageBlockConfig[];
}
