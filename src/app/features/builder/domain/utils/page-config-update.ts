import type { PageConfig, PageSeoConfig } from '../models';
import { cloneRegisteredBlock, createDefaultBlock } from '../registry/block-registry';
import { createPageId } from './builder-ids';
import type { PageMutationResult } from './page-config-update.types';
import { isReservedPageSlug, normalizePageSlug } from './page-slug';

export type { PageMutationResult } from './page-config-update.types';

export function createPage(pages: readonly PageConfig[], title: string): PageMutationResult {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return { ok: false, reason: 'empty-title' };
  }

  const slug = normalizePageSlug(normalizedTitle);
  const slugFailure = validateSlug(pages, null, slug);

  if (slugFailure !== null) {
    return slugFailure;
  }

  const blocks = createInitialPageBlocks(normalizedTitle);
  const page: PageConfig = {
    id: createPageId(slug),
    slug,
    title: normalizedTitle,
    seo: {
      title: normalizedTitle,
      description: '',
      socialImage: null,
      noIndex: false,
    },
    blocks,
  };

  return {
    ok: true,
    pages: [...pages, page],
    activePageId: page.id,
  };
}

export function renamePage(
  pages: readonly PageConfig[],
  pageId: string,
  title: string,
): PageMutationResult {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return { ok: false, reason: 'empty-title' };
  }

  return updatePage(pages, pageId, (page) => ({
    ...page,
    title: normalizedTitle,
  }));
}

export function updatePageSlug(
  pages: readonly PageConfig[],
  pageId: string,
  slug: string,
): PageMutationResult {
  const pageIndex = findPageIndex(pages, pageId);

  if (pageIndex === -1) {
    return { ok: false, reason: 'not-found' };
  }

  const normalizedSlug = normalizePageSlug(slug);
  const slugFailure = validateSlug(pages, pageId, normalizedSlug);

  if (slugFailure !== null) {
    return slugFailure;
  }

  return updatePageAt(pages, pageIndex, {
    ...pages[pageIndex]!,
    slug: normalizedSlug,
  });
}

export function updatePageSeo(
  pages: readonly PageConfig[],
  pageId: string,
  update: Partial<PageSeoConfig>,
): PageMutationResult {
  return updatePage(pages, pageId, (page) => ({
    ...page,
    seo: {
      ...page.seo,
      ...update,
    },
  }));
}

export function duplicatePage(pages: readonly PageConfig[], pageId: string): PageMutationResult {
  const pageIndex = findPageIndex(pages, pageId);
  const sourcePage = pages[pageIndex];

  if (pageIndex === -1 || sourcePage === undefined) {
    return { ok: false, reason: 'not-found' };
  }

  const slug = createUniqueSlug(`${sourcePage.slug}-copy`, pages);
  const page: PageConfig = {
    ...sourcePage,
    id: createPageId(slug),
    slug,
    title: `${sourcePage.title} — копия`,
    seo: {
      ...sourcePage.seo,
      socialImage:
        sourcePage.seo.socialImage === null
          ? null
          : {
              ...sourcePage.seo.socialImage,
              focalPoint:
                sourcePage.seo.socialImage.focalPoint === undefined
                  ? undefined
                  : { ...sourcePage.seo.socialImage.focalPoint },
            },
    },
    blocks: sourcePage.blocks.map((block) =>
      cloneRegisteredBlock(block, sourcePage.blocks, {
        preserveAnchor: true,
      }),
    ),
  };

  return {
    ok: true,
    pages: [...pages.slice(0, pageIndex + 1), page, ...pages.slice(pageIndex + 1)],
    activePageId: page.id,
  };
}

export function movePage(
  pages: readonly PageConfig[],
  pageId: string,
  direction: 'up' | 'down',
): PageMutationResult {
  const pageIndex = findPageIndex(pages, pageId);

  if (pageIndex === -1) {
    return { ok: false, reason: 'not-found' };
  }

  const targetIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1;

  if (targetIndex < 0 || targetIndex >= pages.length) {
    return { ok: false, reason: 'boundary' };
  }

  const nextPages = [...pages];
  [nextPages[pageIndex], nextPages[targetIndex]] = [nextPages[targetIndex]!, nextPages[pageIndex]!];

  return {
    ok: true,
    pages: nextPages,
    activePageId: pageId,
  };
}

export function removePage(pages: readonly PageConfig[], pageId: string): PageMutationResult {
  const pageIndex = findPageIndex(pages, pageId);

  if (pageIndex === -1) {
    return { ok: false, reason: 'not-found' };
  }

  if (pages.length === 1) {
    return { ok: false, reason: 'last-page' };
  }

  const nextPages = pages.filter((page) => page.id !== pageId);
  const activePage = nextPages[Math.min(pageIndex, nextPages.length - 1)]!;

  return {
    ok: true,
    pages: nextPages,
    activePageId: activePage.id,
  };
}

function createInitialPageBlocks(title: string): PageConfig['blocks'] {
  const blocks: PageConfig['blocks'][number][] = [];
  const defaultHero = createDefaultBlock('hero', blocks);
  const hero =
    defaultHero.type === 'hero'
      ? {
          ...defaultHero,
          title,
        }
      : defaultHero;
  blocks.push(hero);

  return blocks;
}

function updatePage(
  pages: readonly PageConfig[],
  pageId: string,
  update: (page: PageConfig) => PageConfig,
): PageMutationResult {
  const pageIndex = findPageIndex(pages, pageId);
  const page = pages[pageIndex];

  return pageIndex === -1 || page === undefined
    ? { ok: false, reason: 'not-found' }
    : updatePageAt(pages, pageIndex, update(page));
}

function updatePageAt(
  pages: readonly PageConfig[],
  pageIndex: number,
  page: PageConfig,
): PageMutationResult {
  return {
    ok: true,
    pages: pages.map((currentPage, index) => (index === pageIndex ? page : currentPage)),
    activePageId: page.id,
  };
}

function validateSlug(
  pages: readonly PageConfig[],
  pageId: string | null,
  slug: string,
): Extract<PageMutationResult, { readonly ok: false }> | null {
  if (!slug) {
    return { ok: false, reason: 'empty-slug' };
  }

  if (isReservedPageSlug(slug)) {
    return { ok: false, reason: 'reserved-slug' };
  }

  return pages.some((page) => page.id !== pageId && page.slug === slug)
    ? { ok: false, reason: 'duplicate-slug' }
    : null;
}

function createUniqueSlug(baseSlug: string, pages: readonly PageConfig[]): string {
  const slugs = new Set(pages.map((page) => page.slug));
  let slug = baseSlug;
  let index = 2;

  while (slugs.has(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

function findPageIndex(pages: readonly PageConfig[], pageId: string): number {
  return pages.findIndex((page) => page.id === pageId);
}
