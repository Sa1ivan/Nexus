import { describe, expect, it } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../../data-access/default-site.config';
import type { PageConfig } from '../models';
import {
  createPage,
  duplicatePage,
  movePage,
  removePage,
  renamePage,
  updatePageSeo,
  updatePageSlug,
} from './page-config-update';

describe('page config updates', () => {
  const homePage = createPageFixture('page-home', 'home', 'Главная');
  const aboutPage = createPageFixture('page-about', 'about', 'О компании');

  it('creates a recognizable page with page-owned content only', () => {
    const result = createPage([homePage], 'Услуги');

    expect(result).toMatchObject({
      ok: true,
      activePageId: expect.any(String),
      pages: [
        homePage,
        {
          slug: 'uslugi',
          title: 'Услуги',
          seo: {
            title: 'Услуги',
            description: '',
            socialImage: null,
            noIndex: false,
          },
        },
      ],
    });

    if (result.ok) {
      const createdPage = result.pages[1];

      expect(createdPage?.blocks.map((block) => block.type)).toEqual(['hero']);
      expect(createdPage?.blocks[0]).toMatchObject({
        type: 'hero',
        title: 'Услуги',
      });
    }
  });

  it('renames a page without changing its slug', () => {
    const result = renamePage([homePage], homePage.id, '  Стартовая  ');

    expect(result).toMatchObject({
      ok: true,
      activePageId: homePage.id,
      pages: [{ title: 'Стартовая', slug: 'home' }],
    });
  });

  it('normalizes a slug and rejects duplicate and reserved values', () => {
    expect(updatePageSlug([homePage], homePage.id, '  О нас  ')).toMatchObject({
      ok: true,
      pages: [{ slug: 'o-nas' }],
    });
    expect(updatePageSlug([homePage, aboutPage], aboutPage.id, 'home')).toEqual({
      ok: false,
      reason: 'duplicate-slug',
    });
    expect(updatePageSlug([homePage], homePage.id, 'builder')).toEqual({
      ok: false,
      reason: 'reserved-slug',
    });
  });

  it('updates only the requested page SEO fields', () => {
    const result = updatePageSeo([homePage], homePage.id, {
      description: 'Описание страницы',
      noIndex: true,
    });

    expect(result).toMatchObject({
      ok: true,
      pages: [
        {
          seo: {
            title: 'Главная',
            description: 'Описание страницы',
            socialImage: null,
            noIndex: true,
          },
        },
      ],
    });
  });

  it('duplicates a page with new page and block ids but the same anchors', () => {
    const duplicated = duplicatePage([homePage], homePage.id);

    expect(duplicated.ok).toBe(true);

    if (duplicated.ok) {
      const duplicatedPage = duplicated.pages[1];

      expect(duplicatedPage?.id).not.toBe(homePage.id);
      expect(duplicatedPage?.slug).toBe('home-copy');
      expect(duplicatedPage?.blocks.map((block) => block.id)).not.toEqual(
        homePage.blocks.map((block) => block.id),
      );
      expect(duplicatedPage?.blocks.map((block) => block.anchor)).toEqual(
        homePage.blocks.map((block) => block.anchor),
      );
    }
  });

  it('moves pages within boundaries', () => {
    expect(movePage([homePage, aboutPage], aboutPage.id, 'up')).toMatchObject({
      ok: true,
      pages: [aboutPage, homePage],
      activePageId: aboutPage.id,
    });
    expect(movePage([homePage, aboutPage], homePage.id, 'up')).toEqual({
      ok: false,
      reason: 'boundary',
    });
  });

  it('does not remove the last page and selects a neighbor after removal', () => {
    expect(removePage([homePage], homePage.id)).toEqual({
      ok: false,
      reason: 'last-page',
    });
    expect(removePage([homePage, aboutPage], homePage.id)).toMatchObject({
      ok: true,
      pages: [aboutPage],
      activePageId: aboutPage.id,
    });
  });
});

function createPageFixture(id: string, slug: string, title: string): PageConfig {
  const defaultPage = DEFAULT_SITE_CONFIG.pages[0];

  if (defaultPage === undefined) {
    throw new Error('Default site must contain a page.');
  }

  return {
    ...defaultPage,
    id,
    slug,
    title,
    seo: {
      title,
      description: '',
      socialImage: null,
      noIndex: false,
    },
  };
}
