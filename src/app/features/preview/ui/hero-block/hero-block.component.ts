import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { HeroBlockConfig } from '../../../builder/domain/models';
import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingFontFamily,
  getLandingRadiusValue,
  getLandingSectionPaddingY,
} from '../../../builder/domain/models';
import { LandingLinkDirective } from '../landing-link/landing-link.directive';
import type { HeroLayoutVariant } from './hero-block.types';

@Component({
  selector: 'app-hero-block',
  standalone: true,
  imports: [LandingLinkDirective],
  templateUrl: './hero-block.component.html',
  styleUrl: './hero-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroBlockComponent {
  readonly block = input.required<HeroBlockConfig>();

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly sectionPaddingY = computed<string>(() =>
    getLandingSectionPaddingY(this.design().density),
  );
  readonly layoutVariant = computed<HeroLayoutVariant>(() => {
    const block = this.block();

    if (!block.media) {
      return 'minimal';
    }

    return block.styles.alignment === 'center' ? 'cover' : 'split';
  });
  readonly mediaObjectPosition = computed(() => {
    const focalPoint = this.block().media?.focalPoint ?? { x: 50, y: 50 };

    return `${focalPoint.x}% ${focalPoint.y}%`;
  });
  readonly coverOverlay = computed(() =>
    this.hasLightText(this.block().styles.textColor)
      ? 'linear-gradient(180deg, rgba(10, 15, 25, 0.42), rgba(10, 15, 25, 0.76))'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.88))',
  );

  private hasLightText(color: string): boolean {
    const normalized = color.trim().match(/^#([\da-f]{6})$/i)?.[1];

    if (!normalized) {
      return true;
    }

    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);

    return red * 0.299 + green * 0.587 + blue * 0.114 > 150;
  }
}
