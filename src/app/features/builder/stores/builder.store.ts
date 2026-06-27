import { computed, inject, Injectable, signal } from '@angular/core';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import { buildLandingDraft } from '../data-access/landing-draft.factory';
import { ProjectPersistenceService } from '../data-access/project-persistence.service';
import { DEFAULT_LANDING_DESIGN_SETTINGS, getLandingAccentValue } from '../domain/models';
import { createBlockAnchor, createBlockId } from '../domain/utils/builder-ids';
import type {
  BlockType,
  CompleteLandingWizardSelection,
  HeroBlockStyles,
  HeroBlockUpdate,
  LandingDesignSettings,
  LeadFormBlockUpdate,
  OfferListBlockUpdate,
  OfferListItem,
  PageBlockConfig,
  PageConfig,
  Project,
  ProjectSaveStatus,
  SiteConfig,
  SiteFooterBlockUpdate,
  SiteHeaderBlockUpdate,
} from '../domain/models';

type MoveDirection = 'up' | 'down';

const DEFAULT_HERO_STYLES: HeroBlockStyles = {
  backgroundColor: '#f5f7fb',
  textColor: '#111827',
  buttonBackgroundColor: '#111827',
  buttonTextColor: '#ffffff',
  minHeight: '520px',
  alignment: 'center',
};

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

  readonly currentProject = computed<Project | null>(() => this.currentProjectSignal());
  readonly saveStatus = computed<ProjectSaveStatus>(() => this.saveStatusSignal());
  readonly projectError = computed<string | null>(() => this.projectErrorSignal());
  readonly siteConfig = computed<SiteConfig>(() => this.siteConfigSignal());
  readonly pages = computed<readonly PageConfig[]>(() => this.siteConfig().pages);
  readonly activePageSlug = computed<string>(() => this.activePageSlugSignal());
  readonly selectedBlockId = computed<string | null>(() => this.selectedBlockIdSignal());
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

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      name: normalizedName,
    }));
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
    const activeSlug = this.activePageSlug();
    let didInsert = false;
    let insertedBlockId: string | null = null;

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => {
        if (page.slug !== activeSlug) {
          return page;
        }

        const block = this.createDefaultBlock(type, page.blocks);
        const insertIndex = this.getInsertIndex(page.blocks, afterBlockId);
        const nextBlocks = [
          ...page.blocks.slice(0, insertIndex),
          block,
          ...page.blocks.slice(insertIndex),
        ];

        didInsert = true;
        insertedBlockId = block.id;

        return {
          ...page,
          blocks: nextBlocks,
        };
      }),
    }));

    if (!didInsert || insertedBlockId === null) {
      return null;
    }

    this.selectedBlockIdSignal.set(insertedBlockId);
    this.markDirty();

    return insertedBlockId;
  }

  duplicateBlock(blockId: string): string | null {
    const activeSlug = this.activePageSlug();
    let duplicatedBlockId: string | null = null;

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => {
        if (page.slug !== activeSlug) {
          return page;
        }

        const blockIndex = page.blocks.findIndex((block) => block.id === blockId);

        if (blockIndex === -1) {
          return page;
        }

        const duplicatedBlock = this.cloneBlock(page.blocks[blockIndex], page.blocks);
        duplicatedBlockId = duplicatedBlock.id;

        return {
          ...page,
          blocks: [
            ...page.blocks.slice(0, blockIndex + 1),
            duplicatedBlock,
            ...page.blocks.slice(blockIndex + 1),
          ],
        };
      }),
    }));

    if (duplicatedBlockId !== null) {
      this.selectedBlockIdSignal.set(duplicatedBlockId);
      this.markDirty();
    }

    return duplicatedBlockId;
  }

  removeBlock(blockId: string): boolean {
    const activeSlug = this.activePageSlug();
    let nextSelectedBlockId: string | null = null;
    let didRemove = false;

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => {
        if (page.slug !== activeSlug) {
          return page;
        }

        const blockIndex = page.blocks.findIndex((block) => block.id === blockId);

        if (blockIndex === -1) {
          return page;
        }

        const nextBlocks = page.blocks.filter((block) => block.id !== blockId);
        nextSelectedBlockId = nextBlocks[Math.min(blockIndex, nextBlocks.length - 1)]?.id ?? null;
        didRemove = true;

        return {
          ...page,
          blocks: nextBlocks,
        };
      }),
    }));

    if (didRemove) {
      this.selectedBlockIdSignal.set(nextSelectedBlockId);
      this.markDirty();
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
    const activeSlug = this.activePageSlug();
    let didReorder = false;

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => {
        if (page.slug !== activeSlug) {
          return page;
        }

        if (
          previousIndex < 0 ||
          currentIndex < 0 ||
          previousIndex >= page.blocks.length ||
          currentIndex >= page.blocks.length ||
          previousIndex === currentIndex
        ) {
          return page;
        }

        const nextBlocks = [...page.blocks];
        const [movedBlock] = nextBlocks.splice(previousIndex, 1);

        if (movedBlock === undefined) {
          return page;
        }

        nextBlocks.splice(currentIndex, 0, movedBlock);
        didReorder = true;

        return {
          ...page,
          blocks: nextBlocks,
        };
      }),
    }));

    if (didReorder) {
      this.markDirty();
    }

    return didReorder;
  }

  updateBlockDesign(blockId: string, update: Partial<LandingDesignSettings>): boolean {
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
        styles: this.mergeHeroStyles(block.styles, update.styles),
      };
    });
  }

  updateSiteHeaderBlock(blockId: string, update: SiteHeaderBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        brandName: update.brandName ?? block.brandName,
        navigationItems: update.navigationItems ?? block.navigationItems,
        ctaText: update.ctaText ?? block.ctaText,
      };
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

  updateOfferListItem(blockId: string, itemIndex: number, update: Partial<OfferListItem>): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList' || itemIndex < 0 || itemIndex >= block.items.length) {
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
            title: 'Новый пункт',
            description: 'Опишите преимущество, услугу или пакет.',
            meta: 'Новое',
          },
        ],
      };
    });
  }

  removeOfferListItem(blockId: string, itemIndex: number): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'offerList' || block.items.length <= 1) {
        return block;
      }

      return {
        ...block,
        items: block.items.filter((_, index) => index !== itemIndex),
      };
    });
  }

  updateSiteFooterBlock(blockId: string, update: SiteFooterBlockUpdate): boolean {
    return this.updateBlock(blockId, (block) => {
      if (block.type !== 'siteFooter') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        brandName: update.brandName ?? block.brandName,
        ctaText: update.ctaText ?? block.ctaText,
        contactLines: update.contactLines ?? block.contactLines,
        links: update.links ?? block.links,
      };
    });
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

  private updateBlock(
    blockId: string,
    updater: (block: PageBlockConfig) => PageBlockConfig,
  ): boolean {
    const activeSlug = this.activePageSlug();
    let didUpdate = false;

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => {
        if (page.slug !== activeSlug) {
          return page;
        }

        return {
          ...page,
          blocks: page.blocks.map((block) => {
            if (block.id !== blockId) {
              return block;
            }

            didUpdate = true;

            return updater(block);
          }),
        };
      }),
    }));

    if (didUpdate) {
      this.markDirty();
    }

    return didUpdate;
  }

  private createDefaultBlock(
    type: BlockType,
    currentBlocks: readonly PageBlockConfig[],
  ): PageBlockConfig {
    const id = createBlockId(type);
    const anchor = createBlockAnchor(
      type,
      currentBlocks.map((block) => block.anchor),
    );
    const design = DEFAULT_LANDING_DESIGN_SETTINGS;

    switch (type) {
      case 'siteHeader':
        return {
          id,
          anchor,
          type,
          design,
          variant: 'centeredHero',
          brandName: 'Nexus Studio',
          navigationItems: ['Оффер', 'Преимущества', 'Контакты'],
          ctaText: 'Связаться',
        };
      case 'hero':
        return {
          id,
          anchor,
          type,
          design,
          title: 'Большой ясный оффер для нового блока',
          subtitle: 'Опишите ценность, сценарий и следующий шаг для посетителя.',
          buttonText: 'Начать',
          buttonHref: '#lead-form',
          styles: DEFAULT_HERO_STYLES,
        };
      case 'offerList':
        return {
          id,
          anchor,
          type,
          design,
          variant: 'catalogGrid',
          eyebrow: 'Подборка',
          title: 'Что можно показать в этом блоке',
          items: [
            {
              title: 'Первый пункт',
              description: 'Короткое описание пользы, услуги или продукта.',
              meta: 'База',
            },
            {
              title: 'Второй пункт',
              description: 'Добавьте детали, цену, срок или формат работы.',
              meta: 'Про',
            },
            {
              title: 'Третий пункт',
              description: 'Закройте список сильным аргументом для заявки.',
              meta: 'Плюс',
            },
          ],
        };
      case 'siteFooter':
        return {
          id,
          anchor,
          type,
          design,
          variant: 'bookingFooter',
          brandName: 'Nexus Studio',
          ctaText: 'Оставить заявку',
          contactLines: ['hello@nexus.app', '+7 999 000-00-00', 'Ответ в течение дня'],
          links: ['Условия', 'Контакты', 'Политика'],
        };
      case 'leadForm':
        return {
          id,
          anchor,
          type,
          design,
          title: 'Оставьте заявку',
          description: 'Напишите, что нужно собрать, и мы вернемся с понятным следующим шагом.',
          submitText: 'Отправить',
          successMessage: 'Заявка сохранена. Мы скоро свяжемся с вами.',
          fields: [
            {
              id: 'name',
              label: 'Имя',
              type: 'text',
              placeholder: 'Как к вам обращаться',
              required: true,
            },
            {
              id: 'contact',
              label: 'Телефон или email',
              type: 'text',
              placeholder: '+7 999 000-00-00',
              required: true,
            },
          ],
        };
    }
  }

  private cloneBlock(
    block: PageBlockConfig,
    currentBlocks: readonly PageBlockConfig[],
  ): PageBlockConfig {
    const id = createBlockId(block.type);
    const anchor = createBlockAnchor(
      block.type,
      currentBlocks.map((currentBlock) => currentBlock.anchor),
    );

    switch (block.type) {
      case 'siteHeader':
        return {
          ...block,
          id,
          anchor,
          navigationItems: [...block.navigationItems],
        };
      case 'hero':
        return {
          ...block,
          id,
          anchor,
          styles: {
            ...block.styles,
          },
        };
      case 'offerList':
        return {
          ...block,
          id,
          anchor,
          items: block.items.map((item) => ({ ...item })),
        };
      case 'siteFooter':
        return {
          ...block,
          id,
          anchor,
          contactLines: [...block.contactLines],
          links: [...block.links],
        };
      case 'leadForm':
        return {
          ...block,
          id,
          anchor,
          fields: block.fields.map((field) => ({ ...field })),
        };
    }
  }

  private getInsertIndex(blocks: readonly PageBlockConfig[], afterBlockId: string | null): number {
    if (afterBlockId === null) {
      return blocks.length;
    }

    const blockIndex = blocks.findIndex((block) => block.id === afterBlockId);

    return blockIndex === -1 ? blocks.length : blockIndex + 1;
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
  }

  private markDirty(): void {
    this.saveStatusSignal.set('dirty');
  }

  private readErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Не удалось выполнить действие.';
  }
}
