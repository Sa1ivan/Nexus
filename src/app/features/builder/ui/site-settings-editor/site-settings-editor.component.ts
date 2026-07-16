import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type {
  ButtonShape,
  ContentWidth,
  LandingFontPairing,
  LinkConfig,
  LinkConfigUpdate,
  SectionSpacing,
  TypeScale,
} from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';
import { BlockItemActionsComponent } from '../block-inspector/block-item-actions.component';
import { MediaInputComponent } from '../media-input/media-input.component';

type SettingsTab = 'theme' | 'business' | 'seo';
type ThemeColorField =
  | 'pageBackground'
  | 'surfaceColor'
  | 'textColor'
  | 'mutedTextColor'
  | 'accentColor';
type BusinessTextField = 'brandName' | 'phone' | 'email' | 'address' | 'hours';
type SeoTextField = 'title' | 'description' | 'language';
type BusinessLinkCollection = 'messengers' | 'socialLinks';
type LinkTextField = 'label' | 'target';

@Component({
  selector: 'app-site-settings-editor',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule, MediaInputComponent],
  templateUrl: './site-settings-editor.component.html',
  styleUrl: './site-settings-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteSettingsEditorComponent {
  private readonly builderStore = inject(BuilderStore);
  private fallbackId = 0;

  readonly siteConfig = this.builderStore.siteConfig;
  readonly activeTab = signal<SettingsTab>('theme');

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  updateSiteName(event: Event): void {
    this.builderStore.updateSiteName(this.readValue(event));
  }

  updateThemeColor(field: ThemeColorField, event: Event): void {
    this.builderStore.updateSiteTheme({ [field]: this.readValue(event) });
  }

  updateThemeFont(event: Event): void {
    this.builderStore.updateSiteTheme({ fontPairing: this.readValue(event) as LandingFontPairing });
  }

  updateThemeScale(event: Event): void {
    this.builderStore.updateSiteTheme({ typeScale: this.readValue(event) as TypeScale });
  }

  updateThemeWidth(event: Event): void {
    this.builderStore.updateSiteTheme({ contentWidth: this.readValue(event) as ContentWidth });
  }

  updateThemeSpacing(event: Event): void {
    this.builderStore.updateSiteTheme({ sectionSpacing: this.readValue(event) as SectionSpacing });
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

  updateSeoMedia(kind: 'socialImage' | 'favicon', field: 'src' | 'alt', value: string): void {
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
    return target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
      ? target.value
      : '';
  }
}
