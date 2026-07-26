import type { MediaAsset } from './media-asset.model';

export interface SiteSeoConfig {
  readonly language: string;
  readonly favicon: MediaAsset | null;
}

export const DEFAULT_SITE_SEO: SiteSeoConfig = {
  language: 'ru',
  favicon: null,
};
