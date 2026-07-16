import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  LANDING_ACCENT_OPTIONS,
  LANDING_DENSITY_OPTIONS,
  LANDING_FONT_OPTIONS,
  LANDING_TEMPLATE_STYLE_OPTIONS,
} from '../../data-access/landing-wizard-options';
import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  type ContentMediaVariant,
  type ContentWidth,
  type FaqVariant,
  type FeatureGridVariant,
  type GalleryVariant,
  type LandingAccentColor,
  type LandingDensity,
  type LandingFontPairing,
  type LandingFooterVariant,
  type LandingHeaderVariant,
  type LandingOfferListVariant,
  type LandingTemplateStyle,
  type LeadFormFieldType,
  type LinkConfig,
  type LinkConfigUpdate,
  type PageBlockConfig,
  type SectionSpacing,
  type TestimonialsVariant,
  type CallToActionVariant,
} from '../../domain/models';
import { BLOCK_DEFINITIONS } from '../../domain/registry/block-registry';
import { BuilderStore } from '../../stores/builder.store';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { MediaInputComponent } from '../media-input/media-input.component';

type InspectorTab = 'content' | 'design' | 'behavior';
type AppearanceColor = 'backgroundColor' | 'textColor' | 'accentColor';

@Component({
  selector: 'app-block-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule, MediaInputComponent],
  templateUrl: './block-inspector.component.html',
  styleUrl: './block-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockInspectorComponent {
  private readonly builderStore = inject(BuilderStore);

  readonly block = input.required<PageBlockConfig>();
  readonly activeTab = signal<InspectorTab>('content');
  readonly siteConfig = this.builderStore.siteConfig;
  readonly activeBlocks = this.builderStore.activeBlocks;
  readonly selectedDesign = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly blockDefinition = computed(() => BLOCK_DEFINITIONS[this.block().type]);
  readonly accentOptions = LANDING_ACCENT_OPTIONS;
  readonly fontOptions = LANDING_FONT_OPTIONS;
  readonly densityOptions = LANDING_DENSITY_OPTIONS;
  readonly templateStyleOptions = LANDING_TEMPLATE_STYLE_OPTIONS;

  setTab(tab: InspectorTab): void {
    this.activeTab.set(tab);
  }

  updateBlockAnchor(event: Event): void {
    this.builderStore.updateBlockAnchor(this.block().id, this.readValue(event));
  }

  toggleBlockVisibility(): void {
    this.builderStore.toggleBlockVisibility(this.block().id);
  }

  updateAppearanceColor(field: AppearanceColor, event: Event): void {
    this.builderStore.updateBlockAppearance(this.block().id, { [field]: this.readValue(event) });
  }

  updateAppearanceWidth(event: Event): void {
    this.builderStore.updateBlockAppearance(this.block().id, {
      contentWidth: this.readValue(event) as ContentWidth,
    });
  }

  updateAppearanceSpacing(event: Event): void {
    this.builderStore.updateBlockAppearance(this.block().id, {
      spacing: this.readValue(event) as SectionSpacing,
    });
  }

  updateAppearanceRadius(event: Event): void {
    this.builderStore.updateBlockAppearance(this.block().id, { radius: this.readNumber(event) });
  }

  updateBlockAccent(accentColor: LandingAccentColor): void {
    this.builderStore.updateBlockDesign(this.block().id, { accentColor });
    this.builderStore.updateBlockAppearance(this.block().id, {
      accentColor: getLandingAccentValue(accentColor),
    });
  }

  updateBlockFont(fontPairing: LandingFontPairing): void {
    this.builderStore.updateBlockDesign(this.block().id, { fontPairing });
    this.builderStore.updateBlockAppearance(this.block().id, { fontPairing });
  }

  updateBlockDensity(density: LandingDensity): void {
    this.builderStore.updateBlockDesign(this.block().id, { density });
    this.builderStore.updateBlockAppearance(this.block().id, { spacing: density });
  }

  updateBlockTemplateStyle(templateStyle: LandingTemplateStyle): void {
    this.builderStore.updateBlockDesign(this.block().id, { templateStyle });
    this.builderStore.updateBlockAppearance(this.block().id, {
      radius: templateStyle === 'editorial' ? 2 : templateStyle === 'conversion' ? 14 : 8,
    });
  }

  getAccentValue(accent: LandingAccentColor): string {
    return getLandingAccentValue(accent);
  }

  updateVariant(value: string): void {
    const block = this.block();

    switch (block.type) {
      case 'siteHeader':
        this.builderStore.updateSiteHeaderBlock(block.id, {
          variant: value as LandingHeaderVariant,
        });
        return;
      case 'contentMedia':
        this.builderStore.updateContentMediaBlock(block.id, {
          variant: value as ContentMediaVariant,
        });
        return;
      case 'featureGrid':
        this.builderStore.updateFeatureGridBlock(block.id, {
          variant: value as FeatureGridVariant,
        });
        return;
      case 'offerList':
        this.builderStore.updateOfferListBlock(block.id, {
          variant: value as LandingOfferListVariant,
        });
        return;
      case 'gallery':
        this.builderStore.updateGalleryBlock(block.id, { variant: value as GalleryVariant });
        return;
      case 'testimonials':
        this.builderStore.updateTestimonialsBlock(block.id, {
          variant: value as TestimonialsVariant,
        });
        return;
      case 'faq':
        this.builderStore.updateFaqBlock(block.id, { variant: value as FaqVariant });
        return;
      case 'callToAction':
        this.builderStore.updateCallToActionBlock(block.id, {
          variant: value as CallToActionVariant,
        });
        return;
      case 'siteFooter':
        this.builderStore.updateSiteFooterBlock(block.id, {
          variant: value as LandingFooterVariant,
        });
        return;
      case 'hero':
      case 'leadForm':
        return;
    }
  }

  updateHeroText(field: 'title' | 'subtitle' | 'buttonText' | 'buttonHref', event: Event): void {
    this.builderStore.updateHeroBlock(this.block().id, { [field]: this.readValue(event) });
  }

  updateHeroMedia(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateHeroBlock(this.block().id, {
      media: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateHeroSecondary(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateHeroBlock(this.block().id, {
      secondaryButton: { [field]: this.readValue(event) },
    });
  }

  updateHeroStyle(
    field:
      | 'backgroundColor'
      | 'textColor'
      | 'buttonBackgroundColor'
      | 'buttonTextColor'
      | 'minHeight',
    event: Event,
  ): void {
    this.builderStore.updateHeroBlock(this.block().id, {
      styles: { [field]: this.readValue(event) },
    });
  }

  updateHeaderBrand(event: Event): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, { brandName: this.readValue(event) });
  }

  updateHeaderInheritance(event: Event): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, {
      inheritBusiness: this.readChecked(event),
    });
  }

  updateHeaderLogo(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, {
      logo: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateHeaderCta(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, {
      cta: { [field]: this.readValue(event) },
    });
  }

  updateHeaderNavigationItem(linkId: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateHeaderNavigationItem(this.block().id, linkId, {
      [field]: this.readValue(event),
    });
  }

  toggleHeaderNavigationTarget(linkId: string, event: Event): void {
    this.builderStore.updateHeaderNavigationItem(this.block().id, linkId, {
      openInNewTab: this.readChecked(event),
    });
  }

  addHeaderNavigationItem(): void {
    this.builderStore.addHeaderNavigationItem(this.block().id);
  }
  duplicateHeaderNavigationItem(id: string): void {
    this.builderStore.duplicateHeaderNavigationItem(this.block().id, id);
  }
  moveHeaderNavigationItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveHeaderNavigationItem(this.block().id, id, direction);
  }
  removeHeaderNavigationItem(id: string): void {
    this.builderStore.removeHeaderNavigationItem(this.block().id, id);
  }

  updateContentMediaText(field: 'eyebrow' | 'title' | 'body', event: Event): void {
    this.builderStore.updateContentMediaBlock(this.block().id, { [field]: this.readValue(event) });
  }

  updateContentMediaCta(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateContentMediaBlock(this.block().id, {
      cta: { [field]: this.readValue(event) },
    });
  }

  updateContentMediaAsset(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateContentMediaBlock(this.block().id, {
      media: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateFeatureText(field: 'eyebrow' | 'title' | 'description', event: Event): void {
    this.builderStore.updateFeatureGridBlock(this.block().id, { [field]: this.readValue(event) });
  }

  updateFeatureItem(itemId: string, field: 'icon' | 'title' | 'description', event: Event): void {
    this.builderStore.updateFeatureGridItem(this.block().id, itemId, {
      [field]: this.readValue(event),
    });
  }

  updateFeatureLink(
    itemId: string,
    current: LinkConfig | undefined,
    field: 'label' | 'target',
    event: Event,
  ): void {
    this.builderStore.updateFeatureGridItem(this.block().id, itemId, {
      link: this.patchLink(current, { [field]: this.readValue(event) }),
    });
  }

  updateFeatureImage(
    itemId: string,
    currentSrc: string,
    currentAlt: string,
    field: 'src' | 'alt',
    value: string,
  ): void {
    this.builderStore.updateFeatureGridItem(this.block().id, itemId, {
      image:
        value === '' && field === 'src'
          ? null
          : {
              src: field === 'src' ? value : currentSrc,
              alt: field === 'alt' ? value : currentAlt,
            },
    });
  }

  addFeatureItem(): void {
    this.builderStore.addFeatureGridItem(this.block().id);
  }
  duplicateFeatureItem(id: string): void {
    this.builderStore.duplicateFeatureGridItem(this.block().id, id);
  }
  moveFeatureItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFeatureGridItem(this.block().id, id, direction);
  }
  removeFeatureItem(id: string): void {
    this.builderStore.removeFeatureGridItem(this.block().id, id);
  }

  updateOfferText(field: 'eyebrow' | 'title', event: Event): void {
    this.builderStore.updateOfferListBlock(this.block().id, { [field]: this.readValue(event) });
  }

  updateOfferItemText(
    itemId: string,
    field: 'title' | 'description' | 'meta' | 'price' | 'badge',
    event: Event,
  ): void {
    this.builderStore.updateOfferListItem(this.block().id, itemId, {
      [field]: this.readValue(event),
    });
  }

  updateOfferImage(itemId: string, field: 'src' | 'alt', value: string): void {
    this.builderStore.updateOfferListItem(this.block().id, itemId, {
      image: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateOfferCta(itemId: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateOfferListItem(this.block().id, itemId, {
      cta: { [field]: this.readValue(event) },
    });
  }

  addOfferItem(): void {
    this.builderStore.addOfferListItem(this.block().id);
  }
  duplicateOfferItem(id: string): void {
    this.builderStore.duplicateOfferListItem(this.block().id, id);
  }
  moveOfferItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveOfferListItem(this.block().id, id, direction);
  }
  removeOfferItem(id: string): void {
    this.builderStore.removeOfferListItem(this.block().id, id);
  }

  updateGalleryText(field: 'eyebrow' | 'title' | 'description', event: Event): void {
    this.builderStore.updateGalleryBlock(this.block().id, { [field]: this.readValue(event) });
  }

  updateGalleryLightbox(event: Event): void {
    this.builderStore.updateGalleryBlock(this.block().id, {
      lightboxEnabled: this.readChecked(event),
    });
  }
  updateGalleryCaption(id: string, event: Event): void {
    this.builderStore.updateGalleryItem(this.block().id, id, { caption: this.readValue(event) });
  }
  updateGalleryImage(
    id: string,
    src: string,
    alt: string,
    field: 'src' | 'alt',
    value: string,
  ): void {
    this.builderStore.updateGalleryItem(this.block().id, id, {
      image: { src: field === 'src' ? value : src, alt: field === 'alt' ? value : alt },
    });
  }
  addGalleryItem(): void {
    this.builderStore.addGalleryItem(this.block().id);
  }
  duplicateGalleryItem(id: string): void {
    this.builderStore.duplicateGalleryItem(this.block().id, id);
  }
  moveGalleryItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveGalleryItem(this.block().id, id, direction);
  }
  removeGalleryItem(id: string): void {
    this.builderStore.removeGalleryItem(this.block().id, id);
  }

  updateTestimonialsText(field: 'eyebrow' | 'title', event: Event): void {
    this.builderStore.updateTestimonialsBlock(this.block().id, { [field]: this.readValue(event) });
  }
  updateTestimonialText(id: string, field: 'quote' | 'author' | 'role', event: Event): void {
    this.builderStore.updateTestimonialItem(this.block().id, id, {
      [field]: this.readValue(event),
    });
  }
  updateTestimonialRating(id: string, event: Event): void {
    this.builderStore.updateTestimonialItem(this.block().id, id, {
      rating: this.readNumber(event),
    });
  }
  updateTestimonialAvatar(
    id: string,
    src: string,
    alt: string,
    field: 'src' | 'alt',
    value: string,
  ): void {
    this.builderStore.updateTestimonialItem(this.block().id, id, {
      avatar:
        value === '' && field === 'src'
          ? null
          : { src: field === 'src' ? value : src, alt: field === 'alt' ? value : alt },
    });
  }
  addTestimonial(): void {
    this.builderStore.addTestimonialItem(this.block().id);
  }
  duplicateTestimonial(id: string): void {
    this.builderStore.duplicateTestimonialItem(this.block().id, id);
  }
  moveTestimonial(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveTestimonialItem(this.block().id, id, direction);
  }
  removeTestimonial(id: string): void {
    this.builderStore.removeTestimonialItem(this.block().id, id);
  }

  updateFaqText(field: 'eyebrow' | 'title' | 'description', event: Event): void {
    this.builderStore.updateFaqBlock(this.block().id, { [field]: this.readValue(event) });
  }
  updateFaqMultiple(event: Event): void {
    this.builderStore.updateFaqBlock(this.block().id, {
      allowMultipleOpen: this.readChecked(event),
    });
  }
  updateFaqItem(id: string, field: 'question' | 'answer', event: Event): void {
    this.builderStore.updateFaqItem(this.block().id, id, { [field]: this.readValue(event) });
  }
  updateFaqInitiallyOpen(id: string, event: Event): void {
    this.builderStore.updateFaqItem(this.block().id, id, {
      initiallyOpen: this.readChecked(event),
    });
  }
  addFaqItem(): void {
    this.builderStore.addFaqItem(this.block().id);
  }
  duplicateFaqItem(id: string): void {
    this.builderStore.duplicateFaqItem(this.block().id, id);
  }
  moveFaqItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFaqItem(this.block().id, id, direction);
  }
  removeFaqItem(id: string): void {
    this.builderStore.removeFaqItem(this.block().id, id);
  }

  updateCtaText(field: 'eyebrow' | 'title' | 'text', event: Event): void {
    this.builderStore.updateCallToActionBlock(this.block().id, { [field]: this.readValue(event) });
  }
  updateCtaLink(
    kind: 'primaryAction' | 'secondaryAction',
    field: 'label' | 'target',
    event: Event,
  ): void {
    this.builderStore.updateCallToActionBlock(this.block().id, {
      [kind]: { [field]: this.readValue(event) },
    });
  }
  updateCtaMedia(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateCallToActionBlock(this.block().id, {
      media: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateFooterBrand(event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, { brandName: this.readValue(event) });
  }
  updateFooterInheritance(event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, {
      inheritBusiness: this.readChecked(event),
    });
  }
  updateFooterCta(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, {
      cta: { [field]: this.readValue(event) },
    });
  }
  updateFooterContacts(event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, {
      contactLines: this.readValue(event)
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }
  updateFooterMap(field: 'label' | 'address' | 'embedUrl', event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, {
      map: { [field]: this.readValue(event) },
    });
  }
  updateFooterLink(id: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateFooterLink(this.block().id, id, { [field]: this.readValue(event) });
  }
  addFooterLink(): void {
    this.builderStore.addFooterLink(this.block().id);
  }
  duplicateFooterLink(id: string): void {
    this.builderStore.duplicateFooterLink(this.block().id, id);
  }
  moveFooterLink(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFooterLink(this.block().id, id, direction);
  }
  removeFooterLink(id: string): void {
    this.builderStore.removeFooterLink(this.block().id, id);
  }
  updateFooterSocial(id: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateFooterSocialLink(this.block().id, id, {
      [field]: this.readValue(event),
    });
  }
  addFooterSocial(): void {
    this.builderStore.addFooterSocialLink(this.block().id);
  }
  duplicateFooterSocial(id: string): void {
    this.builderStore.duplicateFooterSocialLink(this.block().id, id);
  }
  moveFooterSocial(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFooterSocialLink(this.block().id, id, direction);
  }
  removeFooterSocial(id: string): void {
    this.builderStore.removeFooterSocialLink(this.block().id, id);
  }

  updateLeadText(
    field: 'title' | 'description' | 'submitText' | 'successMessage',
    event: Event,
  ): void {
    this.builderStore.updateLeadFormBlock(this.block().id, { [field]: this.readValue(event) });
  }
  updateLeadField(id: string, field: 'label' | 'placeholder' | 'helpText', event: Event): void {
    this.builderStore.updateLeadFormField(this.block().id, id, { [field]: this.readValue(event) });
  }
  updateLeadFieldType(id: string, event: Event): void {
    this.builderStore.updateLeadFormField(this.block().id, id, {
      type: this.readValue(event) as LeadFormFieldType,
    });
  }
  updateLeadRequired(id: string, event: Event): void {
    this.builderStore.updateLeadFormField(this.block().id, id, {
      required: this.readChecked(event),
    });
  }
  addLeadField(): void {
    this.builderStore.addLeadFormField(this.block().id);
  }
  duplicateLeadField(id: string): void {
    this.builderStore.duplicateLeadFormField(this.block().id, id);
  }
  moveLeadField(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveLeadFormField(this.block().id, id, direction);
  }
  removeLeadField(id: string): void {
    this.builderStore.removeLeadFormField(this.block().id, id);
  }

  private patchLink(link: LinkConfig | undefined, update: LinkConfigUpdate): LinkConfig {
    return {
      id: link?.id ?? `inspector-link-${Date.now()}`,
      label: update.label ?? link?.label ?? 'Подробнее',
      target: update.target ?? link?.target ?? '#lead-form',
      kind: link?.kind ?? 'anchor',
      openInNewTab: link?.openInNewTab ?? false,
    };
  }

  private readValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
      ? target.value
      : '';
  }

  private readChecked(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }

  private readNumber(event: Event): number {
    const value = Number(this.readValue(event));
    return Number.isFinite(value) ? value : 0;
  }
}
