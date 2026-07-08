import type { BlockConfig } from './block-config.model';
import type { LandingHeaderVariant } from './landing-wizard.model';
import type { LinkConfig, LinkConfigUpdate } from './link-config.model';

export interface HeaderBookingConfig {
  readonly dateLabel: string;
  readonly partySizeLabel: string;
  readonly action: LinkConfig;
}

export interface HeaderBookingUpdate {
  readonly dateLabel?: string;
  readonly partySizeLabel?: string;
  readonly action?: LinkConfigUpdate;
}

export interface SiteHeaderBlockConfig extends BlockConfig<'siteHeader'> {
  readonly variant: LandingHeaderVariant;
  readonly brandName: string;
  readonly navigationItems: readonly LinkConfig[];
  readonly cta: LinkConfig;
  readonly booking?: HeaderBookingConfig;
}

export interface SiteHeaderBlockUpdate {
  readonly variant?: LandingHeaderVariant;
  readonly brandName?: string;
  readonly navigationItems?: readonly LinkConfig[];
  readonly cta?: LinkConfigUpdate;
  readonly booking?: HeaderBookingUpdate;
}
