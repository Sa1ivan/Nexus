import type { MediaAsset } from './media-asset.model';

export interface PageSeoConfig {
  readonly title: string;
  readonly description: string;
  readonly socialImage: MediaAsset | null;
  readonly noIndex: boolean;
}
