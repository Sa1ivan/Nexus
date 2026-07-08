import { DEFAULT_LANDING_DESIGN_SETTINGS, getLandingAccentValue } from '../models';
import { createBlockAnchor, createBlockId } from '../utils/builder-ids';
import type {
  BlockType,
  HeaderBookingConfig,
  HeroBlockStyles,
  LinkConfig,
  OfferListItem,
  PageBlockConfig,
} from '../models';

export interface BlockVariantOption<TVariant extends string = string> {
  readonly id: TVariant;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export interface BlockDefinition<TType extends BlockType = BlockType> {
  readonly type: TType;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly anchorBase: string;
  readonly renderer: string;
  readonly inspector: string;
  readonly variants: readonly BlockVariantOption[];
}

const DEFAULT_HERO_STYLES: HeroBlockStyles = {
  backgroundColor: '#f5f7fb',
  textColor: '#111827',
  buttonBackgroundColor: '#111827',
  buttonTextColor: '#ffffff',
  minHeight: '520px',
  alignment: 'center',
};

const DEFAULT_LINK_TARGETS: readonly string[] = ['#hero', '#offers', '#lead-form', '#contact'];

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
        design,
        variant: 'stretchedNav',
        brandName: 'Nexus Studio',
        navigationItems: createDefaultNavigation(),
        cta: createLink('Связаться', '#lead-form'),
        booking: createDefaultBooking(),
      };
    case 'hero':
      return {
        id,
        anchor,
        type,
        design,
        title: 'Большой ясный оффер для нового блока',
        subtitle: 'Опишите ценность, сценарий и следующий шаг для посетителя.',
        buttonText: 'Начать',
        buttonHref: '#lead-form',
        secondaryButton: createLink('Посмотреть предложения', '#offers'),
        media: {
          src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
          alt: 'Рабочее пространство и экран конструктора',
          focalPoint: { x: 50, y: 50 },
        },
        styles: DEFAULT_HERO_STYLES,
      };
    case 'offerList':
      return {
        id,
        anchor,
        type,
        design,
        variant: 'catalogGrid',
        eyebrow: 'Подборка',
        title: 'Что можно показать в этом блоке',
        items: createDefaultOffers(),
      };
    case 'siteFooter':
      return {
        id,
        anchor,
        type,
        design,
        variant: 'bookingFooter',
        brandName: 'Nexus Studio',
        cta: createLink('Оставить заявку', '#lead-form'),
        contactLines: ['hello@nexus.app', '+7 999 000-00-00', 'Ответ в течение дня'],
        links: createLegalLinks(),
        socialLinks: [
          createExternalLink('Telegram', 'https://t.me/nexus'),
          createExternalLink('VK', 'https://vk.com/nexus'),
        ],
        map: {
          label: 'Карта',
          address: 'Москва, Тверская 12',
          embedUrl: 'https://maps.example.com/nexus',
        },
      };
    case 'leadForm':
      return {
        id,
        anchor,
        type,
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
): PageBlockConfig {
  const id = createBlockId(block.type);
  const anchor = createBlockAnchor(
    block.type,
    currentBlocks.map((currentBlock) => currentBlock.anchor),
  );

  switch (block.type) {
    case 'siteHeader':
      return {
        ...block,
        id,
        anchor,
        navigationItems: block.navigationItems.map((item) => ({ ...item })),
        cta: { ...block.cta },
        booking:
          block.booking === undefined
            ? undefined
            : {
                ...block.booking,
                action: { ...block.booking.action },
              },
      };
    case 'hero':
      return {
        ...block,
        id,
        anchor,
        media: block.media === undefined ? undefined : { ...block.media },
        secondaryButton:
          block.secondaryButton === undefined ? undefined : { ...block.secondaryButton },
        styles: {
          ...block.styles,
        },
      };
    case 'offerList':
      return {
        ...block,
        id,
        anchor,
        items: block.items.map((item) => ({
          ...item,
          image: item.image === undefined ? undefined : { ...item.image },
          cta: item.cta === undefined ? undefined : { ...item.cta },
        })),
      };
    case 'siteFooter':
      return {
        ...block,
        id,
        anchor,
        cta: { ...block.cta },
        contactLines: [...block.contactLines],
        links: block.links.map((link) => ({ ...link })),
        socialLinks: block.socialLinks?.map((link) => ({ ...link })),
        map: block.map === undefined ? undefined : { ...block.map },
      };
    case 'leadForm':
      return {
        ...block,
        id,
        anchor,
        fields: block.fields.map((field) => ({ ...field })),
      };
  }
}

export function createLink(label: string, target: string): LinkConfig {
  return {
    label,
    target,
    kind: target.startsWith('#') ? 'anchor' : 'internal',
  };
}

export function createExternalLink(label: string, target: string): LinkConfig {
  return {
    label,
    target,
    kind: 'external',
  };
}

export function normalizeLinkTarget(target: string): string {
  const trimmedTarget = target.trim();

  if (!trimmedTarget) {
    return '#';
  }

  if (
    trimmedTarget.startsWith('#') ||
    trimmedTarget.startsWith('/') ||
    trimmedTarget.startsWith('https://') ||
    trimmedTarget.startsWith('mailto:') ||
    trimmedTarget.startsWith('tel:')
  ) {
    return trimmedTarget;
  }

  return '#';
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

function createDefaultOffers(): readonly OfferListItem[] {
  return [
    {
      title: 'Первый пункт',
      description: 'Короткое описание пользы, услуги или продукта.',
      meta: 'База',
      price: 'от 4 900 ₽',
      badge: 'Популярно',
      image: {
        src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
        alt: 'Пример продукта или услуги',
      },
      cta: createLink('Подробнее', '#lead-form'),
    },
    {
      title: 'Второй пункт',
      description: 'Добавьте детали, цену, срок или формат работы.',
      meta: 'Про',
      price: 'от 9 900 ₽',
      image: {
        src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
        alt: 'Карточка предложения с рабочими материалами',
      },
      cta: createLink('Выбрать', '#lead-form'),
    },
    {
      title: 'Третий пункт',
      description: 'Закройте список сильным аргументом для заявки.',
      meta: 'Плюс',
      price: 'индивидуально',
      image: {
        src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
        alt: 'Команда обсуждает предложение',
      },
      cta: createLink('Обсудить', '#lead-form'),
    },
  ];
}

export function getAccentButtonColor(accentColor: string): string {
  return getLandingAccentValue(accentColor as Parameters<typeof getLandingAccentValue>[0]);
}
