import type { BlockConfig } from './block-config.model';
import type { LinkConfig } from './link-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export type FeatureGridVariant = 'cards' | 'editorialList' | 'numberedSteps';

export interface FeatureGridItem {
  readonly id: string;
  readonly icon?: string;
  readonly image?: MediaAsset;
  readonly title: string;
  readonly description: string;
  readonly link?: LinkConfig;
}

export interface FeatureGridBlockConfig extends BlockConfig<'featureGrid'> {
  readonly variant: FeatureGridVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly FeatureGridItem[];
}

export interface FeatureGridBlockUpdate {
  readonly variant?: FeatureGridVariant;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly description?: string;
  readonly items?: readonly FeatureGridItem[];
}

export interface FeatureGridItemUpdate {
  readonly icon?: string;
  readonly image?: MediaAssetUpdate | null;
  readonly title?: string;
  readonly description?: string;
  readonly link?: LinkConfig;
}
