import {
  DEFAULT_BLOCK_APPEARANCE,
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
} from '../models';
import { createBlockAnchor, createBlockId } from '../utils/builder-ids';
export { normalizeLinkTarget } from '../utils/link-target';
import type {
  BlockType,
  HeaderBookingConfig,
  HeroBlockStyles,
  FaqItem,
  FeatureGridItem,
  GalleryItem,
  LinkConfig,
  OfferListItem,
  PageBlockConfig,
  TestimonialItem,
} from '../models';
import type { BlockDefinition, CloneBlockOptions } from './block-registry.types';

export type {
  BlockDefinition,
  BlockVariantOption,
  CloneBlockOptions,
} from './block-registry.types';

const DEFAULT_HERO_STYLES: HeroBlockStyles = {
  backgroundColor: '#f5f7fb',
  textColor: '#111827',
  buttonBackgroundColor: '#111827',
  buttonTextColor: '#ffffff',
  minHeight: '520px',
  alignment: 'center',
};

const DEFAULT_LINK_TARGETS: readonly string[] = ['#hero', '#offers', '#lead-form', '#contact'];
let fallbackElementId = 0;

export const BLOCK_DEFINITIONS: Readonly<Record<BlockType, BlockDefinition>> = {
  siteHeader: {
    type: 'siteHeader',
    label: 'Хедер',
    description: 'Логотип, меню, CTA и быстрые сценарии.',
    icon: 'web_asset',
    anchorBase: 'header',
    renderer: 'SiteHeaderBlockComponent',
    inspector: 'SiteHeaderInspector',
    variants: [
      {
        id: 'centeredHero',
        label: 'Центр',
        description: 'Логотип и меню по центру.',
        icon: 'vertical_align_center',
      },
      {
        id: 'splitMedia',
        label: 'Split',
        description: 'Сбалансированная навигация для медиа-hero.',
        icon: 'splitscreen',
      },
      {
        id: 'reservationBar',
        label: 'Бронь',
        description: 'Дата, гости и CTA прямо в хедере.',
        icon: 'event_available',
      },
      {
        id: 'editorial',
        label: 'Журнал',
        description: 'Типографичный премиальный хедер.',
        icon: 'auto_stories',
      },
      {
        id: 'burgerMenu',
        label: 'Бургер',
        description: 'Компактное меню для простого первого экрана.',
        icon: 'menu',
      },
      {
        id: 'stretchedNav',
        label: 'Растянутый',
        description: 'Навигационные кнопки занимают всю ширину.',
        icon: 'width_full',
      },
    ],
  },
  hero: {
    type: 'hero',
    label: 'Hero',
    description: 'Первый экран, оффер, кнопки и медиа.',
    icon: 'auto_awesome',
    anchorBase: 'hero',
    renderer: 'HeroBlockComponent',
    inspector: 'HeroInspector',
    variants: [],
  },
  contentMedia: {
    type: 'contentMedia',
    label: 'Текст и медиа',
    description: 'История, изображение и переход к следующему шагу.',
    icon: 'chrome_reader_mode',
    anchorBase: 'about',
    renderer: 'ContentMediaBlockComponent',
    inspector: 'ContentMediaInspector',
    variants: [
      {
        id: 'textOnly',
        label: 'Текст',
        description: 'Сфокусированный текст без медиа.',
        icon: 'notes',
      },
      {
        id: 'mediaLeft',
        label: 'Медиа слева',
        description: 'Изображение открывает секцию.',
        icon: 'view_sidebar',
      },
      {
        id: 'mediaRight',
        label: 'Медиа справа',
        description: 'Текст ведет к изображению.',
        icon: 'splitscreen',
      },
    ],
  },
  featureGrid: {
    type: 'featureGrid',
    label: 'Преимущества',
    description: 'Возможности, этапы или ключевые аргументы.',
    icon: 'grid_view',
    anchorBase: 'features',
    renderer: 'FeatureGridBlockComponent',
    inspector: 'FeatureGridInspector',
    variants: [
      {
        id: 'cards',
        label: 'Карточки',
        description: 'Визуальная сетка преимуществ.',
        icon: 'dashboard',
      },
      {
        id: 'editorialList',
        label: 'Список',
        description: 'Спокойная редакционная подача.',
        icon: 'view_agenda',
      },
      {
        id: 'numberedSteps',
        label: 'Этапы',
        description: 'Нумерованный процесс по шагам.',
        icon: 'format_list_numbered',
      },
    ],
  },
  offerList: {
    type: 'offerList',
    label: 'Предложения',
    description: 'Карточки продуктов, услуг, цен и CTA.',
    icon: 'view_module',
    anchorBase: 'offers',
    renderer: 'OfferListBlockComponent',
    inspector: 'OfferListInspector',
    variants: [
      {
        id: 'menuGrid',
        label: 'Меню',
        description: 'Сетка с изображениями и ценами.',
        icon: 'restaurant_menu',
      },
      {
        id: 'roomCards',
        label: 'Номера',
        description: 'Карточки с фото и условиями.',
        icon: 'king_bed',
      },
      {
        id: 'pricingTable',
        label: 'Прайс',
        description: 'Сравнение пакетов и тарифов.',
        icon: 'table_chart',
      },
      {
        id: 'catalogGrid',
        label: 'Каталог',
        description: 'Продуктовая сетка с CTA.',
        icon: 'widgets',
      },
    ],
  },
  gallery: {
    type: 'gallery',
    label: 'Галерея',
    description: 'Фотографии, подписи и полноэкранный просмотр.',
    icon: 'photo_library',
    anchorBase: 'gallery',
    renderer: 'GalleryBlockComponent',
    inspector: 'GalleryInspector',
    variants: [
      {
        id: 'uniformGrid',
        label: 'Сетка',
        description: 'Ровная сетка изображений.',
        icon: 'grid_on',
      },
      {
        id: 'collage',
        label: 'Коллаж',
        description: 'Акцентная журнальная композиция.',
        icon: 'view_quilt',
      },
      {
        id: 'strip',
        label: 'Лента',
        description: 'Горизонтальная лента кадров.',
        icon: 'view_week',
      },
    ],
  },
  testimonials: {
    type: 'testimonials',
    label: 'Отзывы',
    description: 'Цитаты клиентов, авторы и рейтинг.',
    icon: 'reviews',
    anchorBase: 'testimonials',
    renderer: 'TestimonialsBlockComponent',
    inspector: 'TestimonialsInspector',
    variants: [
      {
        id: 'cards',
        label: 'Карточки',
        description: 'Несколько равноправных отзывов.',
        icon: 'view_module',
      },
      {
        id: 'featuredQuote',
        label: 'Цитата',
        description: 'Один отзыв становится главным.',
        icon: 'format_quote',
      },
      {
        id: 'compactList',
        label: 'Список',
        description: 'Компактная лента доверия.',
        icon: 'view_list',
      },
    ],
  },
  faq: {
    type: 'faq',
    label: 'FAQ',
    description: 'Ответы на частые вопросы с доступным раскрытием.',
    icon: 'quiz',
    anchorBase: 'faq',
    renderer: 'FaqBlockComponent',
    inspector: 'FaqInspector',
    variants: [
      {
        id: 'borderedAccordion',
        label: 'Аккордеон',
        description: 'Собранные вопросы в рамках.',
        icon: 'expand',
      },
      {
        id: 'separatedList',
        label: 'Список',
        description: 'Воздушные разделенные строки.',
        icon: 'view_headline',
      },
      {
        id: 'twoColumns',
        label: '2 колонки',
        description: 'Плотная справочная раскладка.',
        icon: 'view_column',
      },
    ],
  },
  callToAction: {
    type: 'callToAction',
    label: 'Призыв к действию',
    description: 'Финальный аргумент, кнопки и дополнительное медиа.',
    icon: 'campaign',
    anchorBase: 'cta',
    renderer: 'CallToActionBlockComponent',
    inspector: 'CallToActionInspector',
    variants: [
      {
        id: 'banner',
        label: 'Баннер',
        description: 'Компактная горизонтальная полоса.',
        icon: 'view_stream',
      },
      {
        id: 'split',
        label: 'Split',
        description: 'Текст и изображение рядом.',
        icon: 'splitscreen',
      },
      {
        id: 'cover',
        label: 'Обложка',
        description: 'Текст поверх полноразмерного медиа.',
        icon: 'panorama',
      },
    ],
  },
  siteFooter: {
    type: 'siteFooter',
    label: 'Футер',
    description: 'Контакты, ссылки, карта и финальный CTA.',
    icon: 'call_to_action',
    anchorBase: 'contact',
    renderer: 'SiteFooterBlockComponent',
    inspector: 'SiteFooterInspector',
    variants: [
      {
        id: 'contactMap',
        label: 'Карта',
        description: 'Контакты и настраиваемая карта.',
        icon: 'map',
      },
      {
        id: 'compactLegal',
        label: 'Компактный',
        description: 'Служебные ссылки без лишнего CTA.',
        icon: 'notes',
      },
      {
        id: 'socialLead',
        label: 'Соцсети',
        description: 'Социальные ссылки и подписка.',
        icon: 'groups',
      },
      {
        id: 'bookingFooter',
        label: 'CTA',
        description: 'Финальный призыв и контакты.',
        icon: 'touch_app',
      },
    ],
  },
  leadForm: {
    type: 'leadForm',
    label: 'Форма',
    description: 'Поля заявки, сообщения и валидация.',
    icon: 'dynamic_form',
    anchorBase: 'lead-form',
    renderer: 'LeadFormBlockComponent',
    inspector: 'LeadFormInspector',
    variants: [],
  },
} as const;

export const BLOCK_PALETTE = Object.values(BLOCK_DEFINITIONS);

export function createDefaultBlock(
  type: BlockType,
  currentBlocks: readonly PageBlockConfig[],
): PageBlockConfig {
  const id = createBlockId(type);
  const anchor = createBlockAnchor(
    type,
    currentBlocks.map((block) => block.anchor),
  );
  const design = DEFAULT_LANDING_DESIGN_SETTINGS;

  switch (type) {
    case 'siteHeader':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        inheritBusiness: true,
        variant: 'stretchedNav',
        brandName: 'Nexus Studio',
        logo: undefined,
        navigationItems: createDefaultNavigation(),
        cta: createLink('Связаться', '#lead-form'),
        booking: createDefaultBooking(),
      };
    case 'hero':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        title: 'Большой ясный оффер для нового блока',
        subtitle: 'Опишите ценность, сценарий и следующий шаг для посетителя.',
        buttonText: 'Начать',
        buttonHref: '#lead-form',
        secondaryButton: createLink('Посмотреть предложения', '#offers'),
        media: {
          src: 'images/landing/office-studio.webp',
          alt: 'Рабочее пространство и экран конструктора',
          focalPoint: { x: 50, y: 50 },
        },
        styles: DEFAULT_HERO_STYLES,
      };
    case 'contentMedia':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        variant: 'mediaRight',
        eyebrow: 'О нас',
        title: 'Покажите контекст, который помогает принять решение',
        body: 'Расскажите о подходе, продукте или команде без общих фраз. Добавьте факты, процесс и понятный следующий шаг.',
        cta: createLink('Узнать подробнее', '#lead-form'),
        media: {
          src: 'images/landing/office-collaboration.webp',
          alt: 'Команда обсуждает проект за общим столом',
          focalPoint: { x: 50, y: 50 },
        },
      };
    case 'featureGrid':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        variant: 'cards',
        eyebrow: 'Преимущества',
        title: 'Все важное видно с первого взгляда',
        description: 'Соберите сильные аргументы в ясную структуру.',
        items: createDefaultFeatures(),
      };
    case 'offerList':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        variant: 'catalogGrid',
        eyebrow: 'Подборка',
        title: 'Что можно показать в этом блоке',
        items: createDefaultOffers(),
      };
    case 'gallery':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        variant: 'collage',
        eyebrow: 'Галерея',
        title: 'Покажите результат без лишних обещаний',
        description: 'Фотографии проекта, пространства или продукта.',
        items: createDefaultGalleryItems(),
        lightboxEnabled: true,
      };
    case 'testimonials':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        variant: 'cards',
        eyebrow: 'Отзывы',
        title: 'Что говорят после работы с нами',
        items: createDefaultTestimonials(),
      };
    case 'faq':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        variant: 'borderedAccordion',
        eyebrow: 'FAQ',
        title: 'Ответы до того, как вы спросите',
        description: 'Сроки, процесс, оплата и другие важные детали.',
        items: createDefaultFaqItems(),
        allowMultipleOpen: false,
      };
    case 'callToAction':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        variant: 'banner',
        eyebrow: 'Следующий шаг',
        title: 'Готовы обсудить ваш лендинг?',
        text: 'Оставьте заявку, и мы разберем задачу, сроки и подходящий формат.',
        primaryAction: createLink('Оставить заявку', '#lead-form'),
        secondaryAction: createLink('Посмотреть работы', '#gallery'),
      };
    case 'siteFooter':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        inheritBusiness: true,
        variant: 'bookingFooter',
        brandName: 'Nexus Studio',
        logo: undefined,
        cta: createLink('Оставить заявку', '#lead-form'),
        contactLines: ['hello@nexus.app', '+7 999 000-00-00', 'Ответ в течение дня'],
        links: createLegalLinks(),
        socialLinks: [
          createExternalLink('Telegram', 'https://t.me/nexus'),
          createExternalLink('VK', 'https://vk.com/nexus'),
        ],
        map: {
          label: 'Открыть карту',
          address: 'Москва, Тверская 12',
          embedUrl: createMapSearchUrl('Москва, Тверская 12'),
        },
      };
    case 'leadForm':
      return {
        id,
        anchor,
        type,
        appearance: DEFAULT_BLOCK_APPEARANCE,
        hidden: false,
        design,
        title: 'Оставьте заявку',
        description: 'Напишите, что нужно собрать, и мы вернемся с понятным следующим шагом.',
        submitText: 'Отправить',
        successMessage: 'Заявка сохранена. Мы скоро свяжемся с вами.',
        fields: [
          {
            id: 'name',
            label: 'Имя',
            type: 'text',
            placeholder: 'Как к вам обращаться',
            required: true,
            helpText: 'Имя для обращения в ответе.',
            order: 1,
          },
          {
            id: 'contact',
            label: 'Телефон или email',
            type: 'text',
            placeholder: '+7 999 000-00-00',
            required: true,
            helpText: 'Любой удобный контакт.',
            order: 2,
          },
        ],
      };
  }
}

export function cloneRegisteredBlock(
  block: PageBlockConfig,
  currentBlocks: readonly PageBlockConfig[],
  options: CloneBlockOptions = {},
): PageBlockConfig {
  const id = createBlockId(block.type);
  const anchor =
    options.preserveAnchor === true
      ? block.anchor
      : createBlockAnchor(
          block.type,
          currentBlocks.map((currentBlock) => currentBlock.anchor),
        );

  switch (block.type) {
    case 'siteHeader':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        logo: cloneMedia(block.logo),
        navigationItems: block.navigationItems.map(cloneLink),
        cta: cloneLink(block.cta),
        booking:
          block.booking === undefined
            ? undefined
            : {
                ...block.booking,
                action: cloneLink(block.booking.action),
              },
      };
    case 'hero':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        media: cloneMedia(block.media),
        secondaryButton:
          block.secondaryButton === undefined ? undefined : cloneLink(block.secondaryButton),
        styles: {
          ...block.styles,
        },
      };
    case 'contentMedia':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        cta: block.cta === undefined ? undefined : cloneLink(block.cta),
        media: cloneMedia(block.media),
      };
    case 'featureGrid':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        items: block.items.map((item) => ({
          ...item,
          id: createElementId('feature'),
          image: cloneMedia(item.image),
          link: item.link === undefined ? undefined : cloneLink(item.link),
        })),
      };
    case 'offerList':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        items: block.items.map((item) => ({
          ...item,
          id: createElementId('offer'),
          image: cloneMedia(item.image),
          cta: item.cta === undefined ? undefined : cloneLink(item.cta),
        })),
      };
    case 'gallery':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        items: block.items.map((item) => ({
          ...item,
          id: createElementId('gallery'),
          image: cloneRequiredMedia(item.image),
        })),
      };
    case 'testimonials':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        items: block.items.map((item) => ({
          ...item,
          id: createElementId('testimonial'),
          avatar: cloneMedia(item.avatar),
        })),
      };
    case 'faq':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        items: block.items.map((item) => ({ ...item, id: createElementId('faq') })),
      };
    case 'callToAction':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        primaryAction: cloneLink(block.primaryAction),
        secondaryAction:
          block.secondaryAction === undefined ? undefined : cloneLink(block.secondaryAction),
        media: cloneMedia(block.media),
      };
    case 'siteFooter':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        logo: cloneMedia(block.logo),
        cta: cloneLink(block.cta),
        contactLines: [...block.contactLines],
        links: block.links.map(cloneLink),
        socialLinks: block.socialLinks?.map(cloneLink),
        map: block.map === undefined ? undefined : { ...block.map },
      };
    case 'leadForm':
      return {
        ...block,
        id,
        anchor,
        appearance: cloneAppearance(block.appearance),
        fields: block.fields.map((field) => ({ ...field })),
      };
  }
}

export function createLink(label: string, target: string): LinkConfig {
  return {
    id: createElementId('link'),
    label,
    target,
    kind: inferLinkKind(target),
    openInNewTab: false,
  };
}

export function createExternalLink(label: string, target: string): LinkConfig {
  return {
    id: createElementId('link'),
    label,
    target,
    kind: 'external',
    openInNewTab: true,
  };
}

export function createMapSearchUrl(address: string): string {
  const normalizedAddress = address.trim();

  return normalizedAddress
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(normalizedAddress)}`
    : '#contact';
}

export function createLinkFromText(label: string, index: number): LinkConfig {
  return createLink(label, DEFAULT_LINK_TARGETS[index % DEFAULT_LINK_TARGETS.length] ?? '#');
}

export function createDefaultNavigation(): readonly LinkConfig[] {
  return ['Оффер', 'Преимущества', 'Контакты'].map((label, index) =>
    createLinkFromText(label, index),
  );
}

export function createLegalLinks(): readonly LinkConfig[] {
  return [
    createLink('Условия', '#contact'),
    createLink('Контакты', '#contact'),
    createLink('Политика', '#contact'),
  ];
}

export function createDefaultBooking(): HeaderBookingConfig {
  return {
    dateLabel: 'Сегодня',
    partySizeLabel: '2 гостя',
    action: createLink('Проверить', '#lead-form'),
  };
}

export function createDefaultOffers(): readonly OfferListItem[] {
  return [
    {
      id: createElementId('offer'),
      title: 'Первый пункт',
      description: 'Короткое описание пользы, услуги или продукта.',
      meta: 'База',
      price: 'от 4 900 ₽',
      badge: 'Популярно',
      image: {
        src: 'images/landing/product-1.webp',
        alt: 'Пример продукта или услуги',
      },
      cta: createLink('Подробнее', '#lead-form'),
    },
    {
      id: createElementId('offer'),
      title: 'Второй пункт',
      description: 'Добавьте детали, цену, срок или формат работы.',
      meta: 'Про',
      price: 'от 9 900 ₽',
      image: {
        src: 'images/landing/office-open.webp',
        alt: 'Карточка предложения с рабочими материалами',
      },
      cta: createLink('Выбрать', '#lead-form'),
    },
    {
      id: createElementId('offer'),
      title: 'Третий пункт',
      description: 'Закройте список сильным аргументом для заявки.',
      meta: 'Плюс',
      price: 'индивидуально',
      image: {
        src: 'images/landing/product-3.webp',
        alt: 'Команда обсуждает предложение',
      },
      cta: createLink('Обсудить', '#lead-form'),
    },
  ];
}

export function createDefaultFeatures(): readonly FeatureGridItem[] {
  return [
    {
      id: createElementId('feature'),
      icon: 'speed',
      title: 'Быстрый старт',
      description: 'Начните с готовой структуры и адаптируйте ее под свою задачу.',
      link: createLink('Как это работает', '#about'),
    },
    {
      id: createElementId('feature'),
      icon: 'tune',
      title: 'Гибкая настройка',
      description: 'Меняйте контент, композицию, медиа и визуальный характер секции.',
      link: createLink('Посмотреть блоки', '#gallery'),
    },
    {
      id: createElementId('feature'),
      icon: 'verified',
      title: 'Готово к публикации',
      description: 'Соберите цельный лендинг с рабочими ссылками и формой заявки.',
      link: createLink('Оставить заявку', '#lead-form'),
    },
  ];
}

export function createDefaultGalleryItems(): readonly GalleryItem[] {
  return [
    {
      id: createElementId('gallery'),
      image: {
        src: 'images/landing/office-studio.webp',
        alt: 'Светлое рабочее пространство современной студии',
        focalPoint: { x: 50, y: 50 },
      },
      caption: 'Рабочее пространство',
    },
    {
      id: createElementId('gallery'),
      image: {
        src: 'images/landing/office-open.webp',
        alt: 'Команда работает в открытом офисе',
        focalPoint: { x: 50, y: 50 },
      },
      caption: 'Команда в процессе',
    },
    {
      id: createElementId('gallery'),
      image: {
        src: 'images/landing/product-1.webp',
        alt: 'Совместное обсуждение проекта за столом',
        focalPoint: { x: 50, y: 50 },
      },
      caption: 'Проектная встреча',
    },
    {
      id: createElementId('gallery'),
      image: {
        src: 'images/landing/product-2.webp',
        alt: 'Специалисты обсуждают результаты на экране',
        focalPoint: { x: 50, y: 50 },
      },
      caption: 'Презентация результата',
    },
  ];
}

export function createDefaultTestimonials(): readonly TestimonialItem[] {
  return [
    {
      id: createElementId('testimonial'),
      quote: 'Мы быстро собрали ясную структуру и наконец показали продукт без лишних слов.',
      author: 'Анна Крылова',
      role: 'Основатель студии',
      rating: 5,
    },
    {
      id: createElementId('testimonial'),
      quote: 'Все ключевые блоки уже были на месте, а каждый элемент можно было адаптировать.',
      author: 'Илья Соколов',
      role: 'Руководитель продукта',
      rating: 5,
    },
    {
      id: createElementId('testimonial'),
      quote: 'Лендинг одинаково хорошо читается на телефоне и большом экране.',
      author: 'Мария Белова',
      role: 'Маркетолог',
      rating: 4,
    },
  ];
}

export function createDefaultFaqItems(): readonly FaqItem[] {
  return [
    {
      id: createElementId('faq'),
      question: 'Можно ли заменить весь текст и изображения?',
      answer: 'Да. Контент каждого блока хранится отдельно и доступен для редактирования.',
      initiallyOpen: true,
    },
    {
      id: createElementId('faq'),
      question: 'Лендинг адаптируется под мобильные устройства?',
      answer: 'Все композиции перестраиваются под узкий экран без горизонтальной прокрутки.',
      initiallyOpen: false,
    },
    {
      id: createElementId('faq'),
      question: 'Как посетители отправляют заявку?',
      answer: 'Добавьте блок формы, настройте поля и опубликуйте локальную демо-версию проекта.',
      initiallyOpen: false,
    },
  ];
}

export function getAccentButtonColor(accentColor: string): string {
  return getLandingAccentValue(accentColor as Parameters<typeof getLandingAccentValue>[0]);
}

function inferLinkKind(target: string): LinkConfig['kind'] {
  if (target.startsWith('#')) {
    return 'anchor';
  }

  if (target.startsWith('mailto:')) {
    return 'email';
  }

  if (target.startsWith('tel:')) {
    return 'phone';
  }

  return target.startsWith('http://') || target.startsWith('https://') ? 'external' : 'internal';
}

function cloneLink(link: LinkConfig): LinkConfig {
  return {
    ...link,
    id: createElementId('link'),
  };
}

function cloneMedia<
  TMedia extends { readonly focalPoint?: { readonly x: number; readonly y: number } },
>(media: TMedia | undefined): TMedia | undefined {
  return media === undefined
    ? undefined
    : {
        ...media,
        focalPoint: media.focalPoint === undefined ? undefined : { ...media.focalPoint },
      };
}

function cloneRequiredMedia<
  TMedia extends { readonly focalPoint?: { readonly x: number; readonly y: number } },
>(media: TMedia): TMedia {
  return {
    ...media,
    focalPoint: media.focalPoint === undefined ? undefined : { ...media.focalPoint },
  };
}

function cloneAppearance<TAppearance extends object>(
  appearance: TAppearance | undefined,
): TAppearance | undefined {
  return appearance === undefined ? undefined : { ...appearance };
}

function createElementId(prefix: string): string {
  if (globalThis.crypto?.randomUUID !== undefined) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  fallbackElementId += 1;

  return `${prefix}-${Date.now().toString(36)}-${fallbackElementId.toString(36)}`;
}
