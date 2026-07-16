import type { BlockConfig } from './block-config.model';
import type { MediaAsset } from './media-asset.model';

export type GalleryVariant = 'uniformGrid' | 'collage' | 'strip';

export interface GalleryItem {
  readonly id: string;
  readonly image: MediaAsset;
  readonly caption?: string;
}

export interface GalleryBlockConfig extends BlockConfig<'gallery'> {
  readonly variant: GalleryVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly GalleryItem[];
  readonly lightboxEnabled: boolean;
}

export interface GalleryBlockUpdate {
  readonly variant?: GalleryVariant;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly description?: string;
  readonly items?: readonly GalleryItem[];
  readonly lightboxEnabled?: boolean;
}

export type GalleryItemUpdate = Partial<Omit<GalleryItem, 'id'>>;
