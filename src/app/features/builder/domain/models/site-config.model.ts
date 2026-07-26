import type { PageConfig } from './page-config.model';
import type { SiteBusinessConfig } from './site-business.model';
import type { SiteSeoConfig } from './site-seo.model';
import type { SiteThemeConfig } from './site-theme.model';

export const SITE_CONFIG_SCHEMA_VERSION = 3;

export interface SiteConfig {
  readonly id: string;
  readonly schemaVersion: number;
  readonly name: string;
  readonly theme: SiteThemeConfig;
  readonly business: SiteBusinessConfig;
  readonly seo: SiteSeoConfig;
  readonly pages: readonly PageConfig[];
}
