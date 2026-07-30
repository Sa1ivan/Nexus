import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LANDING_FONT_OPTIONS } from '../../data-access/landing-wizard-options';
import {
  formatLandingAccentRgb,
  isCustomAccentColor,
  parseLandingRgbColor,
} from '../../domain/models';
import type {
  ButtonShape,
  ContentWidth,
  LinkConfig,
  LinkConfigUpdate,
  SectionSpacing,
  TypeScale,
} from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';
import { BlockItemActionsComponent } from '../block-inspector/block-item-actions.component';
import { MediaInputComponent } from '../media-input/media-input.component';
import { SettingsSelectComponent } from '../settings-select/settings-select.component';
import type { SettingsSelectOption } from '../settings-select/settings-select.types';
import type {
  BusinessLinkCollection,
  BusinessTextField,
  LinkTextField,
  SeoTextField,
  SettingsTab,
  ThemeColorField,
} from './site-settings-editor.types';

const THEME_COLOR_OPTIONS: readonly {
  readonly field: ThemeColorField;
  readonly label: string;
}[] = [
  { field: 'pageBackground', label: 'Фон страницы' },
  { field: 'surfaceColor', label: 'Поверхности' },
  { field: 'textColor', label: 'Текст' },
  { field: 'mutedTextColor', label: 'Вторичный текст' },
  { field: 'accentColor', label: 'Акцент' },
];
const TYPE_SCALE_OPTIONS: readonly TypeScale[] = ['compact', 'balanced', 'display'];
const CONTENT_WIDTH_OPTIONS: readonly ContentWidth[] = ['narrow', 'wide', 'full'];
const SECTION_SPACING_OPTIONS: readonly SectionSpacing[] = ['compact', 'balanced', 'spacious'];
const TYPE_SCALE_SELECT_OPTIONS: readonly SettingsSelectOption[] = [
  { value: 'compact', label: 'Компактный' },
  { value: 'balanced', label: 'Сбалансированный' },
  { value: 'display', label: 'Выразительный' },
];
const CONTENT_WIDTH_SELECT_OPTIONS: readonly SettingsSelectOption[] = [
  { value: 'narrow', label: 'Узкая' },
  { value: 'wide', label: 'Широкая' },
  { value: 'full', label: 'На всю ширину' },
];
const SECTION_SPACING_SELECT_OPTIONS: readonly SettingsSelectOption[] = [
  { value: 'compact', label: 'Компактные' },
  { value: 'balanced', label: 'Средние' },
  { value: 'spacious', label: 'Просторные' },
];
const LANGUAGE_SELECT_OPTIONS: readonly SettingsSelectOption[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

@Component({
  selector: 'app-site-settings-editor',
  standalone: true,
  imports: [
    BlockItemActionsComponent,
    MatButtonModule,
    MatIconModule,
    MediaInputComponent,
    SettingsSelectComponent,
  ],
  templateUrl: './site-settings-editor.component.html',
  styleUrl: './site-settings-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteSettingsEditorComponent {
  private readonly builderStore = inject(BuilderStore);
  private fallbackId = 0;

  readonly siteConfig = this.builderStore.siteConfig;
  readonly activeTab = signal<SettingsTab>('theme');
  readonly themeColorOptions = THEME_COLOR_OPTIONS;
  readonly fontOptions = LANDING_FONT_OPTIONS;
  readonly fontSelectOptions: readonly SettingsSelectOption[] = this.fontOptions.map((option) => ({
    value: option.id,
    label: option.title,
  }));
  readonly typeScaleOptions = TYPE_SCALE_SELECT_OPTIONS;
  readonly contentWidthOptions = CONTENT_WIDTH_SELECT_OPTIONS;
  readonly sectionSpacingOptions = SECTION_SPACING_SELECT_OPTIONS;
  readonly languageOptions = LANGUAGE_SELECT_OPTIONS;

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  updateSiteName(event: Event): void {
    this.builderStore.updateSiteName(this.readValue(event));
  }

  updateThemeColor(field: ThemeColorField, event: Event): void {
    this.builderStore.updateSiteTheme({ [field]: this.readValue(event) });
  }

  updateThemeRgbColor(field: ThemeColorField, event: Event): void {
    const color = parseLandingRgbColor(this.readValue(event));

    if (color !== null) {
      this.builderStore.updateSiteTheme({ [field]: color });
    }
  }

  themeColor(field: ThemeColorField): string {
    return this.siteConfig().theme[field];
  }

  themeColorRgb(field: ThemeColorField): string {
    const color = this.themeColor(field);

    return isCustomAccentColor(color) ? formatLandingAccentRgb(color) : '';
  }

  updateThemeFont(value: string): void {
    const fontPairing = this.fontOptions.find((option) => option.id === value)?.id;

    if (fontPairing !== undefined) {
      this.builderStore.updateSiteTheme({ fontPairing });
    }
  }

  updateThemeScale(value: string): void {
    const typeScale = this.findAllowedValue(value, TYPE_SCALE_OPTIONS);

    if (typeScale !== undefined) {
      this.builderStore.updateSiteTheme({ typeScale });
    }
  }

  updateThemeWidth(value: string): void {
    const contentWidth = this.findAllowedValue(value, CONTENT_WIDTH_OPTIONS);

    if (contentWidth !== undefined) {
      this.builderStore.updateSiteTheme({ contentWidth });
    }
  }

  updateThemeSpacing(value: string): void {
    const sectionSpacing = this.findAllowedValue(value, SECTION_SPACING_OPTIONS);

    if (sectionSpacing !== undefined) {
      this.builderStore.updateSiteTheme({ sectionSpacing });
    }
  }

  updateThemeButtonShape(shape: ButtonShape): void {
    this.builderStore.updateSiteTheme({ buttonShape: shape });
  }

  updateThemeRadius(event: Event): void {
    const radius = Number(this.readValue(event));

    if (Number.isFinite(radius)) {
      this.builderStore.updateSiteTheme({ radius });
    }
  }

  updateBusinessText(field: BusinessTextField, event: Event): void {
    this.builderStore.updateSiteBusiness({ [field]: this.readValue(event) });
  }

  updateBusinessLogo(field: 'src' | 'alt', value: string): void {
    const logo = this.siteConfig().business.logo;

    if (field === 'src' && value === '') {
      this.builderStore.updateSiteBusiness({ logo: null });
      return;
    }

    this.builderStore.updateSiteBusiness({
      logo: {
        src: field === 'src' ? value : (logo?.src ?? ''),
        alt: field === 'alt' ? value : (logo?.alt ?? ''),
        focalPoint: logo?.focalPoint,
      },
    });
  }

  updateSeoText(field: SeoTextField, event: Event): void {
    this.builderStore.updateSiteSeo({ [field]: this.readValue(event) });
  }

  updateSeoLanguage(value: string): void {
    const language = this.findAllowedValue(value, ['ru', 'en'] as const);

    if (language !== undefined) {
      this.builderStore.updateSiteSeo({ language });
    }
  }

  updateSeoMedia(kind: 'favicon', field: 'src' | 'alt', value: string): void {
    const current = this.siteConfig().seo[kind];

    if (field === 'src' && value === '') {
      this.builderStore.updateSiteSeo({ [kind]: null });
      return;
    }

    this.builderStore.updateSiteSeo({
      [kind]: {
        src: field === 'src' ? value : (current?.src ?? ''),
        alt: field === 'alt' ? value : (current?.alt ?? ''),
        focalPoint: current?.focalPoint,
      },
    });
  }

  updateBusinessLink(
    collection: BusinessLinkCollection,
    linkId: string,
    field: LinkTextField,
    event: Event,
  ): void {
    this.patchBusinessLink(collection, linkId, { [field]: this.readValue(event) });
  }

  toggleBusinessLinkTarget(collection: BusinessLinkCollection, linkId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.patchBusinessLink(collection, linkId, { openInNewTab: target.checked });
    }
  }

  addBusinessLink(collection: BusinessLinkCollection): void {
    const label = collection === 'messengers' ? 'Мессенджер' : 'Соцсеть';
    const next: LinkConfig = {
      id: this.createId(collection),
      label,
      target: 'https://',
      kind: 'external',
      openInNewTab: true,
    };
    this.builderStore.updateSiteBusiness({
      [collection]: [...this.siteConfig().business[collection], next],
    });
  }

  duplicateBusinessLink(collection: BusinessLinkCollection, linkId: string): void {
    const items = this.siteConfig().business[collection];
    const index = items.findIndex((item) => item.id === linkId);
    const item = items[index];

    if (item === undefined) {
      return;
    }

    const duplicate: LinkConfig = { ...item, id: this.createId(collection) };
    this.builderStore.updateSiteBusiness({
      [collection]: [...items.slice(0, index + 1), duplicate, ...items.slice(index + 1)],
    });
  }

  moveBusinessLink(
    collection: BusinessLinkCollection,
    linkId: string,
    direction: 'up' | 'down',
  ): void {
    const items = this.siteConfig().business[collection];
    const index = items.findIndex((item) => item.id === linkId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
    this.builderStore.updateSiteBusiness({ [collection]: next });
  }

  removeBusinessLink(collection: BusinessLinkCollection, linkId: string): void {
    const items = this.siteConfig().business[collection];
    const next = items.filter((item) => item.id !== linkId);

    if (next.length !== items.length) {
      this.builderStore.updateSiteBusiness({ [collection]: next });
    }
  }

  private patchBusinessLink(
    collection: BusinessLinkCollection,
    linkId: string,
    update: LinkConfigUpdate,
  ): void {
    const items = this.siteConfig().business[collection];
    this.builderStore.updateSiteBusiness({
      [collection]: items.map((item) => (item.id === linkId ? { ...item, ...update } : item)),
    });
  }

  private createId(prefix: string): string {
    this.fallbackId += 1;
    return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${this.fallbackId}`;
  }

  private readValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target.value
      : '';
  }

  private findAllowedValue<TValue extends string>(
    value: string,
    options: readonly TValue[],
  ): TValue | undefined {
    return options.find((option) => option === value);
  }
}
