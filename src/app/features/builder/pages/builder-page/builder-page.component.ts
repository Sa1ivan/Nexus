import { CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  LANDING_ACCENT_OPTIONS,
  LANDING_DENSITY_OPTIONS,
  LANDING_FOOTER_OPTIONS,
  LANDING_FONT_OPTIONS,
  LANDING_HEADER_OPTIONS,
  LANDING_OFFER_LIST_OPTIONS,
  LANDING_TEMPLATE_STYLE_OPTIONS,
} from '../../data-access/landing-wizard-options';
import { DEFAULT_LANDING_DESIGN_SETTINGS, getLandingAccentValue } from '../../domain/models';
import {
  BLOCK_DEFINITIONS,
  BLOCK_PALETTE,
  createLinkFromText,
} from '../../domain/registry/block-registry';
import type {
  BlockType,
  HeroBlockStyles,
  HeroContentAlignment,
  LandingAccentColor,
  LandingDensity,
  LandingFontPairing,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingOfferListVariant,
  LandingTemplateStyle,
  LeadFormFieldType,
  PageBlockConfig,
} from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';
import { BlockRendererComponent } from '../../../preview/ui/block-renderer/block-renderer.component';

interface HeroAlignmentOption {
  readonly id: HeroContentAlignment;
  readonly label: string;
  readonly icon: string;
}

type CanvasMode = 'edit' | 'preview';
type CanvasViewport = 'desktop' | 'mobile';
type InspectorTab = 'content' | 'design' | 'behavior';
type MobilePanel = 'blocks' | 'canvas' | 'settings';
type HeroTextField = 'title' | 'subtitle' | 'buttonText' | 'buttonHref';
type HeroColorField = 'backgroundColor' | 'textColor' | 'buttonBackgroundColor' | 'buttonTextColor';
type HeaderTextField = 'brandName';
type OfferTextField = 'eyebrow' | 'title';
type OfferItemTextField =
  | 'title'
  | 'meta'
  | 'description'
  | 'price'
  | 'badge'
  | 'imageSrc'
  | 'imageAlt'
  | 'ctaLabel'
  | 'ctaTarget';
type FooterTextField = 'brandName';
type LeadFormTextField = 'title' | 'description' | 'submitText' | 'successMessage';
type LeadFieldTextField = 'label' | 'placeholder' | 'helpText';

@Component({
  selector: 'app-builder-page',
  standalone: true,
  imports: [
    BlockRendererComponent,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './builder-page.component.html',
  styleUrl: './builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderPageComponent implements OnInit {
  private readonly builderStore = inject(BuilderStore);
  private readonly route = inject(ActivatedRoute);

  readonly siteConfig = this.builderStore.siteConfig;
  readonly pages = this.builderStore.pages;
  readonly activePageSlug = this.builderStore.activePageSlug;
  readonly activePage = this.builderStore.activePage;
  readonly activeBlocks = this.builderStore.activeBlocks;
  readonly selectedBlock = this.builderStore.selectedBlock;
  readonly selectedBlockId = this.builderStore.selectedBlockId;
  readonly currentProject = this.builderStore.currentProject;
  readonly saveStatus = this.builderStore.saveStatus;
  readonly projectError = this.builderStore.projectError;
  readonly publishedUrl = this.builderStore.publishedUrl;
  readonly selectedDesign = computed(
    () => this.selectedBlock()?.design ?? DEFAULT_LANDING_DESIGN_SETTINGS,
  );
  readonly canvasMode = signal<CanvasMode>('edit');
  readonly canvasViewport = signal<CanvasViewport>('desktop');
  readonly inspectorTab = signal<InspectorTab>('content');
  readonly mobilePanel = signal<MobilePanel>('canvas');

  readonly blockPalette = BLOCK_PALETTE;
  readonly heroAlignmentOptions: readonly HeroAlignmentOption[] = [
    {
      id: 'left',
      label: 'Слева',
      icon: 'format_align_left',
    },
    {
      id: 'center',
      label: 'Центр',
      icon: 'format_align_center',
    },
    {
      id: 'right',
      label: 'Справа',
      icon: 'format_align_right',
    },
  ] as const;
  readonly accentOptions = LANDING_ACCENT_OPTIONS;
  readonly fontOptions = LANDING_FONT_OPTIONS;
  readonly densityOptions = LANDING_DENSITY_OPTIONS;
  readonly templateStyleOptions = LANDING_TEMPLATE_STYLE_OPTIONS;
  readonly headerOptions = LANDING_HEADER_OPTIONS;
  readonly offerListOptions = LANDING_OFFER_LIST_OPTIONS;
  readonly footerOptions = LANDING_FOOTER_OPTIONS;

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');

    if (projectId !== null) {
      this.builderStore.loadProject(projectId);
    }
  }

  selectPage(slug: string): void {
    this.builderStore.selectPage(slug);
  }

  selectBlock(blockId: string): void {
    this.builderStore.selectBlock(blockId);
  }

  addBlock(type: BlockType): void {
    this.builderStore.addBlock(type);
  }

  saveProject(): void {
    this.builderStore.saveCurrentProject();
  }

  publishProject(): void {
    this.builderStore.publishCurrentProject();
  }

  setCanvasMode(mode: CanvasMode): void {
    this.canvasMode.set(mode);
  }

  setCanvasViewport(viewport: CanvasViewport): void {
    this.canvasViewport.set(viewport);
  }

  setInspectorTab(tab: InspectorTab): void {
    this.inspectorTab.set(tab);
  }

  setMobilePanel(panel: MobilePanel): void {
    this.mobilePanel.set(panel);
  }

  duplicateBlock(blockId: string): void {
    this.builderStore.duplicateBlock(blockId);
  }

  removeBlock(blockId: string): void {
    this.builderStore.removeBlock(blockId);
  }

  moveBlock(blockId: string, direction: 'up' | 'down'): void {
    this.builderStore.moveBlock(blockId, direction);
  }

  dropBlock(event: CdkDragDrop<readonly PageBlockConfig[]>): void {
    const didReorder = this.builderStore.reorderActiveBlocks(
      event.previousIndex,
      event.currentIndex,
    );

    if (didReorder) {
      this.builderStore.selectBlock(event.item.data.id);
    }
  }

  updateSiteName(event: Event): void {
    this.builderStore.updateSiteName(this.readInputValue(event));
  }

  updateBlockAccent(blockId: string, accentColor: LandingAccentColor): void {
    this.builderStore.updateBlockDesign(blockId, { accentColor });
  }

  updateBlockFont(blockId: string, fontPairing: LandingFontPairing): void {
    this.builderStore.updateBlockDesign(blockId, { fontPairing });
  }

  updateBlockDensity(blockId: string, density: LandingDensity): void {
    this.builderStore.updateBlockDesign(blockId, { density });
  }

  updateBlockTemplateStyle(blockId: string, templateStyle: LandingTemplateStyle): void {
    this.builderStore.updateBlockDesign(blockId, { templateStyle });
  }

  updateHeroText(blockId: string, field: HeroTextField, event: Event): void {
    const value = this.readInputValue(event);

    switch (field) {
      case 'title':
        this.builderStore.updateHeroBlock(blockId, { title: value });
        return;
      case 'subtitle':
        this.builderStore.updateHeroBlock(blockId, { subtitle: value });
        return;
      case 'buttonText':
        this.builderStore.updateHeroBlock(blockId, { buttonText: value });
        return;
      case 'buttonHref':
        this.builderStore.updateHeroBlock(blockId, { buttonHref: value });
        return;
    }
  }

  updateHeroColor(blockId: string, field: HeroColorField, event: Event): void {
    const value = this.readInputValue(event);

    this.builderStore.updateHeroBlock(blockId, {
      styles: this.createHeroColorUpdate(field, value),
    });
  }

  updateHeroMinHeight(blockId: string, event: Event): void {
    this.builderStore.updateHeroBlock(blockId, {
      styles: {
        minHeight: this.readInputValue(event),
      },
    });
  }

  updateHeroAlignment(blockId: string, alignment: HeroContentAlignment): void {
    this.builderStore.updateHeroBlock(blockId, {
      styles: {
        alignment,
      },
    });
  }

  updateHeroMedia(blockId: string, field: 'src' | 'alt', event: Event): void {
    this.builderStore.updateHeroBlock(blockId, {
      media: {
        [field]: this.readInputValue(event),
      },
    });
  }

  updateHeroSecondaryButton(blockId: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateHeroBlock(blockId, {
      secondaryButton: {
        [field]: this.readInputValue(event),
      },
    });
  }

  updateHeaderText(blockId: string, field: HeaderTextField, event: Event): void {
    const value = this.readInputValue(event);

    switch (field) {
      case 'brandName':
        this.builderStore.updateSiteHeaderBlock(blockId, { brandName: value });
        return;
    }
  }

  updateHeaderCta(blockId: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateSiteHeaderBlock(blockId, {
      cta: {
        [field]: this.readInputValue(event),
      },
    });
  }

  updateHeaderBooking(
    blockId: string,
    field: 'dateLabel' | 'partySizeLabel' | 'actionLabel' | 'actionTarget',
    event: Event,
  ): void {
    const value = this.readInputValue(event);

    if (field === 'actionLabel') {
      this.builderStore.updateSiteHeaderBlock(blockId, { booking: { action: { label: value } } });
      return;
    }

    if (field === 'actionTarget') {
      this.builderStore.updateSiteHeaderBlock(blockId, { booking: { action: { target: value } } });
      return;
    }

    this.builderStore.updateSiteHeaderBlock(blockId, { booking: { [field]: value } });
  }

  updateHeaderNavigation(blockId: string, event: Event): void {
    this.builderStore.updateSiteHeaderBlock(blockId, {
      navigationItems: this.splitInlineList(this.readInputValue(event)).map((label, index) =>
        createLinkFromText(label, index),
      ),
    });
  }

  updateHeaderVariant(blockId: string, variant: LandingHeaderVariant): void {
    this.builderStore.updateSiteHeaderBlock(blockId, { variant });
  }

  updateOfferText(blockId: string, field: OfferTextField, event: Event): void {
    const value = this.readInputValue(event);

    switch (field) {
      case 'eyebrow':
        this.builderStore.updateOfferListBlock(blockId, { eyebrow: value });
        return;
      case 'title':
        this.builderStore.updateOfferListBlock(blockId, { title: value });
        return;
    }
  }

  updateOfferVariant(blockId: string, variant: LandingOfferListVariant): void {
    this.builderStore.updateOfferListBlock(blockId, { variant });
  }

  updateOfferItemText(
    blockId: string,
    itemIndex: number,
    field: OfferItemTextField,
    event: Event,
  ): void {
    const value = this.readInputValue(event);

    switch (field) {
      case 'title':
      case 'meta':
      case 'description':
      case 'price':
      case 'badge':
        this.builderStore.updateOfferListItem(blockId, itemIndex, { [field]: value });
        return;
      case 'imageSrc':
        this.builderStore.updateOfferListItem(blockId, itemIndex, { image: { src: value } });
        return;
      case 'imageAlt':
        this.builderStore.updateOfferListItem(blockId, itemIndex, { image: { alt: value } });
        return;
      case 'ctaLabel':
        this.builderStore.updateOfferListItem(blockId, itemIndex, { cta: { label: value } });
        return;
      case 'ctaTarget':
        this.builderStore.updateOfferListItem(blockId, itemIndex, { cta: { target: value } });
        return;
    }
  }

  addOfferItem(blockId: string): void {
    this.builderStore.addOfferListItem(blockId);
  }

  removeOfferItem(blockId: string, itemIndex: number): void {
    this.builderStore.removeOfferListItem(blockId, itemIndex);
  }

  updateFooterText(blockId: string, field: FooterTextField, event: Event): void {
    const value = this.readInputValue(event);

    switch (field) {
      case 'brandName':
        this.builderStore.updateSiteFooterBlock(blockId, { brandName: value });
        return;
    }
  }

  updateFooterCta(blockId: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateSiteFooterBlock(blockId, {
      cta: {
        [field]: this.readInputValue(event),
      },
    });
  }

  updateFooterContacts(blockId: string, event: Event): void {
    this.builderStore.updateSiteFooterBlock(blockId, {
      contactLines: this.splitMultilineList(this.readInputValue(event)),
    });
  }

  updateFooterLinks(blockId: string, event: Event): void {
    this.builderStore.updateSiteFooterBlock(blockId, {
      links: this.splitInlineList(this.readInputValue(event)).map((label, index) =>
        createLinkFromText(label, index),
      ),
    });
  }

  updateFooterMap(blockId: string, field: 'label' | 'address' | 'embedUrl', event: Event): void {
    this.builderStore.updateSiteFooterBlock(blockId, {
      map: {
        [field]: this.readInputValue(event),
      },
    });
  }

  updateFooterVariant(blockId: string, variant: LandingFooterVariant): void {
    this.builderStore.updateSiteFooterBlock(blockId, { variant });
  }

  updateLeadFormText(blockId: string, field: LeadFormTextField, event: Event): void {
    const value = this.readInputValue(event);

    switch (field) {
      case 'title':
        this.builderStore.updateLeadFormBlock(blockId, { title: value });
        return;
      case 'description':
        this.builderStore.updateLeadFormBlock(blockId, { description: value });
        return;
      case 'submitText':
        this.builderStore.updateLeadFormBlock(blockId, { submitText: value });
        return;
      case 'successMessage':
        this.builderStore.updateLeadFormBlock(blockId, { successMessage: value });
        return;
    }
  }

  updateLeadFieldText(
    blockId: string,
    fieldId: string,
    field: LeadFieldTextField,
    event: Event,
  ): void {
    this.builderStore.updateLeadFormField(blockId, fieldId, {
      [field]: this.readInputValue(event),
    });
  }

  updateLeadFieldType(blockId: string, fieldId: string, event: Event): void {
    this.builderStore.updateLeadFormField(blockId, fieldId, {
      type: this.readInputValue(event) as LeadFormFieldType,
    });
  }

  updateLeadFieldRequired(blockId: string, fieldId: string, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.builderStore.updateLeadFormField(blockId, fieldId, {
        required: target.checked,
      });
    }
  }

  addLeadField(blockId: string): void {
    this.builderStore.addLeadFormField(blockId);
  }

  removeLeadField(blockId: string, fieldId: string): void {
    this.builderStore.removeLeadFormField(blockId, fieldId);
  }

  getBlockIcon(type: BlockType): string {
    return BLOCK_DEFINITIONS[type].icon;
  }

  getBlockLabel(block: PageBlockConfig): string {
    switch (block.type) {
      case 'siteHeader':
        return block.brandName;
      case 'hero':
        return block.title;
      case 'offerList':
        return block.title;
      case 'siteFooter':
        return block.brandName;
      case 'leadForm':
        return block.title;
    }
  }

  getBlockTypeLabel(type: BlockType): string {
    return BLOCK_DEFINITIONS[type].label;
  }

  getAccentValue(accentColor: LandingAccentColor): string {
    return getLandingAccentValue(accentColor);
  }

  canMoveBlock(blockId: string, direction: 'up' | 'down'): boolean {
    const index = this.activeBlocks().findIndex((block) => block.id === blockId);

    if (index === -1) {
      return false;
    }

    return direction === 'up' ? index > 0 : index < this.activeBlocks().length - 1;
  }

  formatLinkLabels(items: readonly { readonly label: string }[]): string {
    return items.map((item) => item.label).join(', ');
  }

  formatMultilineList(items: readonly string[]): string {
    return items.join('\n');
  }

  private readInputValue(event: Event): string {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return target.value;
    }

    return '';
  }

  private splitInlineList(value: string): readonly string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private splitMultilineList(value: string): readonly string[] {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private createHeroColorUpdate(field: HeroColorField, value: string): Partial<HeroBlockStyles> {
    switch (field) {
      case 'backgroundColor':
        return { backgroundColor: value };
      case 'textColor':
        return { textColor: value };
      case 'buttonBackgroundColor':
        return { buttonBackgroundColor: value };
      case 'buttonTextColor':
        return { buttonTextColor: value };
    }
  }
}
