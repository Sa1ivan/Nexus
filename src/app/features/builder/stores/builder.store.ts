import { computed, Injectable, signal } from '@angular/core';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import { buildLandingDraft } from '../data-access/landing-draft.factory';
import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
} from '../domain/models';
import type {
  BlockType,
  CompleteLandingWizardSelection,
  HeroBlockStyles,
  HeroBlockUpdate,
  LandingDesignSettings,
  OfferListBlockUpdate,
  OfferListItem,
  PageBlockConfig,
  PageConfig,
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
  private readonly siteConfigSignal = signal<SiteConfig>(DEFAULT_SITE_CONFIG);
  private readonly activePageSlugSignal = signal<string>(DEFAULT_SITE_CONFIG.pages[0]?.slug ?? '');
  private readonly selectedBlockIdSignal = signal<string | null>(
    DEFAULT_SITE_CONFIG.pages[0]?.blocks[0]?.id ?? null,
  );

  readonly siteConfig = computed<SiteConfig>(() => this.siteConfigSignal());
  readonly pages = computed<readonly PageConfig[]>(() => this.siteConfig().pages);
  readonly activePageSlug = computed<string>(() => this.activePageSlugSignal());
  readonly selectedBlockId = computed<string | null>(() => this.selectedBlockIdSignal());
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

  updateSiteName(name: string): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      name: normalizedName,
    }));

    return true;
  }

  createLandingDraft(selection: CompleteLandingWizardSelection): void {
    const siteConfig = buildLandingDraft(selection);

    this.siteConfigSignal.set(siteConfig);
    this.activePageSlugSignal.set(siteConfig.pages[0]?.slug ?? '');
    this.selectedBlockIdSignal.set(siteConfig.pages[0]?.blocks[0]?.id ?? null);
  }

  addBlock(type: BlockType, afterBlockId: string | null = this.selectedBlock()?.id ?? null): string | null {
    const activeSlug = this.activePageSlug();
    const block = this.createDefaultBlock(type);
    let didInsert = false;

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => {
        if (page.slug !== activeSlug) {
          return page;
        }

        const insertIndex = this.getInsertIndex(page.blocks, afterBlockId);
        const nextBlocks = [
          ...page.blocks.slice(0, insertIndex),
          block,
          ...page.blocks.slice(insertIndex),
        ];

        didInsert = true;

        return {
          ...page,
          blocks: nextBlocks,
        };
      }),
    }));

    if (!didInsert) {
      return null;
    }

    this.selectedBlockIdSignal.set(block.id);

    return block.id;
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

        const duplicatedBlock = this.cloneBlock(page.blocks[blockIndex]);
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
        nextSelectedBlockId =
          nextBlocks[Math.min(blockIndex, nextBlocks.length - 1)]?.id ?? null;
        didRemove = true;

        return {
          ...page,
          blocks: nextBlocks,
        };
      }),
    }));

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

  updateOfferListItem(
    blockId: string,
    itemIndex: number,
    update: Partial<OfferListItem>,
  ): boolean {
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

  private updateBlock(
    blockId: string,
    updater: (block: PageBlockConfig) => PageBlockConfig,
  ): boolean {
    let didUpdate = false;

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.id !== blockId) {
            return block;
          }

          didUpdate = true;

          return updater(block);
        }),
      })),
    }));

    return didUpdate;
  }

  private createDefaultBlock(type: BlockType): PageBlockConfig {
    const id = this.createBlockId(type);
    const design = DEFAULT_LANDING_DESIGN_SETTINGS;

    switch (type) {
      case 'siteHeader':
        return {
          id,
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
          type,
          design,
          title: 'Большой ясный оффер для нового блока',
          subtitle: 'Опишите ценность, сценарий и следующий шаг для посетителя.',
          buttonText: 'Начать',
          styles: DEFAULT_HERO_STYLES,
        };
      case 'offerList':
        return {
          id,
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
          type,
          design,
          variant: 'bookingFooter',
          brandName: 'Nexus Studio',
          ctaText: 'Оставить заявку',
          contactLines: ['hello@nexus.app', '+7 999 000-00-00', 'Ответ в течение дня'],
          links: ['Условия', 'Контакты', 'Политика'],
        };
    }
  }

  private cloneBlock(block: PageBlockConfig): PageBlockConfig {
    const id = this.createBlockId(block.type);

    switch (block.type) {
      case 'siteHeader':
        return {
          ...block,
          id,
          navigationItems: [...block.navigationItems],
        };
      case 'hero':
        return {
          ...block,
          id,
          styles: {
            ...block.styles,
          },
        };
      case 'offerList':
        return {
          ...block,
          id,
          items: block.items.map((item) => ({ ...item })),
        };
      case 'siteFooter':
        return {
          ...block,
          id,
          contactLines: [...block.contactLines],
          links: [...block.links],
        };
    }
  }

  private createBlockId(type: BlockType): string {
    return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private getInsertIndex(
    blocks: readonly PageBlockConfig[],
    afterBlockId: string | null,
  ): number {
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
}
