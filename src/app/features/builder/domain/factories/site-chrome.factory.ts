import type {
  PageBlockConfig,
  SiteChromeConfig,
  SiteFooterBlockConfig,
  SiteHeaderBlockConfig,
} from '../models';
import { createDefaultBlock } from '../registry/block-registry';

export function createDefaultSiteChrome(
  currentBlocks: readonly PageBlockConfig[] = [],
): SiteChromeConfig {
  const header = createDefaultBlock('siteHeader', currentBlocks);
  const footer = createDefaultBlock('siteFooter', [...currentBlocks, header]);

  if (header.type !== 'siteHeader' || footer.type !== 'siteFooter') {
    throw new Error('The block registry returned an invalid site chrome block.');
  }

  return { header, footer };
}

export function isSiteHeaderBlock(
  block: PageBlockConfig | null | undefined,
): block is SiteHeaderBlockConfig {
  return block?.type === 'siteHeader';
}

export function isSiteFooterBlock(
  block: PageBlockConfig | null | undefined,
): block is SiteFooterBlockConfig {
  return block?.type === 'siteFooter';
}
