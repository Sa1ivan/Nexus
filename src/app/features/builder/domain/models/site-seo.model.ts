import type { MediaAsset } from './media-asset.model';

export interface SiteSeoConfig {
  readonly title: string;
  readonly description: string;
  readonly language: string;
  readonly socialImage: MediaAsset | null;
  readonly favicon: MediaAsset | null;
}

export const DEFAULT_SITE_SEO: SiteSeoConfig = {
  title: 'Nexus site',
  description: '',
  language: 'ru',
  socialImage: null,
  favicon: null,
};
