import { computed, Injectable, signal } from '@angular/core';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import type { HeroBlockUpdate, PageBlockConfig, PageConfig, SiteConfig } from '../domain/models';

@Injectable({
  providedIn: 'root',
})
export class BuilderStore {
  private readonly siteConfigSignal = signal<SiteConfig>(DEFAULT_SITE_CONFIG);
  private readonly activePageSlugSignal = signal<string>(DEFAULT_SITE_CONFIG.pages[0]?.slug ?? '');

  readonly siteConfig = computed<SiteConfig>(() => this.siteConfigSignal());
  readonly pages = computed<readonly PageConfig[]>(() => this.siteConfig().pages);
  readonly activePageSlug = computed<string>(() => this.activePageSlugSignal());
  readonly activePage = computed<PageConfig | null>(() => {
    const activeSlug = this.activePageSlug();

    return this.pages().find((page) => page.slug === activeSlug) ?? null;
  });
  readonly activeBlocks = computed<readonly PageBlockConfig[]>(
    () => this.activePage()?.blocks ?? [],
  );

  selectPage(slug: string): void {
    const pageExists = this.pages().some((page) => page.slug === slug);

    if (pageExists) {
      this.activePageSlugSignal.set(slug);
    }
  }

  updateSiteName(name: string): void {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return;
    }

    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      name: normalizedName,
    }));
  }

  updateHeroBlock(blockId: string, update: HeroBlockUpdate): void {
    this.updateBlock(blockId, (block) => {
      if (block.type !== 'hero') {
        return block;
      }

      return {
        ...block,
        title: update.title ?? block.title,
        subtitle: update.subtitle ?? block.subtitle,
        buttonText: update.buttonText ?? block.buttonText,
        styles: {
          ...block.styles,
          ...update.styles,
        },
      };
    });
  }

  private updateBlock(blockId: string, updater: (block: PageBlockConfig) => PageBlockConfig): void {
    this.siteConfigSignal.update((siteConfig) => ({
      ...siteConfig,
      pages: siteConfig.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) => (block.id === blockId ? updater(block) : block)),
      })),
    }));
  }
}
