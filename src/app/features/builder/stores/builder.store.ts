import { computed, inject, Injectable, signal } from '@angular/core';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import { buildLandingDraft } from '../data-access/landing-draft.factory';
import { ProjectPersistenceService } from '../data-access/project-persistence.service';
import {
  DEFAULT_BLOCK_APPEARANCE,
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
} from '../domain/models';
import {
  cloneRegisteredBlock,
  createDefaultBlock as createRegisteredDefaultBlock,
  createDefaultBooking,
  createExternalLink,
  createLink,
  createMapSearchUrl,
  normalizeLinkTarget,
} from '../domain/registry/block-registry';
import {
  duplicateCollectionItem,
  moveCollectionItem,
  removeCollectionItem,
} from '../domain/utils/collection-update';
import { normalizeAnchor } from '../domain/utils/builder-ids';
import type {
  BlockAppearanceOverrides,
  BlockType,
  CallToActionBlockUpdate,
  CompleteLandingWizardSelection,
  ContentMediaBlockUpdate,
  FaqBlockUpdate,
  FaqItemUpdate,
  FeatureGridBlockUpdate,
  FeatureGridItemUpdate,
  FooterMapConfig,
  HeaderBookingConfig,
  HeroBlockStyles,
  HeroBlockUpdate,
  GalleryBlockUpdate,
  GalleryItemUpdate,
  LandingDesignSettings,
  LeadFormBlockUpdate,
  LeadFormFieldConfig,
  LinkConfig,
  LinkConfigUpdate,
  MediaAsset,
  MediaAssetUpdate,
  OfferListBlockUpdate,
  OfferListItemUpdate,
  PageBlockConfig,
  PageConfig,
  Project,
  ProjectSaveStatus,
  SiteBusinessConfig,
  SiteConfig,
  SiteFooterBlockUpdate,
  SiteHeaderBlockUpdate,
  SiteSeoConfig,
  SiteThemeConfig,
  TestimonialItemUpdate,
  TestimonialsBlockUpdate,
} from '../domain/models';

type MoveDirection = 'up' | 'down';
type FooterLinkCollection = 'links' | 'socialLinks';

const HISTORY_LIMIT = 50;

@Injectable({
  providedIn: 'root',
})
export class BuilderStore {
  private readonly projectPersistence = inject(ProjectPersistenceService);

  private readonly currentProjectSignal = signal<Project | null>(null);
  private readonly siteConfigSignal = signal<SiteConfig>(DEFAULT_SITE_CONFIG);
  private readonly activePageSlugSignal = signal<string>(DEFAULT_SITE_CONFIG.pages[0]?.slug ?? '');
  private readonly selectedBlockIdSignal = signal<string | null>(
    DEFAULT_SITE_CONFIG.pages[0]?.blocks[0]?.id ?? null,
  );
  private readonly saveStatusSignal = signal<ProjectSaveStatus>('idle');
  private readonly projectErrorSignal = signal<string | null>(null);
  private readonly undoHistorySignal = signal<readonly SiteConfig[]>([]);
  private readonly redoHistorySignal = signal<readonly SiteConfig[]>([]);
  private fallbackElementId = 0;

  readonly currentProject = computed<Project | null>(() => this.currentProjectSignal());
  readonly saveStatus = computed<ProjectSaveStatus>(() => this.saveStatusSignal());
  readonly projectError = computed<string | null>(() => this.projectErrorSignal());
  readonly siteConfig = computed<SiteConfig>(() => this.siteConfigSignal());
  readonly pages = computed<readonly PageConfig[]>(() => this.siteConfig().pages);
  readonly activePageSlug = computed<string>(() => this.activePageSlugSignal());
  readonly selectedBlockId = computed<string | null>(() => this.selectedBlockIdSignal());
  readonly canUndo = computed<boolean>(() => this.undoHistorySignal().length > 0);
  readonly canRedo = computed<boolean>(() => this.redoHistorySignal().length > 0);
  readonly publishedUrl = computed<string | null>(() => {
    const project = this.currentProject();

    if (project?.publishedReleaseId === null || project === null) {
      return null;
    }

    return `/p/${project.id}`;
  });
  readonly activePage = computed<PageConfig | null>(() => {
    const activeSlug = this.activePageSlug();

    return this.pages().find((page) => page.slug === activeSlug) ?? null;
  });
  readonly activeBlocks = computed<readonly PageBlockConfig[]>(
    () => this.activePage()?.blocks ?? [],
  );
  readonly selectedBlock = computed<PageBlockConfig | null>(() => {
    const blocks = this.activeBlocks();
    const selectedBlockId = this.selectedBlockId();

    return blocks.find((block) => block.id === selectedBlockId) ?? blocks[0] ?? null;
  });

  constructor() {
    const activeProject = this.projectPersistence.getActiveProject();

    if (activeProject !== null) {
      this.hydrateProject(activeProject, 'saved');
    }
  }

  selectPage(slug: string): boolean {
    const page = this.pages().find((pageConfig) => pageConfig.slug === slug);

    if (page === undefined) {
      return false;
    }

    this.activePageSlugSignal.set(slug);
    this.selectedBlockIdSignal.set(page.blocks[0]?.id ?? null);

    return true;
  }

  selectBlock(blockId: string): boolean {
    const blockExists = this.activeBlocks().some((block) => block.id === blockId);

    if (!blockExists) {
      return false;
    }

    this.selectedBlockIdSignal.set(blockId);

    return true;
  }

  loadProject(projectId: string): boolean {
    const project = this.projectPersistence.getProject(projectId);

    if (project === null) {
      this.projectErrorSignal.set('Проект не найден.');
      return false;
    }

    this.hydrateProject(project, 'saved');
    this.projectPersistence.setActiveProject(project.id);

    return true;
  }

  saveCurrentProject(): boolean {
    this.saveStatusSignal.set('saving');
    this.projectErrorSignal.set(null);

    try {
      const currentProject = this.currentProject();
      const savedProject =
        currentProject === null
          ? this.projectPersistence.createProject(this.siteConfig())
          : this.projectPersistence.saveDraft(currentProject, this.siteConfig());

      this.hydrateProject(savedProject, 'saved');

      return true;
    } catch (error) {
      this.projectErrorSignal.set(this.readErrorMessage(error));
      this.saveStatusSignal.set('error');

      return false;
    }
  }

  publishCurrentProject(): boolean {
    this.saveStatusSignal.set('saving');
    this.projectErrorSignal.set(null);

    try {
      const baseProject =
        this.currentProject() ?? this.projectPersistence.createProject(this.siteConfig());
      const publishedProject = this.projectPersistence.publishProject(
        baseProject,
        this.siteConfig(),
      );

      this.hydrateProject(publishedProject, 'saved');

      return true;
    } catch (error) {
      this.projectErrorSignal.set(this.readErrorMessage(error));
      this.saveStatusSignal.set('error');

      return false;
    }
  }

  updateSiteName(name: string): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    const current = this.siteConfig();

    return normalizedName === current.name
      ? false
      : this.commitSiteConfig({
          ...current,
          name: normalizedName,
        });
  }

  updateSiteTheme(update: Partial<SiteThemeConfig>): boolean {
    if (update.radius !== undefined && !Number.isFinite(update.radius)) {
      return false;
    }

    const current = this.siteConfig();
    const normalizedUpdate: Partial<SiteThemeConfig> =
      update.radius === undefined
        ? update
        : { ...update, radius: Math.min(32, Math.max(0, update.radius)) };
    const theme = this.mergeRecord(current.theme, normalizedUpdate);

    return theme === current.theme
      ? false
      : this.commitSiteConfig({
          ...current,
          theme,
        });
  }

  updateSiteBusiness(update: Partial<SiteBusinessConfig>): boolean {
    const current = this.siteConfig();
    const business = this.mergeRecord(current.business, update);

    return business === current.business
      ? false
      : this.commitSiteConfig(
          this.applyBusinessInheritance({
            ...current,
            business,
          }),
        );
  }

  updateSiteSeo(update: Partial<SiteSeoConfig>): boolean {
    const current = this.siteConfig();
    const seo = this.mergeRecord(current.seo, update);

    return seo === current.seo
      ? false
      : this.commitSiteConfig({
          ...current,
          seo,
        });
  }

  updateBlockAppearance(blockId: string, update: Partial<BlockAppearanceOverrides>): boolean {
    if (
      !this.hasDefinedUpdate(update) ||
      (update.radius !== undefined && !Number.isFinite(update.radius))
    ) {
      return false;
    }

    return this.updateBlock(blockId, (block) => {
      const appearance = this.mergeRecord(
        block.appearance ?? DEFAULT_BLOCK_APPEARANCE,
        update.radius === undefined
          ? update
          : { ...update, radius: Math.min(32, Math.max(0, update.radius)) },
      );

      return appearance === block.appearance ? block : { ...block, appearance };
    });
  }

  updateBlockAnchor(blockId: string, anchor: string): boolean {
    const normalizedAnchor = normalizeAnchor(anchor);
    const duplicateAnchor = this.pages().some((page) =>
      page.blocks.some((block) => block.id !== blockId && block.anchor === normalizedAnchor),
    );

    if (duplicateAnchor) {
      return false;
    }

    return this.updateBlock(blockId, (block) =>
      block.anchor === normalizedAnchor ? block : { ...block, anchor: normalizedAnchor },
    );
  }

  toggleBlockVisibility(blockId: string): boolean {
    return this.updateBlock(blockId, (block) => ({
      ...block,
      hidden: !block.hidden,
    }));
  }

  undo(): boolean {
    const undoHistory = this.undoHistorySignal();
    const previous = undoHistory[undoHistory.length - 1];

    if (previous === undefined) {
      return false;
    }

    this.redoHistorySignal.set(this.appendHistory(this.redoHistorySignal(), this.siteConfig()));
    this.undoHistorySignal.set(undoHistory.slice(0, -1));
    this.siteConfigSignal.set(previous);
    this.reconcileTransientState();
    this.markDirty();

    return true;
  }

  redo(): boolean {
    const redoHistory = this.redoHistorySignal();
    const next = redoHistory[redoHistory.length - 1];

    if (next === undefined) {
      return false;
    }

    this.undoHistorySignal.set(this.appendHistory(this.undoHistorySignal(), this.siteConfig()));
    this.redoHistorySignal.set(redoHistory.slice(0, -1));
    this.siteConfigSignal.set(next);
    this.reconcileTransientState();
    this.markDirty();

    return true;
  }

  createLandingDraft(selection: CompleteLandingWizardSelection): void {
    const siteConfig = buildLandingDraft(selection);
    const project = this.projectPersistence.createProject(siteConfig);

    this.hydrateProject(project, 'saved');
  }

  addBlock(
    type: BlockType,
    afterBlockId: string | null = this.selectedBlock()?.id ?? null,
  ): string | null {
    let insertedBlockId: string | null = null;

    const didInsert = this.updateActiveBlocks((blocks) => {
      const block = this.createDefaultBlock(type, blocks);
      const insertIndex = this.getInsertIndex(blocks, afterBlockId);

      insertedBlockId = block.id;

      return [...blocks.slice(0, insertIndex), block, ...blocks.slice(insertIndex)];
    });

    if (!didInsert || insertedBlockId === null) {
      return null;
    }

    this.selectedBlockIdSignal.set(insertedBlockId);

    return insertedBlockId;
  }

  duplicateBlock(blockId: string): string | null {
    let duplicatedBlockId: string | null = null;

    this.updateActiveBlocks((blocks) => {
      const blockIndex = blocks.findIndex((block) => block.id === blockId);
      const block = blocks[blockIndex];

      if (blockIndex === -1 || block === undefined) {
        return blocks;
      }

      const duplicatedBlock = this.cloneBlock(block, blocks);
      duplicatedBlockId = duplicatedBlock.id;

      return [...blocks.slice(0, blockIndex + 1), duplicatedBlock, ...blocks.slice(blockIndex + 1)];
    });

    if (duplicatedBlockId !== null) {
      this.selectedBlockIdSignal.set(duplicatedBlockId);
    }

    return duplicatedBlockId;
  }

  removeBlock(blockId: string): boolean {
    let nextSelectedBlockId: string | null = null;
    const didRemove = this.updateActiveBlocks((blocks) => {
      const blockIndex = blocks.findIndex((block) => block.id === blockId);

      if (blockIndex === -1) {
        return blocks;
      }

      const nextBlocks = removeCollectionItem(blocks, blockIndex);
      nextSelectedBlockId = nextBlocks[Math.min(blockIndex, nextBlocks.length - 1)]?.id ?? null;

      return nextBlocks;
    });

    if (didRemove) {
      this.selectedBlockIdSignal.set(nextSelectedBlockId);
    }

    return didRemove;
  }

  moveBlock(blockId: string, direction: MoveDirection): boolean {
    const currentIndex = this.activeBlocks().findIndex((block) => block.id === blockId);

    if (currentIndex === -1) {
      return false;
    }

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    return this.reorderActiveBlocks(currentIndex, nextIndex);
  }

  reorderActiveBlocks(previousIndex: number, currentIndex: number): boolean {
    return this.updateActiveBlocks((blocks) =>
      moveCollectionItem(blocks, previousIndex, currentIndex),
    );
  }

  updateBlockDesign(blockId: string, update: Partial<LandingDesignSettings>): boolean {
    if (!this.hasDefinedUpdate(update)) {
      return false;
    }

    return this.updateBlock(blockId, (block) => {
      const design = this.mergeDesign(block.design ?? DEFAULT_LANDING_DESIGN_SETTINGS, update);

      if (block.type !== 'hero' || update.accentColor === undefined) {
        return {
          ...block,
          design,
        };
      }

      return {
        ...block,
        design,
        styles: {
          ...block.styles,
          buttonBackgroundColor: getLandingAccentValue(update.accentColor),
        },
      };
    });
  }

  updateHeroBlock(blockId: string, update: HeroBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'hero') {
        return block;
      }

      return {
        ...block,
        title: update.title ?? block.title,
        subtitle: update.subtitle ?? block.subtitle,
        buttonText: update.buttonText ?? block.buttonText,
        buttonHref: update.buttonHref ?? block.buttonHref,
        media: this.mergeOptionalMedia(block.media, update.media),
        secondaryButton: this.mergeOptionalLink(block.secondaryButton, update.secondaryButton),
        styles: this.mergeHeroStyles(block.styles, update.styles),
      };
    });
  }

  updateSiteHeaderBlock(blockId: string, update: SiteHeaderBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const hasBusinessOverride = update.brandName !== undefined || update.logo !== undefined;
      const inheritBusiness =
        update.inheritBusiness ?? (hasBusinessOverride ? false : block.inheritBusiness);
      const business = this.siteConfig().business;

      return {
        ...block,
        inheritBusiness,
        variant: update.variant ?? block.variant,
        brandName: inheritBusiness ? business.brandName : (update.brandName ?? block.brandName),
        logo: inheritBusiness
          ? this.createBusinessLogo(business)
          : this.mergeOptionalMedia(block.logo, update.logo),
        navigationItems: update.navigationItems ?? block.navigationItems,
        cta: this.mergeLink(block.cta, update.cta),
        booking:
          update.booking === undefined
            ? block.booking
            : this.mergeBooking(block.booking ?? createDefaultBooking(), update.booking),
      };
    });
  }

  updateContentMediaBlock(blockId: string, update: ContentMediaBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'contentMedia') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        eyebrow: update.eyebrow ?? block.eyebrow,
        title: update.title ?? block.title,
        body: update.body ?? block.body,
        cta: this.mergeOptionalLink(block.cta, update.cta),
        media: this.mergeOptionalMedia(block.media, update.media),
      };
    });
  }

  updateFeatureGridBlock(blockId: string, update: FeatureGridBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'featureGrid'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            description: update.description ?? block.description,
            items: update.items ?? block.items,
          }
        : block,
    );
  }

  updateFeatureGridItem(blockId: string, itemId: string, update: FeatureGridItemUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const itemIndex = this.findCollectionItemIndex(block.items, itemId);
      const item = block.items[itemIndex];

      if (item === undefined) {
        return block;
      }

      const nextItem = {
        ...item,
        icon: update.icon ?? item.icon,
        image: this.mergeOptionalMedia(item.image, update.image),
        title: update.title ?? item.title,
        description: update.description ?? item.description,
        link: update.link ?? item.link,
      };

      return {
        ...block,
        items: block.items.map((currentItem, index) =>
          index === itemIndex ? nextItem : currentItem,
        ),
      };
    });
  }

  addFeatureGridItem(blockId: string): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'featureGrid'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.createElementId('feature'),
                icon: 'star',
                title: 'Новое преимущество',
                description: 'Опишите конкретную пользу для посетителя.',
                link: createLink('Подробнее', '#lead-form'),
              },
            ],
          }
        : block,
    );
  }

  duplicateFeatureGridItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.findCollectionItemIndex(block.items, itemId),
        (item) => ({
          ...item,
          id: this.createElementId('feature'),
          image: this.cloneOptionalMedia(item.image),
          link: item.link === undefined ? undefined : this.duplicateLink(item.link),
        }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveFeatureGridItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const items = this.moveIdentifiedItem(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeFeatureGridItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const items = this.removeIdentifiedItem(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }

  updateHeaderNavigationItem(blockId: string, linkId: string, update: LinkConfigUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const linkIndex = this.findCollectionItemIndex(block.navigationItems, linkId);

      if (linkIndex === -1) {
        return block;
      }

      const nextLink = this.mergeLink(block.navigationItems[linkIndex]!, update);

      if (nextLink === block.navigationItems[linkIndex]) {
        return block;
      }

      return {
        ...block,
        navigationItems: block.navigationItems.map((link, index) =>
          index === linkIndex ? nextLink : link,
        ),
      };
    });
  }

  addHeaderNavigationItem(blockId: string): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'siteHeader'
        ? {
            ...block,
            navigationItems: [...block.navigationItems, createLink('Новая ссылка', '#lead-form')],
          }
        : block,
    );
  }

  duplicateHeaderNavigationItem(blockId: string, linkId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const linkIndex = this.findCollectionItemIndex(block.navigationItems, linkId);
      const navigationItems = duplicateCollectionItem(block.navigationItems, linkIndex, (link) =>
        this.duplicateLink(link),
      );

      return navigationItems === block.navigationItems ? block : { ...block, navigationItems };
    });
  }

  moveHeaderNavigationItem(blockId: string, linkId: string, direction: MoveDirection): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const currentIndex = this.findCollectionItemIndex(block.navigationItems, linkId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const navigationItems = moveCollectionItem(block.navigationItems, currentIndex, nextIndex);

      return navigationItems === block.navigationItems ? block : { ...block, navigationItems };
    });
  }

  removeHeaderNavigationItem(blockId: string, linkId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const linkIndex = this.findCollectionItemIndex(block.navigationItems, linkId);
      const navigationItems = removeCollectionItem(block.navigationItems, linkIndex, 1);

      return navigationItems === block.navigationItems ? block : { ...block, navigationItems };
    });
  }

  updateOfferListBlock(blockId: string, update: OfferListBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        eyebrow: update.eyebrow ?? block.eyebrow,
        title: update.title ?? block.title,
        items: update.items ?? block.items,
      };
    });
  }

  updateOfferListItem(
    blockId: string,
    itemIdentity: number | string,
    update: OfferListItemUpdate,
  ): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const itemIndex = this.findCollectionItemIndex(block.items, itemIdentity);

      if (itemIndex === -1) {
        return block;
      }

      return {
        ...block,
        items: block.items.map((item, index) =>
          index === itemIndex
            ? {
                ...item,
                title: update.title ?? item.title,
                description: update.description ?? item.description,
                meta: update.meta ?? item.meta,
                price: update.price ?? item.price,
                badge: update.badge ?? item.badge,
                image: this.mergeOptionalMedia(item.image, update.image),
                cta: this.mergeOptionalLink(item.cta, update.cta),
              }
            : item,
        ),
      };
    });
  }

  addOfferListItem(blockId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      return {
        ...block,
        items: [
          ...block.items,
          {
            id: this.createElementId('offer'),
            title: 'Новый пункт',
            description: 'Опишите преимущество, услугу или пакет.',
            meta: 'Новое',
            price: 'от 0 ₽',
            badge: 'Новое',
            image: {
              src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
              alt: 'Новый пункт предложения',
            },
            cta: createLink('Подробнее', '#lead-form'),
          },
        ],
      };
    });
  }

  duplicateOfferListItem(blockId: string, itemIdentity: number | string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const itemIndex = this.findCollectionItemIndex(block.items, itemIdentity);
      const items = duplicateCollectionItem(block.items, itemIndex, (item) => ({
        ...item,
        id: this.createElementId('offer'),
        image:
          item.image === undefined
            ? undefined
            : {
                ...item.image,
                focalPoint:
                  item.image.focalPoint === undefined ? undefined : { ...item.image.focalPoint },
              },
        cta: item.cta === undefined ? undefined : this.duplicateLink(item.cta),
      }));

      return items === block.items ? block : { ...block, items };
    });
  }

  moveOfferListItem(
    blockId: string,
    itemIdentity: number | string,
    direction: MoveDirection,
  ): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const currentIndex = this.findCollectionItemIndex(block.items, itemIdentity);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const items = moveCollectionItem(block.items, currentIndex, nextIndex);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeOfferListItem(blockId: string, itemIdentity: number | string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const itemIndex = this.findCollectionItemIndex(block.items, itemIdentity);
      const items = removeCollectionItem(block.items, itemIndex, 1);

      return items === block.items ? block : { ...block, items };
    });
  }

  updateGalleryBlock(blockId: string, update: GalleryBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'gallery'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            description: update.description ?? block.description,
            items: update.items ?? block.items,
            lightboxEnabled: update.lightboxEnabled ?? block.lightboxEnabled,
          }
        : block,
    );
  }

  updateGalleryItem(blockId: string, itemId: string, update: GalleryItemUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'gallery') {
        return block;
      }

      const itemIndex = this.findCollectionItemIndex(block.items, itemId);
      const item = block.items[itemIndex];

      if (item === undefined) {
        return block;
      }

      return {
        ...block,
        items: block.items.map((currentItem, index) =>
          index === itemIndex
            ? {
                ...item,
                image: update.image ?? item.image,
                caption: update.caption ?? item.caption,
              }
            : currentItem,
        ),
      };
    });
  }

  addGalleryItem(blockId: string): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'gallery'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.createElementId('gallery'),
                image: {
                  src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
                  alt: 'Новый кадр галереи',
                  focalPoint: { x: 50, y: 50 },
                },
                caption: 'Новый кадр',
              },
            ],
          }
        : block,
    );
  }

  duplicateGalleryItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'gallery') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.findCollectionItemIndex(block.items, itemId),
        (item) => ({
          ...item,
          id: this.createElementId('gallery'),
          image: this.cloneRequiredMedia(item.image),
        }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveGalleryItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'gallery') {
        return block;
      }

      const items = this.moveIdentifiedItem(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeGalleryItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'gallery') {
        return block;
      }

      const items = this.removeIdentifiedItem(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }

  updateTestimonialsBlock(blockId: string, update: TestimonialsBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'testimonials'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            items: update.items ?? block.items,
          }
        : block,
    );
  }

  updateTestimonialItem(blockId: string, itemId: string, update: TestimonialItemUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const itemIndex = this.findCollectionItemIndex(block.items, itemId);
      const item = block.items[itemIndex];

      if (item === undefined) {
        return block;
      }

      return {
        ...block,
        items: block.items.map((currentItem, index) =>
          index === itemIndex
            ? {
                ...item,
                quote: update.quote ?? item.quote,
                author: update.author ?? item.author,
                role: update.role ?? item.role,
                avatar: this.mergeOptionalMedia(item.avatar, update.avatar),
                rating:
                  update.rating === undefined
                    ? item.rating
                    : Math.round(Math.min(5, Math.max(1, update.rating))),
              }
            : currentItem,
        ),
      };
    });
  }

  addTestimonialItem(blockId: string): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'testimonials'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.createElementId('testimonial'),
                quote: 'Добавьте конкретный результат или впечатление клиента.',
                author: 'Имя клиента',
                role: 'Роль или компания',
                rating: 5,
              },
            ],
          }
        : block,
    );
  }

  duplicateTestimonialItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.findCollectionItemIndex(block.items, itemId),
        (item) => ({
          ...item,
          id: this.createElementId('testimonial'),
          avatar: this.cloneOptionalMedia(item.avatar),
        }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveTestimonialItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const items = this.moveIdentifiedItem(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeTestimonialItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const items = this.removeIdentifiedItem(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }

  updateFaqBlock(blockId: string, update: FaqBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'faq'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            description: update.description ?? block.description,
            items: update.items ?? block.items,
            allowMultipleOpen: update.allowMultipleOpen ?? block.allowMultipleOpen,
          }
        : block,
    );
  }

  updateFaqItem(blockId: string, itemId: string, update: FaqItemUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const itemIndex = this.findCollectionItemIndex(block.items, itemId);
      const item = block.items[itemIndex];

      if (item === undefined) {
        return block;
      }

      return {
        ...block,
        items: block.items.map((currentItem, index) =>
          index === itemIndex
            ? {
                ...item,
                question: update.question ?? item.question,
                answer: update.answer ?? item.answer,
                initiallyOpen: update.initiallyOpen ?? item.initiallyOpen,
              }
            : currentItem,
        ),
      };
    });
  }

  addFaqItem(blockId: string): boolean {
    return this.updateBlock(blockId, (block) =>
      block.type === 'faq'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.createElementId('faq'),
                question: 'Новый вопрос',
                answer: 'Добавьте понятный и полезный ответ.',
                initiallyOpen: false,
              },
            ],
          }
        : block,
    );
  }

  duplicateFaqItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.findCollectionItemIndex(block.items, itemId),
        (item) => ({ ...item, id: this.createElementId('faq'), initiallyOpen: false }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveFaqItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const items = this.moveIdentifiedItem(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeFaqItem(blockId: string, itemId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const items = this.removeIdentifiedItem(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }

  updateCallToActionBlock(blockId: string, update: CallToActionBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'callToAction') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        eyebrow: update.eyebrow ?? block.eyebrow,
        title: update.title ?? block.title,
        text: update.text ?? block.text,
        primaryAction: this.mergeLink(block.primaryAction, update.primaryAction),
        secondaryAction: this.mergeOptionalLink(block.secondaryAction, update.secondaryAction),
        media: this.mergeOptionalMedia(block.media, update.media),
      };
    });
  }

  updateSiteFooterBlock(blockId: string, update: SiteFooterBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteFooter') {
        return block;
      }

      const hasBusinessOverride =
        update.brandName !== undefined ||
        update.logo !== undefined ||
        update.contactLines !== undefined ||
        update.socialLinks !== undefined ||
        update.map !== undefined;
      const inheritBusiness =
        update.inheritBusiness ?? (hasBusinessOverride ? false : block.inheritBusiness);
      const business = this.siteConfig().business;
      const updatedMap =
        update.map === undefined
          ? block.map
          : {
              label: update.map.label ?? block.map?.label ?? 'Карта',
              address: update.map.address ?? block.map?.address ?? '',
              embedUrl: update.map.embedUrl ?? block.map?.embedUrl ?? '',
            };

      return {
        ...block,
        inheritBusiness,
        variant: update.variant ?? block.variant,
        brandName: inheritBusiness ? business.brandName : (update.brandName ?? block.brandName),
        logo: inheritBusiness
          ? this.createBusinessLogo(business)
          : this.mergeOptionalMedia(block.logo, update.logo),
        cta: this.mergeLink(block.cta, update.cta),
        contactLines: inheritBusiness
          ? this.createBusinessContactLines(business)
          : (update.contactLines ?? block.contactLines),
        links: update.links ?? block.links,
        socialLinks: inheritBusiness
          ? this.createBusinessSocialLinks(business)
          : (update.socialLinks ?? block.socialLinks),
        map: inheritBusiness
          ? this.createInheritedFooterMap(updatedMap, business.address)
          : updatedMap,
      };
    });
  }

  updateFooterLink(blockId: string, linkId: string, update: LinkConfigUpdate): boolean {
    return this.updateFooterLinkCollection(blockId, 'links', (links) => {
      const linkIndex = this.findCollectionItemIndex(links, linkId);
      const link = links[linkIndex];

      if (linkIndex === -1 || link === undefined) {
        return links;
      }

      const nextLink = this.mergeLink(link, update);

      return nextLink === link
        ? links
        : links.map((currentLink, index) => (index === linkIndex ? nextLink : currentLink));
    });
  }

  addFooterLink(blockId: string): boolean {
    return this.updateFooterLinkCollection(blockId, 'links', (links) => [
      ...links,
      createLink('Новая ссылка', '#contact'),
    ]);
  }

  duplicateFooterLink(blockId: string, linkId: string): boolean {
    return this.updateFooterLinkCollection(blockId, 'links', (links) =>
      duplicateCollectionItem(links, this.findCollectionItemIndex(links, linkId), (link) =>
        this.duplicateLink(link),
      ),
    );
  }

  moveFooterLink(blockId: string, linkId: string, direction: MoveDirection): boolean {
    return this.updateFooterLinkCollection(blockId, 'links', (links) => {
      const currentIndex = this.findCollectionItemIndex(links, linkId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      return moveCollectionItem(links, currentIndex, nextIndex);
    });
  }

  removeFooterLink(blockId: string, linkId: string): boolean {
    return this.updateFooterLinkCollection(blockId, 'links', (links) =>
      removeCollectionItem(links, this.findCollectionItemIndex(links, linkId), 1),
    );
  }

  updateFooterSocialLink(blockId: string, linkId: string, update: LinkConfigUpdate): boolean {
    return this.updateFooterLinkCollection(blockId, 'socialLinks', (links) => {
      const linkIndex = this.findCollectionItemIndex(links, linkId);
      const link = links[linkIndex];

      if (linkIndex === -1 || link === undefined) {
        return links;
      }

      const nextLink = this.mergeLink(link, update);

      return nextLink === link
        ? links
        : links.map((currentLink, index) => (index === linkIndex ? nextLink : currentLink));
    });
  }

  addFooterSocialLink(blockId: string): boolean {
    return this.updateFooterLinkCollection(blockId, 'socialLinks', (links) => [
      ...links,
      createExternalLink('Новая соцсеть', 'https://example.com'),
    ]);
  }

  duplicateFooterSocialLink(blockId: string, linkId: string): boolean {
    return this.updateFooterLinkCollection(blockId, 'socialLinks', (links) =>
      duplicateCollectionItem(links, this.findCollectionItemIndex(links, linkId), (link) =>
        this.duplicateLink(link),
      ),
    );
  }

  moveFooterSocialLink(blockId: string, linkId: string, direction: MoveDirection): boolean {
    return this.updateFooterLinkCollection(blockId, 'socialLinks', (links) => {
      const currentIndex = this.findCollectionItemIndex(links, linkId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      return moveCollectionItem(links, currentIndex, nextIndex);
    });
  }

  removeFooterSocialLink(blockId: string, linkId: string): boolean {
    return this.updateFooterLinkCollection(blockId, 'socialLinks', (links) =>
      removeCollectionItem(links, this.findCollectionItemIndex(links, linkId)),
    );
  }

  updateLeadFormBlock(blockId: string, update: LeadFormBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      return {
        ...block,
        title: update.title ?? block.title,
        description: update.description ?? block.description,
        submitText: update.submitText ?? block.submitText,
        successMessage: update.successMessage ?? block.successMessage,
        fields: update.fields ?? block.fields,
      };
    });
  }

  updateLeadFormField(
    blockId: string,
    fieldId: string,
    update: Partial<LeadFormFieldConfig>,
  ): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const fieldIndex = block.fields.findIndex((field) => field.id === fieldId);
      const field = block.fields[fieldIndex];

      if (fieldIndex === -1 || field === undefined) {
        return block;
      }

      const nextField = this.mergeRecord(field, {
        label: update.label,
        type: update.type,
        placeholder: update.placeholder,
        required: update.required,
        helpText: update.helpText,
        order: update.order,
      });

      if (nextField === field) {
        return block;
      }

      return {
        ...block,
        fields: block.fields.map((currentField, index) =>
          index === fieldIndex ? nextField : currentField,
        ),
      };
    });
  }

  addLeadFormField(blockId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const order = block.fields.length + 1;

      return {
        ...block,
        fields: [
          ...block.fields,
          {
            id: this.createElementId('field'),
            label: 'Новое поле',
            type: 'text',
            placeholder: 'Введите значение',
            required: false,
            helpText: 'Подсказка для посетителя.',
            order,
          },
        ],
      };
    });
  }

  duplicateLeadFormField(blockId: string, fieldId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const fieldIndex = block.fields.findIndex((field) => field.id === fieldId);
      const fields = duplicateCollectionItem(block.fields, fieldIndex, (field) => ({
        ...field,
        id: this.createElementId('field'),
      }));

      return fields === block.fields ? block : { ...block, fields: this.reindexLeadFields(fields) };
    });
  }

  moveLeadFormField(blockId: string, fieldId: string, direction: MoveDirection): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const currentIndex = block.fields.findIndex((field) => field.id === fieldId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const fields = moveCollectionItem(block.fields, currentIndex, nextIndex);

      return fields === block.fields ? block : { ...block, fields: this.reindexLeadFields(fields) };
    });
  }

  removeLeadFormField(blockId: string, fieldId: string): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'leadForm') {
        return block;
      }

      const fieldIndex = block.fields.findIndex((field) => field.id === fieldId);
      const fields = removeCollectionItem(block.fields, fieldIndex, 1);

      return fields === block.fields ? block : { ...block, fields: this.reindexLeadFields(fields) };
    });
  }

  private updateBlock(
    blockId: string,
    updater: (block: PageBlockConfig) => PageBlockConfig,
  ): boolean {
    return this.updateActiveBlocks((blocks) => {
      const blockIndex = blocks.findIndex((block) => block.id === blockId);
      const block = blocks[blockIndex];

      if (blockIndex === -1 || block === undefined) {
        return blocks;
      }

      const nextBlock = updater(block);

      return nextBlock === block || this.areStructurallyEqual(nextBlock, block)
        ? blocks
        : blocks.map((currentBlock, index) => (index === blockIndex ? nextBlock : currentBlock));
    });
  }

  private updateFooterLinkCollection(
    blockId: string,
    collection: FooterLinkCollection,
    updater: (links: readonly LinkConfig[]) => readonly LinkConfig[],
  ): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteFooter') {
        return block;
      }

      const currentLinks = collection === 'links' ? block.links : (block.socialLinks ?? []);
      const links = updater(currentLinks);

      if (links === currentLinks) {
        return block;
      }

      return collection === 'links'
        ? { ...block, links }
        : {
            ...block,
            inheritBusiness: false,
            socialLinks: links.length === 0 ? undefined : links,
          };
    });
  }

  private updateActiveBlocks(
    updater: (blocks: readonly PageBlockConfig[]) => readonly PageBlockConfig[],
  ): boolean {
    const current = this.siteConfig();
    const activeSlug = this.activePageSlug();
    const activePageIndex = current.pages.findIndex((page) => page.slug === activeSlug);
    const activePage = current.pages[activePageIndex];

    if (activePageIndex === -1 || activePage === undefined) {
      return false;
    }

    const blocks = updater(activePage.blocks);

    if (blocks === activePage.blocks) {
      return false;
    }

    return this.commitSiteConfig({
      ...current,
      pages: current.pages.map((page, index) =>
        index === activePageIndex ? { ...page, blocks } : page,
      ),
    });
  }

  private createDefaultBlock(
    type: BlockType,
    currentBlocks: readonly PageBlockConfig[],
  ): PageBlockConfig {
    return this.applyBusinessInheritanceToBlock(
      createRegisteredDefaultBlock(type, currentBlocks),
      this.siteConfig().business,
    );
  }

  private cloneBlock(
    block: PageBlockConfig,
    currentBlocks: readonly PageBlockConfig[],
  ): PageBlockConfig {
    return cloneRegisteredBlock(block, currentBlocks);
  }

  private getInsertIndex(blocks: readonly PageBlockConfig[], afterBlockId: string | null): number {
    if (afterBlockId === null) {
      return blocks.length;
    }

    const blockIndex = blocks.findIndex((block) => block.id === afterBlockId);

    return blockIndex === -1 ? blocks.length : blockIndex + 1;
  }

  private mergeLink(current: LinkConfig, update?: LinkConfigUpdate): LinkConfig {
    if (update === undefined) {
      return current;
    }

    const target = normalizeLinkTarget(update.target ?? current.target);

    return this.mergeRecord(current, {
      label: update.label ?? current.label,
      target,
      kind:
        update.kind ??
        (target.startsWith('#')
          ? 'anchor'
          : target.startsWith('mailto:')
            ? 'email'
            : target.startsWith('tel:')
              ? 'phone'
              : target.startsWith('https://')
                ? 'external'
                : 'internal'),
      openInNewTab: update.openInNewTab ?? current.openInNewTab,
    });
  }

  private mergeOptionalLink(
    current: LinkConfig | undefined,
    update: LinkConfigUpdate | null | undefined,
  ): LinkConfig | undefined {
    if (update === undefined) {
      return current;
    }

    if (update === null) {
      return undefined;
    }

    return this.mergeLink(current ?? createLink('Подробнее', '#lead-form'), update);
  }

  private mergeOptionalMedia(
    current: MediaAsset | undefined,
    update: MediaAssetUpdate | null | undefined,
  ): MediaAsset | undefined {
    if (update === undefined) {
      return current;
    }

    if (update === null) {
      return undefined;
    }

    return {
      src: update.src ?? current?.src ?? '',
      alt: update.alt ?? current?.alt ?? '',
      focalPoint: update.focalPoint ?? current?.focalPoint,
    };
  }

  private mergeBooking(
    current: HeaderBookingConfig,
    update: NonNullable<SiteHeaderBlockUpdate['booking']>,
  ): HeaderBookingConfig {
    return {
      dateLabel: update.dateLabel ?? current.dateLabel,
      partySizeLabel: update.partySizeLabel ?? current.partySizeLabel,
      action: this.mergeLink(current.action, update.action),
    };
  }

  private mergeDesign(
    current: LandingDesignSettings,
    update: Partial<LandingDesignSettings>,
  ): LandingDesignSettings {
    return {
      accentColor: update.accentColor ?? current.accentColor,
      fontPairing: update.fontPairing ?? current.fontPairing,
      density: update.density ?? current.density,
      templateStyle: update.templateStyle ?? current.templateStyle,
    };
  }

  private mergeHeroStyles(
    current: HeroBlockStyles,
    update?: Partial<HeroBlockStyles>,
  ): HeroBlockStyles {
    if (update === undefined) {
      return current;
    }

    return {
      backgroundColor: update.backgroundColor ?? current.backgroundColor,
      textColor: update.textColor ?? current.textColor,
      buttonBackgroundColor: update.buttonBackgroundColor ?? current.buttonBackgroundColor,
      buttonTextColor: update.buttonTextColor ?? current.buttonTextColor,
      minHeight: update.minHeight ?? current.minHeight,
      alignment: update.alignment ?? current.alignment,
    };
  }

  private hydrateProject(project: Project, saveStatus: ProjectSaveStatus): void {
    this.currentProjectSignal.set(project);
    this.siteConfigSignal.set(project.draft);
    this.activePageSlugSignal.set(project.draft.pages[0]?.slug ?? '');
    this.selectedBlockIdSignal.set(project.draft.pages[0]?.blocks[0]?.id ?? null);
    this.saveStatusSignal.set(saveStatus);
    this.projectErrorSignal.set(null);
    this.undoHistorySignal.set([]);
    this.redoHistorySignal.set([]);
  }

  private commitSiteConfig(siteConfig: SiteConfig): boolean {
    const current = this.siteConfig();

    if (siteConfig === current || this.areStructurallyEqual(siteConfig, current)) {
      return false;
    }

    this.undoHistorySignal.set(this.appendHistory(this.undoHistorySignal(), current));
    this.redoHistorySignal.set([]);
    this.siteConfigSignal.set(siteConfig);
    this.markDirty();

    return true;
  }

  private appendHistory(
    history: readonly SiteConfig[],
    snapshot: SiteConfig,
  ): readonly SiteConfig[] {
    return [...history.slice(-(HISTORY_LIMIT - 1)), snapshot];
  }

  private reconcileTransientState(): void {
    const siteConfig = this.siteConfig();
    const activePage =
      siteConfig.pages.find((page) => page.slug === this.activePageSlug()) ??
      siteConfig.pages[0] ??
      null;

    if (activePage === null) {
      this.activePageSlugSignal.set('');
      this.selectedBlockIdSignal.set(null);
      return;
    }

    this.activePageSlugSignal.set(activePage.slug);

    if (!activePage.blocks.some((block) => block.id === this.selectedBlockId())) {
      this.selectedBlockIdSignal.set(activePage.blocks[0]?.id ?? null);
    }
  }

  private mergeRecord<TRecord extends object>(current: TRecord, update: Partial<TRecord>): TRecord {
    const definedUpdate = Object.fromEntries(
      Object.entries(update).filter((entry) => entry[1] !== undefined),
    ) as Partial<TRecord>;
    const didChange = (Object.keys(definedUpdate) as (keyof TRecord)[]).some(
      (key) => !Object.is(current[key], definedUpdate[key]),
    );

    return didChange ? { ...current, ...definedUpdate } : current;
  }

  private hasDefinedUpdate(update: object): boolean {
    return Object.values(update).some((value) => value !== undefined);
  }

  private findCollectionItemIndex<TItem extends { readonly id: string }>(
    items: readonly TItem[],
    identity: number | string,
  ): number {
    return typeof identity === 'number'
      ? Number.isInteger(identity) && identity >= 0 && identity < items.length
        ? identity
        : -1
      : items.findIndex((item) => item.id === identity);
  }

  private moveIdentifiedItem<TItem extends { readonly id: string }>(
    items: readonly TItem[],
    itemId: string,
    direction: MoveDirection,
  ): readonly TItem[] {
    const currentIndex = this.findCollectionItemIndex(items, itemId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    return moveCollectionItem(items, currentIndex, nextIndex);
  }

  private removeIdentifiedItem<TItem extends { readonly id: string }>(
    items: readonly TItem[],
    itemId: string,
  ): readonly TItem[] {
    return removeCollectionItem(items, this.findCollectionItemIndex(items, itemId), 1);
  }

  private cloneOptionalMedia(media: MediaAsset | undefined): MediaAsset | undefined {
    return media === undefined ? undefined : this.cloneRequiredMedia(media);
  }

  private cloneRequiredMedia(media: MediaAsset): MediaAsset {
    return {
      ...media,
      focalPoint: media.focalPoint === undefined ? undefined : { ...media.focalPoint },
    };
  }

  private duplicateLink(link: LinkConfig): LinkConfig {
    return {
      ...link,
      id: this.createElementId('link'),
    };
  }

  private reindexLeadFields(
    fields: readonly LeadFormFieldConfig[],
  ): readonly LeadFormFieldConfig[] {
    return fields.map((field, index) => ({
      ...field,
      order: index + 1,
    }));
  }

  private applyBusinessInheritance(siteConfig: SiteConfig): SiteConfig {
    return {
      ...siteConfig,
      pages: siteConfig.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) =>
          this.applyBusinessInheritanceToBlock(block, siteConfig.business),
        ),
      })),
    };
  }

  private applyBusinessInheritanceToBlock(
    block: PageBlockConfig,
    business: SiteBusinessConfig,
  ): PageBlockConfig {
    if (block.type === 'siteHeader' && block.inheritBusiness) {
      return {
        ...block,
        brandName: business.brandName,
        logo: this.createBusinessLogo(business),
      };
    }

    if (block.type === 'siteFooter' && block.inheritBusiness) {
      return {
        ...block,
        brandName: business.brandName,
        logo: this.createBusinessLogo(business),
        contactLines: this.createBusinessContactLines(business),
        socialLinks: this.createBusinessSocialLinks(business),
        map: this.createInheritedFooterMap(block.map, business.address),
      };
    }

    return block;
  }

  private createBusinessContactLines(business: SiteBusinessConfig): readonly string[] {
    return [business.phone, business.email, business.address, business.hours]
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  private createBusinessSocialLinks(business: SiteBusinessConfig): readonly LinkConfig[] {
    return [...business.socialLinks, ...business.messengers].map((link) => ({ ...link }));
  }

  private createBusinessLogo(business: SiteBusinessConfig): MediaAsset | undefined {
    return business.logo === null
      ? undefined
      : {
          ...business.logo,
          focalPoint:
            business.logo.focalPoint === undefined ? undefined : { ...business.logo.focalPoint },
        };
  }

  private createInheritedFooterMap(
    map: FooterMapConfig | undefined,
    address: string,
  ): FooterMapConfig {
    return {
      label: map?.label ?? 'Карта',
      address,
      embedUrl: createMapSearchUrl(address),
    };
  }

  private areStructurallyEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) {
      return true;
    }

    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
        return false;
      }

      return left.every((value, index) => this.areStructurallyEqual(value, right[index]));
    }

    if (!this.isPlainRecord(left) || !this.isPlainRecord(right)) {
      return false;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        this.areStructurallyEqual(left[key], right[key]),
    );
  }

  private isPlainRecord(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const prototype: unknown = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
  }

  private createElementId(prefix: string): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    this.fallbackElementId += 1;

    return `${prefix}-${Date.now().toString(36)}-${this.fallbackElementId.toString(36)}`;
  }

  private markDirty(): void {
    this.saveStatusSignal.set('dirty');
  }

  private readErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Не удалось выполнить действие.';
  }
}
