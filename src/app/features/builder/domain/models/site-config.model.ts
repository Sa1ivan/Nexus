import type { PageConfig } from './page-config.model';

export interface SiteConfig {
  readonly id: string;
  readonly name: string;
  readonly pages: readonly PageConfig[];
}
