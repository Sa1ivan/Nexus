import type { PageConfig } from './page-config.model';

export const SITE_CONFIG_SCHEMA_VERSION = 1;

export interface SiteConfig {
  readonly id: string;
  readonly schemaVersion: number;
  readonly name: string;
  readonly pages: readonly PageConfig[];
}
