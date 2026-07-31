import { Injectable } from '@angular/core';

import type { LinkConfig, PageBlockConfig, PageConfig, SiteChromeConfig } from '../domain/models';
import { areStructurallyEqual } from '../domain/utils/structural-equality';

@Injectable({ providedIn: 'root' })
export class SiteChromeDocumentService {
  update(
    chrome: SiteChromeConfig,
    blockId: string,
    updater: (block: PageBlockConfig) => PageBlockConfig,
  ): SiteChromeConfig | null {
    if (blockId === chrome.header.id) {
      const header = updater(chrome.header);

      return header.type !== 'siteHeader' ||
        header === chrome.header ||
        areStructurallyEqual(header, chrome.header)
        ? null
        : { ...chrome, header };
    }

    if (blockId === chrome.footer.id) {
      const footer = updater(chrome.footer);

      return footer.type !== 'siteFooter' ||
        footer === chrome.footer ||
        areStructurallyEqual(footer, chrome.footer)
        ? null
        : { ...chrome, footer };
    }

    return null;
  }

  contains(chrome: SiteChromeConfig, blockId: string): boolean {
    return blockId === chrome.header.id || blockId === chrome.footer.id;
  }

  remapPageTarget(
    chrome: SiteChromeConfig,
    previousSlug: string,
    nextSlug: string,
  ): SiteChromeConfig {
    const previousTarget = `/${previousSlug}`;
    const nextTarget = `/${nextSlug}`;
    const remapLink = (link: LinkConfig): LinkConfig =>
      link.target === previousTarget ? { ...link, target: nextTarget, kind: 'internal' } : link;

    return {
      header: {
        ...chrome.header,
        navigationItems: chrome.header.navigationItems.map(remapLink),
        cta: remapLink(chrome.header.cta),
        booking:
          chrome.header.booking === undefined
            ? undefined
            : {
                ...chrome.header.booking,
                action: remapLink(chrome.header.booking.action),
              },
      },
      footer: {
        ...chrome.footer,
        cta: remapLink(chrome.footer.cta),
        links: chrome.footer.links.map(remapLink),
        socialLinks: chrome.footer.socialLinks?.map(remapLink),
      },
    };
  }

  remapTargetForSlugChange(
    chrome: SiteChromeConfig,
    currentPages: readonly PageConfig[],
    nextPages: readonly PageConfig[],
    pageId: string,
  ): SiteChromeConfig {
    const currentPage = currentPages.find((page) => page.id === pageId);
    const nextPage = nextPages.find((page) => page.id === pageId);

    return currentPage === undefined || nextPage === undefined
      ? chrome
      : this.remapPageTarget(chrome, currentPage.slug, nextPage.slug);
  }

  referencesPageTarget(chrome: SiteChromeConfig, pageSlug: string): boolean {
    const target = `/${pageSlug}`;
    const links: readonly LinkConfig[] = [
      ...chrome.header.navigationItems,
      chrome.header.cta,
      ...(chrome.header.booking === undefined ? [] : [chrome.header.booking.action]),
      chrome.footer.cta,
      ...chrome.footer.links,
      ...(chrome.footer.socialLinks ?? []),
    ];

    return links.some((link) => link.target === target);
  }
}
