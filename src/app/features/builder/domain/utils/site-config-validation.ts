import { SITE_CONFIG_SCHEMA_VERSION } from '../models';
import type { PageBlockConfig, SiteConfig } from '../models';

export interface SiteConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateSiteConfig(siteConfig: SiteConfig): SiteConfigValidationResult {
  const errors: string[] = [];

  if (siteConfig.schemaVersion !== SITE_CONFIG_SCHEMA_VERSION) {
    errors.push('Версия схемы сайта не поддерживается.');
  }

  if (!siteConfig.id.trim()) {
    errors.push('У сайта отсутствует id.');
  }

  if (!siteConfig.name.trim()) {
    errors.push('У сайта отсутствует название.');
  }

  if (siteConfig.pages.length === 0) {
    errors.push('У сайта должна быть хотя бы одна страница.');
  }

  const anchors = new Set<string>();
  const blockIds = new Set<string>();

  for (const page of siteConfig.pages) {
    if (!page.id.trim()) {
      errors.push(`У страницы "${page.title}" отсутствует id.`);
    }

    if (!page.slug.trim()) {
      errors.push(`У страницы "${page.title}" отсутствует slug.`);
    }

    for (const block of page.blocks) {
      validateBlock(block, errors);

      if (blockIds.has(block.id)) {
        errors.push(`Дублируется id блока "${block.id}".`);
      }

      if (anchors.has(block.anchor)) {
        errors.push(`Дублируется anchor блока "${block.anchor}".`);
      }

      blockIds.add(block.id);
      anchors.add(block.anchor);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateBlock(block: PageBlockConfig, errors: string[]): void {
  if (!block.id.trim()) {
    errors.push('У блока отсутствует id.');
  }

  if (!block.anchor.trim()) {
    errors.push(`У блока "${block.id}" отсутствует anchor.`);
  }

  switch (block.type) {
    case 'siteHeader':
      validateText(block.brandName, block.id, 'бренд', errors);
      return;
    case 'hero':
      validateText(block.title, block.id, 'заголовок', errors);
      validateText(block.buttonText, block.id, 'CTA', errors);
      validateText(block.buttonHref, block.id, 'ссылка CTA', errors);
      return;
    case 'offerList':
      validateText(block.title, block.id, 'заголовок', errors);
      return;
    case 'siteFooter':
      validateText(block.brandName, block.id, 'бренд', errors);
      return;
    case 'leadForm':
      validateText(block.title, block.id, 'заголовок формы', errors);

      if (block.fields.length === 0) {
        errors.push(`У формы "${block.id}" нет полей.`);
      }

      return;
  }
}

function validateText(value: string, blockId: string, label: string, errors: string[]): void {
  if (!value.trim()) {
    errors.push(`У блока "${blockId}" пустое поле "${label}".`);
  }
}
