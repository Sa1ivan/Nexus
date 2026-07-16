import type { BlockConfig } from './block-config.model';
import type { MediaAsset, MediaAssetUpdate } from './media-asset.model';

export type TestimonialsVariant = 'cards' | 'featuredQuote' | 'compactList';

export interface TestimonialItem {
  readonly id: string;
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly avatar?: MediaAsset;
  readonly rating: number;
}

export interface TestimonialsBlockConfig extends BlockConfig<'testimonials'> {
  readonly variant: TestimonialsVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly items: readonly TestimonialItem[];
}

export interface TestimonialsBlockUpdate {
  readonly variant?: TestimonialsVariant;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly items?: readonly TestimonialItem[];
}

export interface TestimonialItemUpdate {
  readonly quote?: string;
  readonly author?: string;
  readonly role?: string;
  readonly avatar?: MediaAssetUpdate | null;
  readonly rating?: number;
}
