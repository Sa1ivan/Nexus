import { SITE_CONFIG_SCHEMA_VERSION } from '../models';
import type { LinkConfig, MediaAsset, PageBlockConfig, SiteConfig } from '../models';
import { isSafeLinkTarget } from './link-target';
import { isReservedPageSlug, normalizePageSlug } from './page-slug';

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

  validateSiteMetadata(siteConfig, errors);

  if (siteConfig.pages.length === 0) {
    errors.push('У сайта должна быть хотя бы одна страница.');
  }

  const blockIds = new Set<string>();
  const pageIds = new Set<string>();
  const pageSlugs = new Set<string>();

  for (const page of siteConfig.pages) {
    if (!page.id.trim()) {
      errors.push(`У страницы "${page.title}" отсутствует id.`);
    }

    if (!page.slug.trim()) {
      errors.push(`У страницы "${page.title}" отсутствует slug.`);
    } else if (page.slug !== normalizePageSlug(page.slug) || isReservedPageSlug(page.slug)) {
      errors.push(`У страницы "${page.title}" некорректный slug "${page.slug}".`);
    }

    validatePageSeo(page.title, page.seo, errors);

    if (pageIds.has(page.id)) {
      errors.push(`Дублируется id страницы "${page.id}".`);
    }

    if (pageSlugs.has(page.slug)) {
      errors.push(`Дублируется slug страницы "${page.slug}".`);
    }

    pageIds.add(page.id);
    pageSlugs.add(page.slug);

    const pageAnchors = new Set<string>();

    for (const block of page.blocks) {
      validateBlock(block, errors);

      if (blockIds.has(block.id)) {
        errors.push(`Дублируется id блока "${block.id}".`);
      }

      if (pageAnchors.has(block.anchor)) {
        errors.push(`На странице "${page.title}" дублируется anchor "${block.anchor}".`);
      }

      blockIds.add(block.id);
      pageAnchors.add(block.anchor);
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
      if (block.logo !== undefined) {
        validateMedia(block.logo, block.id, 'логотип', errors);
      }
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
        validateMedia(block.media, block.id, 'изображение', errors);
      }
      return;
    case 'contentMedia':
      validateText(block.title, block.id, 'заголовок', errors);
      validateText(block.body, block.id, 'текст', errors);
      if (block.cta !== undefined) {
        validateLink(block.cta, block.id, 'CTA', errors);
      }
      if (block.media !== undefined) {
        validateMedia(block.media, block.id, 'изображение', errors);
      }
      return;
    case 'featureGrid':
      validateText(block.title, block.id, 'заголовок', errors);
      validateCollection(block.items, block.id, 'преимущества', errors);
      for (const item of block.items) {
        validateText(item.id, block.id, 'id преимущества', errors);
        validateText(item.title, block.id, 'название преимущества', errors);
        validateText(item.description, block.id, 'описание преимущества', errors);
        if (item.image !== undefined) {
          validateMedia(item.image, block.id, 'изображение преимущества', errors);
        }
        if (item.link !== undefined) {
          validateLink(item.link, block.id, 'ссылка преимущества', errors);
        }
      }
      return;
    case 'offerList':
      validateText(block.title, block.id, 'заголовок', errors);
      validateCollection(block.items, block.id, 'предложения', errors);
      for (const item of block.items) {
        validateText(item.id, block.id, 'id карточки', errors);
        validateText(item.title, block.id, 'название карточки', errors);
        if (item.image !== undefined) {
          validateMedia(item.image, block.id, 'картинка карточки', errors);
        }
        if (item.cta !== undefined) {
          validateLink(item.cta, block.id, 'CTA карточки', errors);
        }
      }
      return;
    case 'gallery':
      validateText(block.title, block.id, 'заголовок', errors);
      validateCollection(block.items, block.id, 'изображения галереи', errors);
      for (const item of block.items) {
        validateText(item.id, block.id, 'id изображения галереи', errors);
        validateMedia(item.image, block.id, 'изображение галереи', errors);
      }
      return;
    case 'testimonials':
      validateText(block.title, block.id, 'заголовок', errors);
      validateCollection(block.items, block.id, 'отзывы', errors);
      for (const item of block.items) {
        validateText(item.id, block.id, 'id отзыва', errors);
        validateText(item.quote, block.id, 'текст отзыва', errors);
        validateText(item.author, block.id, 'автор отзыва', errors);
        if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5) {
          errors.push(`У блока "${block.id}" рейтинг отзыва должен быть от 1 до 5.`);
        }
        if (item.avatar !== undefined) {
          validateMedia(item.avatar, block.id, 'аватар автора', errors);
        }
      }
      return;
    case 'faq':
      validateText(block.title, block.id, 'заголовок', errors);
      validateCollection(block.items, block.id, 'вопросы', errors);
      for (const item of block.items) {
        validateText(item.id, block.id, 'id вопроса', errors);
        validateText(item.question, block.id, 'вопрос', errors);
        validateText(item.answer, block.id, 'ответ', errors);
      }
      return;
    case 'callToAction':
      validateText(block.title, block.id, 'заголовок', errors);
      validateText(block.text, block.id, 'текст', errors);
      validateLink(block.primaryAction, block.id, 'основная кнопка', errors);
      if (block.secondaryAction !== undefined) {
        validateLink(block.secondaryAction, block.id, 'вторичная кнопка', errors);
      }
      if (block.media !== undefined) {
        validateMedia(block.media, block.id, 'изображение', errors);
      }
      return;
    case 'siteFooter':
      validateText(block.brandName, block.id, 'бренд', errors);
      if (block.logo !== undefined) {
        validateMedia(block.logo, block.id, 'логотип', errors);
      }
      validateLink(block.cta, block.id, 'CTA', errors);
      validateLinks(block.links, block.id, 'ссылки футера', errors);
      if (block.socialLinks !== undefined) {
        validateLinks(block.socialLinks, block.id, 'социальные ссылки', errors, false);
      }
      if (block.map !== undefined) {
        validateHref(block.map.embedUrl, block.id, 'ссылка карты', errors);
      }
      return;
    case 'leadForm': {
      validateText(block.title, block.id, 'заголовок формы', errors);

      if (block.fields.length === 0) {
        errors.push(`У формы "${block.id}" нет полей.`);
      }

      const fieldIds = new Set<string>();
      for (const field of block.fields) {
        validateText(field.id, block.id, 'id поля формы', errors);
        if (fieldIds.has(field.id)) {
          errors.push(`У формы "${block.id}" дублируется id поля "${field.id}".`);
        }
        fieldIds.add(field.id);
        validateText(field.label, block.id, 'label поля формы', errors);
      }

      return;
    }
  }
}

function validateCollection<TItem extends { readonly id: string }>(
  items: readonly TItem[],
  blockId: string,
  label: string,
  errors: string[],
): void {
  if (items.length === 0) {
    errors.push(`У блока "${blockId}" пустой список "${label}".`);
    return;
  }

  const ids = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) {
      errors.push(`У блока "${blockId}" дублируется id элемента "${item.id}".`);
    }

    ids.add(item.id);
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
  requireItems = true,
): void {
  if (requireItems && links.length === 0) {
    errors.push(`У блока "${blockId}" пустой список "${label}".`);
  }

  const linkIds = new Set<string>();
  for (const link of links) {
    if (linkIds.has(link.id)) {
      errors.push(`У блока "${blockId}" дублируется id ссылки "${link.id}".`);
    }
    linkIds.add(link.id);
    validateLink(link, blockId, label, errors);
  }
}

function validateLink(link: LinkConfig, blockId: string, label: string, errors: string[]): void {
  validateText(link.id, blockId, `${label}: id`, errors);
  validateText(link.label, blockId, `${label}: текст`, errors);
  validateHref(link.target, blockId, `${label}: ссылка`, errors);
}

function validateHref(value: string, blockId: string, label: string, errors: string[]): void {
  validateText(value, blockId, label, errors);

  if (!isSafeLinkTarget(value)) {
    errors.push(`У блока "${blockId}" небезопасное поле "${label}".`);
  }
}

export function isSafeMediaSource(value: string): boolean {
  const normalizedValue = value.trim();
  const lowerCaseValue = normalizedValue.toLowerCase();

  if (
    lowerCaseValue.startsWith('http://') ||
    lowerCaseValue.startsWith('https://') ||
    normalizedValue.startsWith('#')
  ) {
    return true;
  }

  const match = /^data:image\/(jpeg|png|webp);base64,([a-z0-9+/]+={0,2})$/iu.exec(normalizedValue);

  if (match === null) {
    return false;
  }

  const mediaType = match[1]?.toLowerCase();
  const payload = match[2];

  if (payload === undefined || payload.length % 4 !== 0) {
    return false;
  }

  const paddingLength = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  const decodedLength = (payload.length / 4) * 3 - paddingLength;
  const bytes = decodeBase64Prefix(payload, 12);

  switch (mediaType) {
    case 'jpeg':
      return decodedLength >= 3 && startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
    case 'png':
      return (
        decodedLength >= 8 &&
        startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      );
    case 'webp':
      return (
        decodedLength >= 12 &&
        startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    default:
      return false;
  }
}

function validateSiteMetadata(siteConfig: SiteConfig, errors: string[]): void {
  const siteBlockId = 'site';

  validateText(siteConfig.theme.pageBackground, siteBlockId, 'фон страницы', errors);
  validateText(siteConfig.theme.surfaceColor, siteBlockId, 'цвет поверхности', errors);
  validateText(siteConfig.theme.textColor, siteBlockId, 'цвет текста', errors);
  validateText(siteConfig.theme.mutedTextColor, siteBlockId, 'приглушенный текст', errors);
  validateText(siteConfig.theme.accentColor, siteBlockId, 'акцент', errors);

  if (
    !Number.isFinite(siteConfig.theme.radius) ||
    siteConfig.theme.radius < 0 ||
    siteConfig.theme.radius > 32
  ) {
    errors.push('Радиус темы должен быть в диапазоне от 0 до 32.');
  }

  validateText(siteConfig.business.brandName, siteBlockId, 'бренд', errors);
  validateLinks(siteConfig.business.messengers, siteBlockId, 'мессенджеры', errors, false);
  validateLinks(siteConfig.business.socialLinks, siteBlockId, 'социальные ссылки', errors, false);
  validateText(siteConfig.seo.language, siteBlockId, 'язык сайта', errors);

  if (siteConfig.business.logo !== null) {
    validateMedia(siteConfig.business.logo, siteBlockId, 'логотип', errors);
  }

  if (siteConfig.seo.favicon !== null) {
    validateMedia(siteConfig.seo.favicon, siteBlockId, 'favicon', errors);
  }
}

function validatePageSeo(
  pageTitle: string,
  seo: SiteConfig['pages'][number]['seo'],
  errors: string[],
): void {
  const titleLength = seo.title.trim().length;

  if (titleLength < 1 || titleLength > 70) {
    errors.push(`У страницы "${pageTitle}" SEO title должен содержать от 1 до 70 символов.`);
  }

  if (seo.description.length > 180) {
    errors.push(`У страницы "${pageTitle}" SEO description не должен превышать 180 символов.`);
  }

  if (seo.socialImage !== null) {
    validateMedia(seo.socialImage, `page:${pageTitle}`, 'social image', errors);
  }
}

function validateMedia(media: MediaAsset, blockId: string, label: string, errors: string[]): void {
  validateText(media.src, blockId, label, errors);
  validateText(media.alt, blockId, `alt ${label}`, errors);

  if (media.src.trim() && !isSafeMediaSource(media.src)) {
    errors.push(`У блока "${blockId}" небезопасное поле "${label}".`);
  }
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64Prefix(payload: string, maximumBytes: number): readonly number[] {
  const bytes: number[] = [];
  const unpaddedPayload = payload.replace(/=+$/u, '');
  let buffer = 0;
  let bitCount = 0;

  for (const character of unpaddedPayload) {
    const value = BASE64_ALPHABET.indexOf(character);

    if (value === -1) {
      return [];
    }

    buffer = (buffer << 6) | value;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((buffer >> bitCount) & 0xff);
      buffer = bitCount === 0 ? 0 : buffer & ((1 << bitCount) - 1);

      if (bytes.length === maximumBytes) {
        break;
      }
    }
  }

  return bytes;
}

function startsWithBytes(bytes: readonly number[], signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}
