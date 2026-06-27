import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingHeaderPaddingY,
  getLandingRadiusValue,
} from '../../../builder/domain/models';
import type { SiteHeaderBlockConfig } from '../../../builder/domain/models';

@Component({
  selector: 'app-site-header-block',
  standalone: true,
  templateUrl: './site-header-block.component.html',
  styleUrl: './site-header-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderBlockComponent {
  readonly block = input.required<SiteHeaderBlockConfig>();

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly accentColor = computed<string>(() => getLandingAccentValue(this.design().accentColor));
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly headerPaddingY = computed<string>(() => getLandingHeaderPaddingY(this.design().density));

  navigationHref(index: number): string {
    const anchors = ['#hero', '#offers', '#lead-form', '#contact'];

    return anchors[index % anchors.length];
  }
}
