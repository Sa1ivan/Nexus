import type { BlockConfig } from './block-config.model';
import type { LandingFooterVariant } from './landing-wizard.model';

export interface SiteFooterBlockConfig extends BlockConfig<'siteFooter'> {
  readonly variant: LandingFooterVariant;
  readonly brandName: string;
  readonly ctaText: string;
  readonly contactLines: readonly string[];
  readonly links: readonly string[];
}

export interface SiteFooterBlockUpdate {
  readonly variant?: LandingFooterVariant;
  readonly brandName?: string;
  readonly ctaText?: string;
  readonly contactLines?: readonly string[];
  readonly links?: readonly string[];
}
