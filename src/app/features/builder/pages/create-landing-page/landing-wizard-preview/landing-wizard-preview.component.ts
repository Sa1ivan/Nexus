import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { buildLandingDraft } from '../../../data-access/landing-draft.factory';
import { DEFAULT_LANDING_DESIGN_SETTINGS } from '../../../domain/models';
import type {
  LandingDesignSettings,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingIndustry,
  LandingOfferListVariant,
  LandingTone,
  SiteConfig,
} from '../../../domain/models';
import { BlockRendererComponent } from '../../../../preview/ui/block-renderer/block-renderer.component';

@Component({
  selector: 'app-landing-wizard-preview',
  standalone: true,
  imports: [BlockRendererComponent],
  templateUrl: './landing-wizard-preview.component.html',
  styleUrl: './landing-wizard-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingWizardPreviewComponent {
  readonly brandName = input.required<string>();
  readonly offerName = input.required<string>();
  readonly title = input.required<string>();
  readonly stepLabel = input.required<string>();
  readonly industry = input<LandingIndustry>('product');
  readonly tone = input<LandingTone | null>(null);
  readonly header = input<LandingHeaderVariant>('centeredHero');
  readonly offerList = input<LandingOfferListVariant>('catalogGrid');
  readonly footer = input<LandingFooterVariant>('compactLegal');
  readonly design = input<LandingDesignSettings>(DEFAULT_LANDING_DESIGN_SETTINGS);

  readonly siteConfig = computed<SiteConfig>(() =>
    buildLandingDraft({
      industry: this.industry(),
      tone: this.tone() ?? 'minimal',
      header: this.header(),
      offerList: this.offerList(),
      footer: this.footer(),
      design: this.design(),
      brandName: this.brandName(),
      heroTitle: this.title(),
      heroSubtitle: this.offerName(),
      ctaText: this.ctaText(),
      ctaDestination: '#lead-form',
      contactEmail: 'hello@nexus.app',
      contactPhone: '+7 999 000-00-00',
      stepDesigns: {
        industry: this.design(),
        tone: this.design(),
        header: this.design(),
        offerList: this.design(),
        footer: this.design(),
        summary: this.design(),
      },
    }),
  );

  readonly ctaText = computed<string>(() => {
    switch (this.industry()) {
      case 'restaurant':
        return 'Бронь';
      case 'hotel':
        return 'Даты';
      case 'beauty':
        return 'Запись';
      case 'product':
        return 'Демо';
      case 'education':
        return 'Поток';
    }
  });
}
