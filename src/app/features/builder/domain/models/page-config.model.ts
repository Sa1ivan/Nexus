import type { CallToActionBlockConfig } from './call-to-action-block-config.model';
import type { ContentMediaBlockConfig } from './content-media-block-config.model';
import type { FaqBlockConfig } from './faq-block-config.model';
import type { FeatureGridBlockConfig } from './feature-grid-block-config.model';
import type { GalleryBlockConfig } from './gallery-block-config.model';
import type { HeroBlockConfig } from './hero-block-config.model';
import type { LeadFormBlockConfig } from './lead-form-block-config.model';
import type { OfferListBlockConfig } from './offer-list-block-config.model';
import type { PageSeoConfig } from './page-seo.model';
import type { SiteFooterBlockConfig } from './site-footer-block-config.model';
import type { SiteHeaderBlockConfig } from './site-header-block-config.model';
import type { TestimonialsBlockConfig } from './testimonials-block-config.model';

export type PageBlockConfig =
  | HeroBlockConfig
  | SiteHeaderBlockConfig
  | ContentMediaBlockConfig
  | FeatureGridBlockConfig
  | OfferListBlockConfig
  | GalleryBlockConfig
  | TestimonialsBlockConfig
  | FaqBlockConfig
  | CallToActionBlockConfig
  | SiteFooterBlockConfig
  | LeadFormBlockConfig;

export type PageId = string;

export interface PageConfig {
  readonly id: PageId;
  readonly slug: string;
  readonly title: string;
  readonly seo: PageSeoConfig;
  readonly blocks: readonly PageBlockConfig[];
}
