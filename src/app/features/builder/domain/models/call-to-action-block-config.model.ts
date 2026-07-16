import type { BlockConfig } from './block-config.model';
import type { LinkConfig, LinkConfigUpdate } from './link-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export type CallToActionVariant = 'banner' | 'split' | 'cover';

export interface CallToActionBlockConfig extends BlockConfig<'callToAction'> {
  readonly variant: CallToActionVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly text: string;
  readonly primaryAction: LinkConfig;
  readonly secondaryAction?: LinkConfig;
  readonly media?: MediaAsset;
}

export interface CallToActionBlockUpdate {
  readonly variant?: CallToActionVariant;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly text?: string;
  readonly primaryAction?: LinkConfigUpdate;
  readonly secondaryAction?: LinkConfigUpdate | null;
  readonly media?: MediaAssetUpdate | null;
}
