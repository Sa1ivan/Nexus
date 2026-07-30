import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { OfferListBlockConfig } from '../../../builder/domain/models';
import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingRadiusValue,
  getLandingSectionPaddingY,
} from '../../../builder/domain/models';
import { ButtonAppearanceDirective } from '../button-appearance/button-appearance.directive';
import { LandingLinkDirective } from '../landing-link/landing-link.directive';

@Component({
  selector: 'app-offer-list-block',
  standalone: true,
  imports: [ButtonAppearanceDirective, LandingLinkDirective],
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
  readonly sectionPaddingY = computed<string>(() =>
    getLandingSectionPaddingY(this.design().density),
  );
}
