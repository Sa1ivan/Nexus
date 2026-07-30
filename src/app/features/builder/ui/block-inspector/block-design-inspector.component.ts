import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import {
  LANDING_ACCENT_OPTIONS,
  LANDING_DENSITY_OPTIONS,
  LANDING_FONT_OPTIONS,
  LANDING_TEMPLATE_STYLE_OPTIONS,
} from '../../data-access/landing-wizard-options';
import { DEFAULT_LANDING_DESIGN_SETTINGS, getLandingAccentValue } from '../../domain/models';
import type {
  ContentWidth,
  LandingAccentColor,
  LandingDensity,
  LandingFontPairing,
  LandingTemplateStyle,
  PageBlockConfig,
  SectionSpacing,
} from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { BuilderStore } from '../../stores/builder.store';
import type { AppearanceColor, HeroStyleField } from './block-design-inspector.types';
import { BlockButtonDesignInspectorComponent } from './block-button-design-inspector.component';

const CONTENT_WIDTHS: readonly ContentWidth[] = ['narrow', 'wide', 'full'];
const SECTION_SPACINGS: readonly SectionSpacing[] = ['compact', 'balanced', 'spacious'];
@Component({
  selector: 'app-block-design-inspector',
  standalone: true,
  imports: [BlockButtonDesignInspectorComponent],
  templateUrl: './block-design-inspector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockDesignInspectorComponent {
  private readonly builderStore = inject(BuilderStore);
  private readonly blockStore = inject(BuilderBlockStore);

  readonly block = input.required<PageBlockConfig>();
  readonly siteConfig = this.builderStore.siteConfig;
  readonly selectedDesign = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly accentOptions = LANDING_ACCENT_OPTIONS;
  readonly fontOptions = LANDING_FONT_OPTIONS;
  readonly densityOptions = LANDING_DENSITY_OPTIONS;
  readonly templateStyleOptions = LANDING_TEMPLATE_STYLE_OPTIONS;

  updateAppearanceColor(field: AppearanceColor, event: Event): void {
    this.builderStore.updateBlockAppearance(this.block().id, { [field]: this.readValue(event) });
  }

  updateAppearanceWidth(event: Event): void {
    const contentWidth = this.readOption(event, CONTENT_WIDTHS);

    if (contentWidth !== null) {
      this.builderStore.updateBlockAppearance(this.block().id, { contentWidth });
    }
  }

  updateAppearanceSpacing(event: Event): void {
    const spacing = this.readOption(event, SECTION_SPACINGS);

    if (spacing !== null) {
      this.builderStore.updateBlockAppearance(this.block().id, { spacing });
    }
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

  updateBlockFontSelection(event: Event): void {
    const option = this.readOption(
      event,
      this.fontOptions.map((item) => item.id),
    );

    if (option !== null) {
      this.updateBlockFont(option);
    }
  }

  updateBlockDensitySelection(event: Event): void {
    const option = this.readOption(
      event,
      this.densityOptions.map((item) => item.id),
    );

    if (option !== null) {
      this.updateBlockDensity(option);
    }
  }

  updateBlockTemplateStyleSelection(event: Event): void {
    const option = this.readOption(
      event,
      this.templateStyleOptions.map((item) => item.id),
    );

    if (option !== null) {
      this.updateBlockTemplateStyle(option);
    }
  }

  getAccentValue(accent: LandingAccentColor): string {
    return getLandingAccentValue(accent);
  }

  updateHeroStyle(field: HeroStyleField, event: Event): void {
    const block = this.block();

    if (block.type === 'hero') {
      this.blockStore.updateHeroBlock(block.id, {
        styles: { [field]: this.readValue(event) },
      });
    }
  }

  private updateBlockFont(fontPairing: LandingFontPairing): void {
    this.builderStore.updateBlockDesign(this.block().id, { fontPairing });
    this.builderStore.updateBlockAppearance(this.block().id, { fontPairing });
  }

  private updateBlockDensity(density: LandingDensity): void {
    this.builderStore.updateBlockDesign(this.block().id, { density });
    this.builderStore.updateBlockAppearance(this.block().id, { spacing: density });
  }

  private updateBlockTemplateStyle(templateStyle: LandingTemplateStyle): void {
    this.builderStore.updateBlockDesign(this.block().id, { templateStyle });
    this.builderStore.updateBlockAppearance(this.block().id, {
      radius: templateStyle === 'editorial' ? 2 : templateStyle === 'conversion' ? 14 : 8,
    });
  }

  private readOption<TValue extends string>(
    event: Event,
    options: readonly TValue[],
  ): TValue | null {
    const value = this.readValue(event);

    return options.find((option) => option === value) ?? null;
  }

  private readValue(event: Event): string {
    const target = event.target;

    return target instanceof HTMLInputElement || target instanceof HTMLSelectElement
      ? target.value
      : '';
  }

  private readNumber(event: Event): number {
    const value = Number(this.readValue(event));

    return Number.isFinite(value) ? value : 0;
  }
}
