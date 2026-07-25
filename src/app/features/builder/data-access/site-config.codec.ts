import { Injectable } from '@angular/core';

import {
  createDefaultFaqItems,
  createDefaultFeatures,
  createDefaultGalleryItems,
  createDefaultNavigation,
  createDefaultOffers,
  createDefaultTestimonials,
  createLegalLinks,
  createLink,
  createLinkFromText,
  createMapSearchUrl,
  normalizeLinkTarget,
} from '../domain/registry/block-registry';
import { isSafeMediaSource } from '../domain/utils/site-config-validation';
import {
  DEFAULT_BLOCK_APPEARANCE,
  DEFAULT_SITE_BUSINESS,
  DEFAULT_SITE_SEO,
  DEFAULT_SITE_THEME,
  SITE_CONFIG_SCHEMA_VERSION,
} from '../domain/models';
import type {
  BlockAppearanceOverrides,
  ButtonShape,
  CallToActionVariant,
  ContentMediaVariant,
  ContentWidth,
  FaqItem,
  FaqVariant,
  FeatureGridItem,
  FeatureGridVariant,
  FooterMapConfig,
  GalleryItem,
  GalleryVariant,
  HeaderBookingConfig,
  HeroContentAlignment,
  LandingAccentColor,
  LandingDensity,
  LandingDesignSettings,
  LandingFontPairing,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingOfferListVariant,
  LandingTemplateStyle,
  LeadFormFieldConfig,
  LinkConfig,
  MediaAsset,
  MediaAssetFocalPoint,
  OfferListItem,
  PageBlockConfig,
  PageConfig,
  SectionSpacing,
  SiteBusinessConfig,
  SiteConfig,
  SiteSeoConfig,
  SiteThemeConfig,
  TypeScale,
  TestimonialItem,
  TestimonialsVariant,
} from '../domain/models';

export type SiteConfigDecodeResult =
  | { readonly ok: true; readonly value: SiteConfig }
  | {
      readonly ok: false;
      readonly reason: 'invalid-json' | 'invalid-shape' | 'unsupported-schema';
    };

@Injectable({
  providedIn: 'root',
})
export class SiteConfigCodec {
  private fallbackIdCounter = 0;

  encode(siteConfig: SiteConfig): string {
    return JSON.stringify(siteConfig);
  }

  decode(serialized: string): SiteConfigDecodeResult {
    let value: unknown;

    try {
      value = JSON.parse(serialized) as unknown;
    } catch {
      return { ok: false, reason: 'invalid-json' };
    }

    return this.normalize(value);
  }

  normalize(value: unknown): SiteConfigDecodeResult {
    try {
      return this.normalizeValue(value);
    } catch {
      return { ok: false, reason: 'invalid-shape' };
    }
  }

  private normalizeValue(value: unknown): SiteConfigDecodeResult {
    const record = this.asRecord(value);

    if (record === null) {
      return { ok: false, reason: 'invalid-shape' };
    }

    const schemaVersion = record['schemaVersion'];

    if (
      typeof schemaVersion === 'number' &&
      schemaVersion !== 1 &&
      schemaVersion !== SITE_CONFIG_SCHEMA_VERSION
    ) {
      return { ok: false, reason: 'unsupported-schema' };
    }

    const siteConfig = this.normalizeSiteConfig(record);

    return siteConfig === null
      ? { ok: false, reason: 'invalid-shape' }
      : { ok: true, value: siteConfig };
  }

  private normalizeSiteConfig(value: unknown): SiteConfig | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const schemaVersion = record['schemaVersion'];

    if (schemaVersion !== 1 && schemaVersion !== SITE_CONFIG_SCHEMA_VERSION) {
      return null;
    }

    const pages = this.asArray(record['pages'])
      .map((page) => this.normalizePage(page))
      .filter((page): page is PageConfig => page !== null);

    if (pages.length === 0) {
      return null;
    }

    const name = this.readString(record['name'], 'Nexus demo');

    return {
      id: this.readString(record['id'], this.createId('site')),
      schemaVersion: SITE_CONFIG_SCHEMA_VERSION,
      name,
      theme: this.readTheme(record['theme']),
      business: this.readBusiness(record['business']),
      seo: this.readSeo(record['seo'], name),
      pages,
    };
  }

  private normalizePage(value: unknown): PageConfig | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('page')),
      slug: this.readString(record['slug'], 'home'),
      title: this.readString(record['title'], 'Главная'),
      blocks: this.asArray(record['blocks'])
        .map((block) => this.normalizeBlock(block))
        .filter((block): block is PageBlockConfig => block !== null),
    };
  }

  private normalizeBlock(value: unknown): PageBlockConfig | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const id = this.readString(record['id'], this.createId('block'));
    const anchor = this.readString(record['anchor'], id);
    const design = this.readDesign(record['design']);
    const appearance = this.readBlockAppearance(record['appearance']);
    const hidden = record['hidden'] === true;
    const styles = this.asRecord(record['styles']);

    switch (record['type']) {
      case 'siteHeader':
        return {
          id,
          anchor,
          type: 'siteHeader',
          appearance,
          hidden,
          design,
          inheritBusiness: record['inheritBusiness'] === true,
          variant: this.readHeaderVariant(record['variant']),
          brandName: this.readString(record['brandName'], 'Nexus Studio'),
          logo: this.readMedia(record['logo']),
          navigationItems: this.readLinksOrDefault(
            record['navigationItems'],
            createDefaultNavigation,
          ),
          cta: this.readLink(record['cta'], this.readString(record['ctaText'], 'Связаться')),
          booking: this.readBooking(record['booking']),
        };
      case 'hero':
        return {
          id,
          anchor,
          type: 'hero',
          appearance,
          hidden,
          design,
          title: this.readString(record['title'], 'Заголовок'),
          subtitle: this.readString(record['subtitle'], ''),
          buttonText: this.readString(record['buttonText'], 'Оставить заявку'),
          buttonHref: normalizeLinkTarget(this.readString(record['buttonHref'], '#lead-form')),
          media: this.readMedia(record['media']),
          secondaryButton: this.readOptionalLink(record['secondaryButton']),
          styles: {
            backgroundColor: this.readString(styles?.['backgroundColor'], '#f5f7fb'),
            textColor: this.readString(styles?.['textColor'], '#111827'),
            buttonBackgroundColor: this.readString(styles?.['buttonBackgroundColor'], '#111827'),
            buttonTextColor: this.readString(styles?.['buttonTextColor'], '#ffffff'),
            minHeight: this.readString(styles?.['minHeight'], '520px'),
            alignment: this.readHeroAlignment(styles?.['alignment']),
          },
        };
      case 'contentMedia':
        return {
          id,
          anchor,
          type: 'contentMedia',
          appearance,
          hidden,
          design,
          variant: this.readContentMediaVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'О нас'),
          title: this.readString(record['title'], 'Расскажите о главном'),
          body: this.readString(record['body'], 'Добавьте содержательное описание блока.'),
          cta: this.readOptionalLink(record['cta']),
          media: this.readMedia(record['media']),
        };
      case 'featureGrid':
        return {
          id,
          anchor,
          type: 'featureGrid',
          appearance,
          hidden,
          design,
          variant: this.readFeatureGridVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'Преимущества'),
          title: this.readString(record['title'], 'Почему выбирают нас'),
          description: this.readOptionalString(record['description']),
          items: this.readFeatureItems(record['items']),
        };
      case 'offerList':
        return {
          id,
          anchor,
          type: 'offerList',
          appearance,
          hidden,
          design,
          variant: this.readOfferVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'Предложения'),
          title: this.readString(record['title'], 'Что мы предлагаем'),
          items: this.readOfferItems(record['items']),
        };
      case 'gallery':
        return {
          id,
          anchor,
          type: 'gallery',
          appearance,
          hidden,
          design,
          variant: this.readGalleryVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'Галерея'),
          title: this.readString(record['title'], 'Посмотрите ближе'),
          description: this.readOptionalString(record['description']),
          items: this.readGalleryItems(record['items']),
          lightboxEnabled: record['lightboxEnabled'] !== false,
        };
      case 'testimonials':
        return {
          id,
          anchor,
          type: 'testimonials',
          appearance,
          hidden,
          design,
          variant: this.readTestimonialsVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'Отзывы'),
          title: this.readString(record['title'], 'Нам доверяют'),
          items: this.readTestimonialItems(record['items']),
        };
      case 'faq':
        return {
          id,
          anchor,
          type: 'faq',
          appearance,
          hidden,
          design,
          variant: this.readFaqVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'FAQ'),
          title: this.readString(record['title'], 'Частые вопросы'),
          description: this.readOptionalString(record['description']),
          items: this.readFaqItems(record['items']),
          allowMultipleOpen: record['allowMultipleOpen'] === true,
        };
      case 'callToAction':
        return {
          id,
          anchor,
          type: 'callToAction',
          appearance,
          hidden,
          design,
          variant: this.readCallToActionVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'Следующий шаг'),
          title: this.readString(record['title'], 'Готовы начать?'),
          text: this.readString(record['text'], 'Свяжитесь с нами, чтобы обсудить задачу.'),
          primaryAction: this.readLink(record['primaryAction'], 'Оставить заявку'),
          secondaryAction: this.readOptionalLink(record['secondaryAction']),
          media: this.readMedia(record['media']),
        };
      case 'siteFooter':
        return {
          id,
          anchor,
          type: 'siteFooter',
          appearance,
          hidden,
          design,
          inheritBusiness: record['inheritBusiness'] === true,
          variant: this.readFooterVariant(record['variant']),
          brandName: this.readString(record['brandName'], 'Nexus Studio'),
          logo: this.readMedia(record['logo']),
          cta: this.readLink(record['cta'], this.readString(record['ctaText'], 'Оставить заявку')),
          contactLines: this.readStringArray(record['contactLines']),
          links: this.readLinksOrDefault(record['links'], createLegalLinks),
          socialLinks: this.readOptionalLinks(record['socialLinks']),
          map: this.readMap(record['map']),
        };
      case 'leadForm':
        return {
          id,
          anchor,
          type: 'leadForm',
          appearance,
          hidden,
          design,
          title: this.readString(record['title'], 'Оставьте заявку'),
          description: this.readString(record['description'], ''),
          submitText: this.readString(record['submitText'], 'Отправить'),
          successMessage: this.readString(record['successMessage'], 'Заявка сохранена.'),
          fields: this.readLeadFields(record['fields']),
        };
      default:
        return null;
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asArray(value: unknown): readonly unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private readString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  }

  private readOptionalString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private readNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private clampNumber(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value));
  }

  private readStringArray(value: unknown): readonly string[] {
    return this.asArray(value)
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private readLinks(value: unknown): readonly LinkConfig[] {
    return this.asArray(value)
      .map((item, index) => {
        if (typeof item === 'string') {
          return createLinkFromText(item, index);
        }

        return this.readOptionalLink(item);
      })
      .filter((link): link is LinkConfig => link !== undefined);
  }

  private readLinksOrDefault(
    value: unknown,
    createDefault: () => readonly LinkConfig[],
  ): readonly LinkConfig[] {
    const links = this.readLinks(value);

    return links.length > 0 ? links : createDefault();
  }

  private readOptionalLinks(value: unknown): readonly LinkConfig[] | undefined {
    const links = this.readLinks(value);

    return links.length > 0 ? links : undefined;
  }

  private readLink(value: unknown, fallbackLabel: string): LinkConfig {
    const fallback = createLink(fallbackLabel, '#lead-form');
    const record = this.asRecord(value);

    if (record === null) {
      return fallback;
    }

    const target = normalizeLinkTarget(this.readString(record['target'], fallback.target));

    return {
      id: this.readString(record['id'], this.createId('link')),
      label: this.readString(record['label'], fallback.label),
      target,
      kind:
        record['kind'] === 'anchor' ||
        record['kind'] === 'internal' ||
        record['kind'] === 'external' ||
        record['kind'] === 'email' ||
        record['kind'] === 'phone'
          ? record['kind']
          : target.startsWith('#')
            ? 'anchor'
            : target.startsWith('mailto:')
              ? 'email'
              : target.startsWith('tel:')
                ? 'phone'
                : target.startsWith('https://')
                  ? 'external'
                  : 'internal',
      openInNewTab: record['openInNewTab'] === true,
    };
  }

  private readOptionalLink(value: unknown): LinkConfig | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return this.readLink(record, 'Подробнее');
  }

  private readMedia(value: unknown): MediaAsset | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    const src = this.readString(record['src'], '');

    if (!src || !isSafeMediaSource(src)) {
      return undefined;
    }

    return {
      src,
      alt: this.readString(record['alt'], 'Изображение блока'),
      focalPoint: this.readFocalPoint(record['focalPoint']),
    };
  }

  private readBooking(value: unknown): HeaderBookingConfig | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return {
      dateLabel: this.readString(record['dateLabel'], 'Сегодня'),
      partySizeLabel: this.readString(record['partySizeLabel'], '2 гостя'),
      action: this.readLink(record['action'], 'Проверить'),
    };
  }

  private readMap(value: unknown): FooterMapConfig | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    const address = this.readString(record['address'], '');
    const embedUrl = normalizeLinkTarget(this.readString(record['embedUrl'], '#contact'));

    return {
      label: this.readString(record['label'], 'Карта'),
      address,
      embedUrl: embedUrl.includes('maps.example.com') ? createMapSearchUrl(address) : embedUrl,
    };
  }

  private readOfferItem(value: unknown, index: number): OfferListItem {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        id: this.createId('offer'),
        title: `Пункт ${index + 1}`,
        description: 'Описание предложения.',
        meta: 'Новое',
      };
    }

    return {
      id: this.readString(record['id'], this.createId('offer')),
      title: this.readString(record['title'], `Пункт ${index + 1}`),
      description: this.readString(record['description'], 'Описание предложения.'),
      meta: this.readString(record['meta'], 'Новое'),
      price: typeof record['price'] === 'string' ? record['price'] : undefined,
      badge: typeof record['badge'] === 'string' ? record['badge'] : undefined,
      image: this.readMedia(record['image']),
      cta: this.readOptionalLink(record['cta']),
    };
  }

  private readOfferItems(value: unknown): readonly OfferListItem[] {
    const items = this.asArray(value).map((item, index) => this.readOfferItem(item, index));

    return items.length > 0 ? items : createDefaultOffers();
  }

  private readFeatureItem(value: unknown, index: number): FeatureGridItem {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        id: this.createId('feature'),
        title: `Преимущество ${index + 1}`,
        description: 'Опишите пользу для посетителя.',
      };
    }

    return {
      id: this.readString(record['id'], this.createId('feature')),
      icon: this.readOptionalString(record['icon']) || undefined,
      image: this.readMedia(record['image']),
      title: this.readString(record['title'], `Преимущество ${index + 1}`),
      description: this.readString(record['description'], 'Опишите пользу для посетителя.'),
      link: this.readOptionalLink(record['link']),
    };
  }

  private readFeatureItems(value: unknown): readonly FeatureGridItem[] {
    const items = this.asArray(value).map((item, index) => this.readFeatureItem(item, index));

    return items.length > 0 ? items : createDefaultFeatures();
  }

  private readGalleryItem(value: unknown): GalleryItem | null {
    const record = this.asRecord(value);
    const image = this.readMedia(record?.['image']);

    if (record === null || image === undefined) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('gallery')),
      image,
      caption: this.readOptionalString(record['caption']) || undefined,
    };
  }

  private readGalleryItems(value: unknown): readonly GalleryItem[] {
    const items = this.asArray(value)
      .map((item) => this.readGalleryItem(item))
      .filter((item): item is GalleryItem => item !== null);

    return items.length > 0 ? items : createDefaultGalleryItems();
  }

  private readTestimonialItem(value: unknown, index: number): TestimonialItem {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        id: this.createId('testimonial'),
        quote: 'Добавьте содержательный отзыв клиента.',
        author: `Клиент ${index + 1}`,
        role: '',
        rating: 5,
      };
    }

    return {
      id: this.readString(record['id'], this.createId('testimonial')),
      quote: this.readString(record['quote'], 'Добавьте содержательный отзыв клиента.'),
      author: this.readString(record['author'], `Клиент ${index + 1}`),
      role: this.readOptionalString(record['role']),
      avatar: this.readMedia(record['avatar']),
      rating: Math.round(this.clampNumber(this.readNumber(record['rating'], 5), 1, 5)),
    };
  }

  private readTestimonialItems(value: unknown): readonly TestimonialItem[] {
    const items = this.asArray(value).map((item, index) => this.readTestimonialItem(item, index));

    return items.length > 0 ? items : createDefaultTestimonials();
  }

  private readFaqItem(value: unknown, index: number): FaqItem {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        id: this.createId('faq'),
        question: `Вопрос ${index + 1}`,
        answer: 'Добавьте понятный и полезный ответ.',
        initiallyOpen: false,
      };
    }

    return {
      id: this.readString(record['id'], this.createId('faq')),
      question: this.readString(record['question'], `Вопрос ${index + 1}`),
      answer: this.readString(record['answer'], 'Добавьте понятный и полезный ответ.'),
      initiallyOpen: record['initiallyOpen'] === true,
    };
  }

  private readFaqItems(value: unknown): readonly FaqItem[] {
    const items = this.asArray(value).map((item, index) => this.readFaqItem(item, index));

    return items.length > 0 ? items : createDefaultFaqItems();
  }

  private readLeadField(value: unknown, index: number): LeadFormFieldConfig {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        id: `field-${index + 1}`,
        label: `Поле ${index + 1}`,
        type: 'text',
        placeholder: '',
        required: false,
        order: index + 1,
      };
    }

    return {
      id: this.readString(record['id'], `field-${index + 1}`),
      label: this.readString(record['label'], `Поле ${index + 1}`),
      type: this.readLeadFieldType(record['type']),
      placeholder: this.readString(record['placeholder'], ''),
      required: record['required'] === true,
      helpText: typeof record['helpText'] === 'string' ? record['helpText'] : undefined,
      order: this.readNumber(record['order'], index + 1),
    };
  }

  private readLeadFields(value: unknown): readonly LeadFormFieldConfig[] {
    const fields = this.asArray(value).map((field, index) => this.readLeadField(field, index));

    if (fields.length > 0) {
      return fields;
    }

    return [
      {
        id: this.createId('field'),
        label: 'Имя',
        type: 'text',
        placeholder: 'Как к вам обращаться',
        required: true,
        order: 1,
      },
      {
        id: this.createId('field'),
        label: 'Телефон или email',
        type: 'text',
        placeholder: '+7 999 000-00-00',
        required: true,
        order: 2,
      },
    ];
  }

  private readDesign(value: unknown): LandingDesignSettings | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return {
      accentColor: this.readAccentColor(record['accentColor']),
      fontPairing: this.readFontPairing(record['fontPairing']),
      density: this.readDensity(record['density']),
      templateStyle: this.readTemplateStyle(record['templateStyle']),
    };
  }

  private readTheme(value: unknown): SiteThemeConfig {
    const record = this.asRecord(value);

    if (record === null) {
      return { ...DEFAULT_SITE_THEME };
    }

    return {
      pageBackground: this.readString(record['pageBackground'], DEFAULT_SITE_THEME.pageBackground),
      surfaceColor: this.readString(record['surfaceColor'], DEFAULT_SITE_THEME.surfaceColor),
      textColor: this.readString(record['textColor'], DEFAULT_SITE_THEME.textColor),
      mutedTextColor: this.readString(record['mutedTextColor'], DEFAULT_SITE_THEME.mutedTextColor),
      accentColor: this.readString(record['accentColor'], DEFAULT_SITE_THEME.accentColor),
      fontPairing: this.readFontPairing(record['fontPairing']),
      typeScale: this.readTypeScale(record['typeScale']),
      contentWidth: this.readContentWidth(record['contentWidth']),
      sectionSpacing: this.readSectionSpacing(record['sectionSpacing']),
      buttonShape: this.readButtonShape(record['buttonShape']),
      radius: this.clampNumber(this.readNumber(record['radius'], DEFAULT_SITE_THEME.radius), 0, 32),
    };
  }

  private readBusiness(value: unknown): SiteBusinessConfig {
    const record = this.asRecord(value);

    if (record === null) {
      return { ...DEFAULT_SITE_BUSINESS };
    }

    return {
      brandName: this.readString(record['brandName'], DEFAULT_SITE_BUSINESS.brandName),
      logo: this.readMedia(record['logo']) ?? null,
      phone: this.readOptionalString(record['phone']),
      email: this.readOptionalString(record['email']),
      address: this.readOptionalString(record['address']),
      hours: this.readOptionalString(record['hours']),
      messengers: this.readLinks(record['messengers']),
      socialLinks: this.readLinks(record['socialLinks']),
    };
  }

  private readSeo(value: unknown, fallbackTitle: string): SiteSeoConfig {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        ...DEFAULT_SITE_SEO,
        title: fallbackTitle,
      };
    }

    return {
      title: this.readString(record['title'], fallbackTitle),
      description: this.readOptionalString(record['description']),
      language: this.readString(record['language'], DEFAULT_SITE_SEO.language),
      socialImage: this.readMedia(record['socialImage']) ?? null,
      favicon: this.readMedia(record['favicon']) ?? null,
    };
  }

  private readBlockAppearance(value: unknown): BlockAppearanceOverrides {
    const record = this.asRecord(value);

    if (record === null) {
      return { ...DEFAULT_BLOCK_APPEARANCE };
    }

    return {
      backgroundColor: this.readOptionalString(record['backgroundColor']) || undefined,
      textColor: this.readOptionalString(record['textColor']) || undefined,
      accentColor: this.readOptionalString(record['accentColor']) || undefined,
      contentWidth: this.readOptionalContentWidth(record['contentWidth']),
      spacing: this.readOptionalSectionSpacing(record['spacing']),
      fontPairing:
        record['fontPairing'] === undefined
          ? undefined
          : this.readFontPairing(record['fontPairing']),
      radius:
        typeof record['radius'] === 'number' && Number.isFinite(record['radius'])
          ? this.clampNumber(record['radius'], 0, 32)
          : undefined,
    };
  }

  private readFocalPoint(value: unknown): MediaAssetFocalPoint | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return {
      x: this.clampNumber(this.readNumber(record['x'], 50), 0, 100),
      y: this.clampNumber(this.readNumber(record['y'], 50), 0, 100),
    };
  }

  private readHeaderVariant(value: unknown): LandingHeaderVariant {
    switch (value) {
      case 'centeredHero':
      case 'splitMedia':
      case 'reservationBar':
      case 'editorial':
      case 'burgerMenu':
      case 'stretchedNav':
        return value;
      default:
        return 'centeredHero';
    }
  }

  private readContentMediaVariant(value: unknown): ContentMediaVariant {
    return value === 'textOnly' || value === 'mediaLeft' || value === 'mediaRight'
      ? value
      : 'mediaRight';
  }

  private readFeatureGridVariant(value: unknown): FeatureGridVariant {
    return value === 'cards' || value === 'editorialList' || value === 'numberedSteps'
      ? value
      : 'cards';
  }

  private readGalleryVariant(value: unknown): GalleryVariant {
    return value === 'uniformGrid' || value === 'collage' || value === 'strip'
      ? value
      : 'uniformGrid';
  }

  private readTestimonialsVariant(value: unknown): TestimonialsVariant {
    return value === 'cards' || value === 'featuredQuote' || value === 'compactList'
      ? value
      : 'cards';
  }

  private readFaqVariant(value: unknown): FaqVariant {
    return value === 'borderedAccordion' || value === 'separatedList' || value === 'twoColumns'
      ? value
      : 'borderedAccordion';
  }

  private readCallToActionVariant(value: unknown): CallToActionVariant {
    return value === 'banner' || value === 'split' || value === 'cover' ? value : 'banner';
  }

  private readOfferVariant(value: unknown): LandingOfferListVariant {
    switch (value) {
      case 'menuGrid':
      case 'roomCards':
      case 'pricingTable':
      case 'catalogGrid':
        return value;
      default:
        return 'catalogGrid';
    }
  }

  private readFooterVariant(value: unknown): LandingFooterVariant {
    switch (value) {
      case 'contactMap':
      case 'compactLegal':
      case 'socialLead':
      case 'bookingFooter':
        return value;
      default:
        return 'bookingFooter';
    }
  }

  private readHeroAlignment(value: unknown): HeroContentAlignment {
    return value === 'left' || value === 'right' ? value : 'center';
  }

  private readLeadFieldType(value: unknown): LeadFormFieldConfig['type'] {
    return value === 'email' || value === 'tel' || value === 'textarea' ? value : 'text';
  }

  private readAccentColor(value: unknown): LandingAccentColor {
    return value === 'blue' ||
      value === 'rose' ||
      value === 'violet' ||
      value === 'amber' ||
      value === 'teal'
      ? value
      : 'teal';
  }

  private readFontPairing(value: unknown): LandingFontPairing {
    return value === 'serif' || value === 'rounded' || value === 'grotesk' ? value : 'grotesk';
  }

  private readTypeScale(value: unknown): TypeScale {
    return value === 'compact' || value === 'display' || value === 'balanced'
      ? value
      : DEFAULT_SITE_THEME.typeScale;
  }

  private readContentWidth(value: unknown): ContentWidth {
    return this.readOptionalContentWidth(value) ?? DEFAULT_SITE_THEME.contentWidth;
  }

  private readOptionalContentWidth(value: unknown): ContentWidth | undefined {
    return value === 'narrow' || value === 'full' || value === 'wide' ? value : undefined;
  }

  private readSectionSpacing(value: unknown): SectionSpacing {
    return this.readOptionalSectionSpacing(value) ?? DEFAULT_SITE_THEME.sectionSpacing;
  }

  private readOptionalSectionSpacing(value: unknown): SectionSpacing | undefined {
    return value === 'compact' || value === 'spacious' || value === 'balanced' ? value : undefined;
  }

  private readButtonShape(value: unknown): ButtonShape {
    return value === 'square' || value === 'pill' || value === 'rounded'
      ? value
      : DEFAULT_SITE_THEME.buttonShape;
  }

  private readDensity(value: unknown): LandingDensity {
    return value === 'compact' || value === 'spacious' || value === 'balanced' ? value : 'balanced';
  }

  private readTemplateStyle(value: unknown): LandingTemplateStyle {
    return value === 'editorial' || value === 'conversion' || value === 'classic'
      ? value
      : 'classic';
  }

  private createId(prefix: string): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    this.fallbackIdCounter += 1;

    return `${prefix}-${Date.now().toString(36)}-${this.fallbackIdCounter.toString(36)}`;
  }
}
