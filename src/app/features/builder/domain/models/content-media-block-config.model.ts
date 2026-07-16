import type { BlockConfig } from './block-config.model';
import type { LinkConfig, LinkConfigUpdate } from './link-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export type ContentMediaVariant = 'textOnly' | 'mediaLeft' | 'mediaRight';

export interface ContentMediaBlockConfig extends BlockConfig<'contentMedia'> {
  readonly variant: ContentMediaVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly cta?: LinkConfig;
  readonly media?: MediaAsset;
}

export interface ContentMediaBlockUpdate {
  readonly variant?: ContentMediaVariant;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly body?: string;
  readonly cta?: LinkConfigUpdate | null;
  readonly media?: MediaAssetUpdate | null;
}
