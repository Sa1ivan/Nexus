import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingRadiusValue,
  getLandingSectionPaddingY,
} from '../../domain/models';
import type { OfferListBlockConfig } from '../../domain/models';

@Component({
  selector: 'app-offer-list-block',
  standalone: true,
  templateUrl: './offer-list-block.component.html',
  styleUrl: './offer-list-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferListBlockComponent {
  readonly block = input.required<OfferListBlockConfig>();

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly accentColor = computed<string>(() => getLandingAccentValue(this.design().accentColor));
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly sectionPaddingY = computed<string>(() => getLandingSectionPaddingY(this.design().density));
}
