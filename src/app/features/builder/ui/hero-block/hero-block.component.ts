import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingFontFamily,
  getLandingRadiusValue,
  getLandingSectionPaddingY,
} from '../../domain/models';
import type { HeroBlockConfig } from '../../domain/models';

@Component({
  selector: 'app-hero-block',
  standalone: true,
  templateUrl: './hero-block.component.html',
  styleUrl: './hero-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroBlockComponent {
  readonly block = input.required<HeroBlockConfig>();

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly sectionPaddingY = computed<string>(() => getLandingSectionPaddingY(this.design().density));
}
