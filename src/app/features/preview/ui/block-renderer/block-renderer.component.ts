import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  DEFAULT_SITE_THEME,
  getLandingFontFamily,
  getReadableTextColor,
  resolveBlockAppearance,
} from '../../../builder/domain/models';
import type {
  CallToActionBlockConfig,
  ContentMediaBlockConfig,
  FaqBlockConfig,
  FeatureGridBlockConfig,
  GalleryBlockConfig,
  HeroBlockConfig,
  LeadFormBlockConfig,
  OfferListBlockConfig,
  PageBlockConfig,
  SiteFooterBlockConfig,
  SiteHeaderBlockConfig,
  SiteThemeConfig,
  TestimonialsBlockConfig,
} from '../../../builder/domain/models';
import { BookingSelectionService } from '../../data-access/booking-selection.service';
import { CallToActionBlockComponent } from '../call-to-action-block/call-to-action-block.component';
import { ContentMediaBlockComponent } from '../content-media-block/content-media-block.component';
import { FaqBlockComponent } from '../faq-block/faq-block.component';
import { FeatureGridBlockComponent } from '../feature-grid-block/feature-grid-block.component';
import { GalleryBlockComponent } from '../gallery-block/gallery-block.component';
import { HeroBlockComponent } from '../hero-block/hero-block.component';
import { LeadFormBlockComponent } from '../lead-form-block/lead-form-block.component';
import type { LeadFormSubmitEvent } from '../lead-form-block/lead-form-block.component';
import { OfferListBlockComponent } from '../offer-list-block/offer-list-block.component';
import { SiteFooterBlockComponent } from '../site-footer-block/site-footer-block.component';
import { SiteHeaderBlockComponent } from '../site-header-block/site-header-block.component';
import { TestimonialsBlockComponent } from '../testimonials-block/testimonials-block.component';
import type { LeadSubmissionEvent } from './block-renderer.types';
export type { LeadSubmissionEvent } from './block-renderer.types';

@Component({
  selector: 'app-block-renderer',
  standalone: true,
  imports: [
    CallToActionBlockComponent,
    ContentMediaBlockComponent,
    FaqBlockComponent,
    FeatureGridBlockComponent,
    GalleryBlockComponent,
    HeroBlockComponent,
    LeadFormBlockComponent,
    OfferListBlockComponent,
    SiteFooterBlockComponent,
    SiteHeaderBlockComponent,
    TestimonialsBlockComponent,
  ],
  providers: [BookingSelectionService],
  templateUrl: './block-renderer.component.html',
  styleUrl: './block-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockRendererComponent {
  readonly blocks = input.required<readonly PageBlockConfig[]>();
  readonly theme = input<SiteThemeConfig>(DEFAULT_SITE_THEME);
  readonly projectId = input<string | null>(null);
  readonly leadSubmit = output<LeadSubmissionEvent>();
  readonly fontFamily = computed(() => getLandingFontFamily(this.theme().fontPairing));
  readonly contentWidth = computed(() => this.resolveContentWidth(this.theme().contentWidth));
  readonly sectionSpacing = computed(() => this.resolveSpacing(this.theme().sectionSpacing));
  readonly buttonRadius = computed(() => {
    switch (this.theme().buttonShape) {
      case 'square':
        return '0px';
      case 'rounded':
        return `${Math.min(16, this.theme().radius)}px`;
      case 'pill':
        return '999px';
    }
  });

  isSiteHeaderBlock(block: PageBlockConfig): block is SiteHeaderBlockConfig {
    return block.type === 'siteHeader';
  }

  isHeroBlock(block: PageBlockConfig): block is HeroBlockConfig {
    return block.type === 'hero';
  }

  isContentMediaBlock(block: PageBlockConfig): block is ContentMediaBlockConfig {
    return block.type === 'contentMedia';
  }

  isFeatureGridBlock(block: PageBlockConfig): block is FeatureGridBlockConfig {
    return block.type === 'featureGrid';
  }

  isGalleryBlock(block: PageBlockConfig): block is GalleryBlockConfig {
    return block.type === 'gallery';
  }

  isTestimonialsBlock(block: PageBlockConfig): block is TestimonialsBlockConfig {
    return block.type === 'testimonials';
  }

  isFaqBlock(block: PageBlockConfig): block is FaqBlockConfig {
    return block.type === 'faq';
  }

  isCallToActionBlock(block: PageBlockConfig): block is CallToActionBlockConfig {
    return block.type === 'callToAction';
  }

  isOfferListBlock(block: PageBlockConfig): block is OfferListBlockConfig {
    return block.type === 'offerList';
  }

  isSiteFooterBlock(block: PageBlockConfig): block is SiteFooterBlockConfig {
    return block.type === 'siteFooter';
  }

  isLeadFormBlock(block: PageBlockConfig): block is LeadFormBlockConfig {
    return block.type === 'leadForm';
  }

  handleLeadSubmit(blockId: string, event: LeadFormSubmitEvent): void {
    const projectId = this.projectId();

    if (projectId === null) {
      event.complete(false);
      return;
    }

    this.leadSubmit.emit({
      request: {
        projectId,
        blockId,
        fields: event.fields,
      },
      complete: event.complete,
    });
  }

  blockBackground(block: PageBlockConfig): string {
    if (block.appearance?.backgroundColor !== undefined) {
      return block.appearance.backgroundColor;
    }

    if (block.type === 'hero') {
      return block.styles.backgroundColor;
    }

    if (block.type === 'siteFooter') {
      return '#111827';
    }

    return resolveBlockAppearance(this.theme(), block.appearance).backgroundColor;
  }

  blockText(block: PageBlockConfig): string {
    if (block.appearance?.textColor !== undefined) {
      return block.appearance.textColor;
    }

    if (block.type === 'hero') {
      return block.styles.textColor;
    }

    if (block.type === 'siteFooter') {
      return '#f8fafc';
    }

    return resolveBlockAppearance(this.theme(), block.appearance).textColor;
  }

  blockAccent(block: PageBlockConfig): string {
    return resolveBlockAppearance(this.theme(), block.appearance).accentColor;
  }

  blockAccentContrast(block: PageBlockConfig): string {
    return getReadableTextColor(this.blockAccent(block));
  }

  blockContentWidth(block: PageBlockConfig): string {
    return this.resolveContentWidth(
      resolveBlockAppearance(this.theme(), block.appearance).contentWidth,
    );
  }

  blockSpacing(block: PageBlockConfig): string {
    return this.resolveSpacing(resolveBlockAppearance(this.theme(), block.appearance).spacing);
  }

  blockRadius(block: PageBlockConfig): string {
    return `${resolveBlockAppearance(this.theme(), block.appearance).radius}px`;
  }

  blockFont(block: PageBlockConfig): string {
    return getLandingFontFamily(resolveBlockAppearance(this.theme(), block.appearance).fontPairing);
  }

  blockSpacingY(block: PageBlockConfig): string {
    switch (resolveBlockAppearance(this.theme(), block.appearance).spacing) {
      case 'compact':
        return '48px';
      case 'balanced':
        return '72px';
      case 'spacious':
        return '96px';
    }
  }

  private resolveContentWidth(value: SiteThemeConfig['contentWidth']): string {
    switch (value) {
      case 'narrow':
        return '760px';
      case 'wide':
        return '1120px';
      case 'full':
        return '1600px';
    }
  }

  private resolveSpacing(value: SiteThemeConfig['sectionSpacing']): string {
    switch (value) {
      case 'compact':
        return '48px clamp(18px, 4vw, 40px)';
      case 'balanced':
        return '72px clamp(18px, 4vw, 40px)';
      case 'spacious':
        return '96px clamp(18px, 4vw, 40px)';
    }
  }
}
