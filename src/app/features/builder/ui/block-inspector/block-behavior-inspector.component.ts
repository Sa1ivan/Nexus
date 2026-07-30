import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type {
  CallToActionVariant,
  ContentMediaVariant,
  FaqVariant,
  FeatureGridVariant,
  GalleryVariant,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingOfferListVariant,
  PageBlockConfig,
  TestimonialsVariant,
} from '../../domain/models';
import { BLOCK_DEFINITIONS } from '../../domain/registry/block-registry';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { BuilderStore } from '../../stores/builder.store';
import type { FooterMapField } from './block-behavior-inspector.types';

const HEADER_VARIANTS: readonly LandingHeaderVariant[] = [
  'centeredHero',
  'splitMedia',
  'reservationBar',
  'editorial',
  'burgerMenu',
  'stretchedNav',
];
const CONTENT_MEDIA_VARIANTS: readonly ContentMediaVariant[] = [
  'textOnly',
  'mediaLeft',
  'mediaRight',
];
const FEATURE_GRID_VARIANTS: readonly FeatureGridVariant[] = [
  'cards',
  'editorialList',
  'numberedSteps',
];
const OFFER_LIST_VARIANTS: readonly LandingOfferListVariant[] = [
  'menuGrid',
  'roomCards',
  'pricingTable',
  'catalogGrid',
];
const GALLERY_VARIANTS: readonly GalleryVariant[] = ['uniformGrid', 'collage', 'strip'];
const TESTIMONIAL_VARIANTS: readonly TestimonialsVariant[] = [
  'cards',
  'featuredQuote',
  'compactList',
];
const FAQ_VARIANTS: readonly FaqVariant[] = ['borderedAccordion', 'separatedList', 'twoColumns'];
const CTA_VARIANTS: readonly CallToActionVariant[] = ['banner', 'split', 'cover'];
const FOOTER_VARIANTS: readonly LandingFooterVariant[] = [
  'contactMap',
  'compactLegal',
  'socialLead',
  'bookingFooter',
];

@Component({
  selector: 'app-block-behavior-inspector',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './block-behavior-inspector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockBehaviorInspectorComponent {
  private readonly builderStore = inject(BuilderStore);
  private readonly blockStore = inject(BuilderBlockStore);

  readonly block = input.required<PageBlockConfig>();
  readonly blockDefinition = computed(() => BLOCK_DEFINITIONS[this.block().type]);
  readonly selectedVariant = computed(() => {
    const block = this.block();

    return 'variant' in block ? block.variant : null;
  });

  updateBlockAnchor(event: Event): void {
    this.builderStore.updateBlockAnchor(this.block().id, this.readValue(event));
  }

  toggleBlockVisibility(): void {
    this.builderStore.toggleBlockVisibility(this.block().id);
  }

  updateVariant(value: string): void {
    const block = this.block();

    switch (block.type) {
      case 'siteHeader': {
        const variant = this.findOption(value, HEADER_VARIANTS);
        if (variant !== null) this.blockStore.updateSiteHeaderBlock(block.id, { variant });
        return;
      }
      case 'contentMedia': {
        const variant = this.findOption(value, CONTENT_MEDIA_VARIANTS);
        if (variant !== null) this.blockStore.updateContentMediaBlock(block.id, { variant });
        return;
      }
      case 'featureGrid': {
        const variant = this.findOption(value, FEATURE_GRID_VARIANTS);
        if (variant !== null) this.blockStore.updateFeatureGridBlock(block.id, { variant });
        return;
      }
      case 'offerList': {
        const variant = this.findOption(value, OFFER_LIST_VARIANTS);
        if (variant !== null) this.blockStore.updateOfferListBlock(block.id, { variant });
        return;
      }
      case 'gallery': {
        const variant = this.findOption(value, GALLERY_VARIANTS);
        if (variant !== null) this.blockStore.updateGalleryBlock(block.id, { variant });
        return;
      }
      case 'testimonials': {
        const variant = this.findOption(value, TESTIMONIAL_VARIANTS);
        if (variant !== null) this.blockStore.updateTestimonialsBlock(block.id, { variant });
        return;
      }
      case 'faq': {
        const variant = this.findOption(value, FAQ_VARIANTS);
        if (variant !== null) this.blockStore.updateFaqBlock(block.id, { variant });
        return;
      }
      case 'callToAction': {
        const variant = this.findOption(value, CTA_VARIANTS);
        if (variant !== null) this.blockStore.updateCallToActionBlock(block.id, { variant });
        return;
      }
      case 'siteFooter': {
        const variant = this.findOption(value, FOOTER_VARIANTS);
        if (variant !== null) this.blockStore.updateSiteFooterBlock(block.id, { variant });
        return;
      }
      case 'hero':
      case 'leadForm':
        return;
    }
  }

  updateGalleryLightbox(event: Event): void {
    const block = this.block();

    if (block.type === 'gallery') {
      this.blockStore.updateGalleryBlock(block.id, {
        lightboxEnabled: this.readChecked(event),
      });
    }
  }

  updateFaqMultiple(event: Event): void {
    const block = this.block();

    if (block.type === 'faq') {
      this.blockStore.updateFaqBlock(block.id, {
        allowMultipleOpen: this.readChecked(event),
      });
    }
  }

  updateFooterMap(field: FooterMapField, event: Event): void {
    const block = this.block();

    if (block.type === 'siteFooter') {
      this.blockStore.updateSiteFooterBlock(block.id, {
        map: { [field]: this.readValue(event) },
      });
    }
  }

  private findOption<TValue extends string>(
    value: string,
    options: readonly TValue[],
  ): TValue | null {
    return options.find((option) => option === value) ?? null;
  }

  private readValue(event: Event): string {
    const target = event.target;

    return target instanceof HTMLInputElement ? target.value : '';
  }

  private readChecked(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }
}
