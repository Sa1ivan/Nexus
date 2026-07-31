import type { PageBlockConfig, PageConfig, SiteChromeConfig } from '../models';

export function isSiteChromeBlock(block: PageBlockConfig): boolean {
  return block.type === 'siteHeader' || block.type === 'siteFooter';
}

export function composeSitePageBlocks(
  chrome: SiteChromeConfig,
  page: PageConfig | null | undefined,
): readonly PageBlockConfig[] {
  if (page === null || page === undefined) {
    return [];
  }

  return [
    chrome.header,
    ...page.blocks.filter((block) => !isSiteChromeBlock(block)),
    chrome.footer,
  ];
}
