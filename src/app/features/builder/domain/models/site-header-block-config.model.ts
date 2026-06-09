import type { BlockConfig } from './block-config.model';
import type { LandingHeaderVariant } from './landing-wizard.model';

export interface SiteHeaderBlockConfig extends BlockConfig<'siteHeader'> {
  readonly variant: LandingHeaderVariant;
  readonly brandName: string;
  readonly navigationItems: readonly string[];
  readonly ctaText: string;
}
