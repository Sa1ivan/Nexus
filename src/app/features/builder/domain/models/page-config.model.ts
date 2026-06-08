import type { HeroBlockConfig } from './hero-block-config.model';

export type PageBlockConfig = HeroBlockConfig;

export interface PageConfig {
  readonly slug: string;
  readonly title: string;
  readonly blocks: readonly PageBlockConfig[];
}
