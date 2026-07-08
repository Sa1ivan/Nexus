import { SITE_CONFIG_SCHEMA_VERSION } from '../models';
import type { LinkConfig, PageBlockConfig, SiteConfig } from '../models';

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
  const pageIds = new Set<string>();
  const pageSlugs = new Set<string>();

  for (const page of siteConfig.pages) {
    if (!page.id.trim()) {
      errors.push(`У страницы "${page.title}" отсутствует id.`);
    }

    if (!page.slug.trim()) {
      errors.push(`У страницы "${page.title}" отсутствует slug.`);
    }

    if (pageIds.has(page.id)) {
      errors.push(`Дублируется id страницы "${page.id}".`);
    }

    if (pageSlugs.has(page.slug)) {
      errors.push(`Дублируется slug страницы "${page.slug}".`);
    }

    pageIds.add(page.id);
    pageSlugs.add(page.slug);

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
      validateLinks(block.navigationItems, block.id, 'навигация', errors);
      validateLink(block.cta, block.id, 'CTA', errors);
      if (block.booking !== undefined) {
        validateLink(block.booking.action, block.id, 'booking CTA', errors);
      }
      return;
    case 'hero':
      validateText(block.title, block.id, 'заголовок', errors);
      validateText(block.buttonText, block.id, 'CTA', errors);
      validateHref(block.buttonHref, block.id, 'ссылка CTA', errors);
      if (block.secondaryButton !== undefined) {
        validateLink(block.secondaryButton, block.id, 'вторичная кнопка', errors);
      }
      if (block.media !== undefined) {
        validateText(block.media.src, block.id, 'изображение', errors);
        validateText(block.media.alt, block.id, 'alt изображения', errors);
      }
      return;
    case 'offerList':
      validateText(block.title, block.id, 'заголовок', errors);
      for (const item of block.items) {
        validateText(item.title, block.id, 'название карточки', errors);
        if (item.image !== undefined) {
          validateText(item.image.src, block.id, 'картинка карточки', errors);
          validateText(item.image.alt, block.id, 'alt карточки', errors);
        }
        if (item.cta !== undefined) {
          validateLink(item.cta, block.id, 'CTA карточки', errors);
        }
      }
      return;
    case 'siteFooter':
      validateText(block.brandName, block.id, 'бренд', errors);
      validateLink(block.cta, block.id, 'CTA', errors);
      validateLinks(block.links, block.id, 'ссылки футера', errors);
      if (block.socialLinks !== undefined) {
        validateLinks(block.socialLinks, block.id, 'социальные ссылки', errors);
      }
      return;
    case 'leadForm':
      validateText(block.title, block.id, 'заголовок формы', errors);

      if (block.fields.length === 0) {
        errors.push(`У формы "${block.id}" нет полей.`);
      }

      for (const field of block.fields) {
        validateText(field.id, block.id, 'id поля формы', errors);
        validateText(field.label, block.id, 'label поля формы', errors);
      }

      return;
  }
}

function validateText(value: string, blockId: string, label: string, errors: string[]): void {
  if (!value.trim()) {
    errors.push(`У блока "${blockId}" пустое поле "${label}".`);
  }
}

function validateLinks(
  links: readonly LinkConfig[],
  blockId: string,
  label: string,
  errors: string[],
): void {
  if (links.length === 0) {
    errors.push(`У блока "${blockId}" пустой список "${label}".`);
  }

  for (const link of links) {
    validateLink(link, blockId, label, errors);
  }
}

function validateLink(link: LinkConfig, blockId: string, label: string, errors: string[]): void {
  validateText(link.label, blockId, `${label}: текст`, errors);
  validateHref(link.target, blockId, `${label}: ссылка`, errors);
}

function validateHref(value: string, blockId: string, label: string, errors: string[]): void {
  validateText(value, blockId, label, errors);

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue.startsWith('javascript:') || normalizedValue.startsWith('data:')) {
    errors.push(`У блока "${blockId}" небезопасное поле "${label}".`);
  }
}
