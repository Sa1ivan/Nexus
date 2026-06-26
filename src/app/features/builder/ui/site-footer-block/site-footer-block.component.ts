import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingRadiusValue,
  getLandingSectionPaddingY,
} from '../../domain/models';
import type { SiteFooterBlockConfig } from '../../domain/models';

@Component({
  selector: 'app-site-footer-block',
  standalone: true,
  templateUrl: './site-footer-block.component.html',
  styleUrl: './site-footer-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterBlockComponent {
  readonly block = input.required<SiteFooterBlockConfig>();

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly accentColor = computed<string>(() => getLandingAccentValue(this.design().accentColor));
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly sectionPaddingY = computed<string>(() => getLandingSectionPaddingY(this.design().density));
}
