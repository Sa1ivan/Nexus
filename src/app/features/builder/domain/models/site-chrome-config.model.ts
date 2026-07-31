import type { SiteFooterBlockConfig } from './site-footer-block-config.model';
import type { SiteHeaderBlockConfig } from './site-header-block-config.model';

export interface SiteChromeConfig {
  readonly header: SiteHeaderBlockConfig;
  readonly footer: SiteFooterBlockConfig;
}
