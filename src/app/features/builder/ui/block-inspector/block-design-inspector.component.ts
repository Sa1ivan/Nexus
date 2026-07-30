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
import { SettingsSelectComponent } from '../settings-select/settings-select.component';
import type { SettingsSelectOption } from '../settings-select/settings-select.types';
import type { AppearanceColor, HeroStyleField } from './block-design-inspector.types';
import { BlockButtonDesignInspectorComponent } from './block-button-design-inspector.component';

const CONTENT_WIDTHS: readonly ContentWidth[] = ['narrow', 'wide', 'full'];
const SECTION_SPACINGS: readonly SectionSpacing[] = ['compact', 'balanced', 'spacious'];
const CONTENT_WIDTH_OPTIONS: readonly SettingsSelectOption[] = [
  { value: 'narrow', label: 'Узкая' },
  { value: 'wide', label: 'Широкая' },
  { value: 'full', label: 'На всю ширину' },
];
const SECTION_SPACING_OPTIONS: readonly SettingsSelectOption[] = [
  { value: 'compact', label: 'Компактные' },
  { value: 'balanced', label: 'Средние' },
  { value: 'spacious', label: 'Просторные' },
];

@Component({
  selector: 'app-block-design-inspector',
  standalone: true,
  imports: [BlockButtonDesignInspectorComponent, SettingsSelectComponent],
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
  readonly contentWidthOptions = CONTENT_WIDTH_OPTIONS;
  readonly sectionSpacingOptions = SECTION_SPACING_OPTIONS;
  readonly fontSelectOptions: readonly SettingsSelectOption[] = this.fontOptions.map((option) => ({
    value: option.id,
    label: option.title,
  }));
  readonly densitySelectOptions: readonly SettingsSelectOption[] = this.densityOptions.map(
    (option) => ({
      value: option.id,
      label: option.title,
    }),
  );
  readonly templateStyleSelectOptions: readonly SettingsSelectOption[] =
    this.templateStyleOptions.map((option) => ({
      value: option.id,
      label: option.title,
    }));

  updateAppearanceColor(field: AppearanceColor, event: Event): void {
    this.builderStore.updateBlockAppearance(this.block().id, { [field]: this.readValue(event) });
  }

  updateAppearanceWidth(value: string): void {
    const contentWidth = this.findOption(value, CONTENT_WIDTHS);

    if (contentWidth !== null) {
      this.builderStore.updateBlockAppearance(this.block().id, { contentWidth });
    }
  }

  updateAppearanceSpacing(value: string): void {
    const spacing = this.findOption(value, SECTION_SPACINGS);

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

  updateBlockFontSelection(value: string): void {
    const option = this.findOption(
      value,
      this.fontOptions.map((item) => item.id),
    );

    if (option !== null) {
      this.updateBlockFont(option);
    }
  }

  updateBlockDensitySelection(value: string): void {
    const option = this.findOption(
      value,
      this.densityOptions.map((item) => item.id),
    );

    if (option !== null) {
      this.updateBlockDensity(option);
    }
  }

  updateBlockTemplateStyleSelection(value: string): void {
    const option = this.findOption(
      value,
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

  private findOption<TValue extends string>(
    value: string,
    options: readonly TValue[],
  ): TValue | null {
    return options.find((option) => option === value) ?? null;
  }

  private readValue(event: Event): string {
    const target = event.target;

    return target instanceof HTMLInputElement ? target.value : '';
  }

  private readNumber(event: Event): number {
    const value = Number(this.readValue(event));

    return Number.isFinite(value) ? value : 0;
  }
}
