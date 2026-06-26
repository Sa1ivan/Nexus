import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingRadiusValue,
} from '../../../domain/models';
import type {
  LandingDesignSettings,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingIndustry,
  LandingOfferListVariant,
  LandingTone,
} from '../../../domain/models';

@Component({
  selector: 'app-landing-wizard-preview',
  standalone: true,
  templateUrl: './landing-wizard-preview.component.html',
  styleUrl: './landing-wizard-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingWizardPreviewComponent {
  readonly previewCards = [0, 1, 2] as const;

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

  readonly accentColor = computed<string>(() => getLandingAccentValue(this.design().accentColor));
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
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
