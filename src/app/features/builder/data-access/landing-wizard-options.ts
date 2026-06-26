import type {
  LandingAccentColor,
  LandingDensity,
  LandingDesignOption,
  LandingDesignSettings,
  LandingFooterVariant,
  LandingFontPairing,
  LandingHeaderVariant,
  LandingIndustry,
  LandingOfferListVariant,
  LandingOption,
  LandingTemplateStyle,
  LandingTone,
  LandingWizardStep,
} from '../domain/models';

export interface LandingIndustryRecommendation {
  readonly tone: LandingTone;
  readonly header: LandingHeaderVariant;
  readonly offerList: LandingOfferListVariant;
  readonly footer: LandingFooterVariant;
  readonly design: LandingDesignSettings;
}

export const LANDING_WIZARD_STEPS: readonly LandingWizardStep[] = [
  {
    id: 'industry',
    label: 'Ниша',
    icon: 'storefront',
  },
  {
    id: 'tone',
    label: 'Подача',
    icon: 'palette',
  },
  {
    id: 'header',
    label: 'Хедер',
    icon: 'web_asset',
  },
  {
    id: 'offerList',
    label: 'Предложения',
    icon: 'view_module',
  },
  {
    id: 'footer',
    label: 'Футер',
    icon: 'call_to_action',
  },
  {
    id: 'summary',
    label: 'Итог',
    icon: 'task_alt',
  },
] as const;

export const LANDING_INDUSTRY_OPTIONS: readonly LandingOption<LandingIndustry>[] = [
  {
    id: 'restaurant',
    title: 'Ресторан',
    description: 'Меню, бронь столика, сезонные предложения и атмосфера заведения.',
    icon: 'restaurant',
  },
  {
    id: 'hotel',
    title: 'Отель',
    description: 'Номера, удобства, галерея, отзывы и быстрый переход к бронированию.',
    icon: 'hotel',
  },
  {
    id: 'beauty',
    title: 'Бьюти-услуги',
    description: 'Процедуры, специалисты, прайс и запись на удобное время.',
    icon: 'spa',
  },
  {
    id: 'product',
    title: 'Продукт',
    description: 'Преимущества, тарифы, сценарии использования и конверсионные блоки.',
    icon: 'inventory_2',
  },
  {
    id: 'education',
    title: 'Курс',
    description: 'Программа, преподаватели, результаты учеников и заявка на обучение.',
    icon: 'school',
  },
] as const;

export const LANDING_TONE_OPTIONS: readonly LandingOption<LandingTone>[] = [
  {
    id: 'premium',
    title: 'Премиально',
    description: 'Сдержанная композиция, крупные акценты и ощущение высокого чека.',
    icon: 'diamond',
  },
  {
    id: 'friendly',
    title: 'Тепло',
    description: 'Мягкий визуальный ритм, живые формулировки и доверительная подача.',
    icon: 'volunteer_activism',
  },
  {
    id: 'minimal',
    title: 'Минималистично',
    description: 'Чистая сетка, короткие тексты и максимум фокуса на действии.',
    icon: 'crop_square',
  },
  {
    id: 'bold',
    title: 'Ярко',
    description: 'Контрастные блоки, выразительные заголовки и сильный первый экран.',
    icon: 'bolt',
  },
] as const;

export const LANDING_HEADER_OPTIONS: readonly LandingOption<LandingHeaderVariant>[] = [
  {
    id: 'centeredHero',
    title: 'Центральный первый экран',
    description: 'Логотип, навигация, большой оффер по центру и одна основная кнопка.',
    icon: 'vertical_align_center',
  },
  {
    id: 'splitMedia',
    title: 'Текст + медиа',
    description: 'Оффер слева, визуальный акцент справа, удобно для товара или отеля.',
    icon: 'splitscreen',
  },
  {
    id: 'reservationBar',
    title: 'С бронью',
    description: 'Хедер сразу ведет к дате, количеству гостей, номеру или записи.',
    icon: 'event_available',
  },
  {
    id: 'editorial',
    title: 'Журнальный',
    description: 'Крупная типографика, короткое меню и спокойная премиальная подача.',
    icon: 'auto_stories',
  },
] as const;

export const LANDING_OFFER_LIST_OPTIONS: readonly LandingOption<LandingOfferListVariant>[] = [
  {
    id: 'menuGrid',
    title: 'Меню-сетка',
    description: 'Категории, цены, фото позиций и быстрые акценты на популярном.',
    icon: 'restaurant_menu',
  },
  {
    id: 'roomCards',
    title: 'Карточки номеров',
    description: 'Типы номеров, удобства, цена за ночь и кнопка бронирования.',
    icon: 'king_bed',
  },
  {
    id: 'pricingTable',
    title: 'Прайс',
    description: 'Тарифы, пакеты услуг, состав каждого предложения и сравнение.',
    icon: 'table_chart',
  },
  {
    id: 'catalogGrid',
    title: 'Каталог',
    description: 'Список продуктов, фильтры, изображения и быстрый переход к заявке.',
    icon: 'widgets',
  },
] as const;

export const LANDING_FOOTER_OPTIONS: readonly LandingOption<LandingFooterVariant>[] = [
  {
    id: 'contactMap',
    title: 'Контакты + карта',
    description: 'Адрес, часы работы, телефон, мессенджеры и карта в нижней части.',
    icon: 'map',
  },
  {
    id: 'compactLegal',
    title: 'Компактный',
    description: 'Логотип, ссылки, документы и минимальная служебная информация.',
    icon: 'notes',
  },
  {
    id: 'socialLead',
    title: 'Социальный',
    description: 'Соцсети, отзывы, пользовательский контент и подписка.',
    icon: 'groups',
  },
  {
    id: 'bookingFooter',
    title: 'С повторным призывом',
    description: 'Финальный призыв, форма заявки и контакты для быстрого действия.',
    icon: 'touch_app',
  },
] as const;

export const LANDING_ACCENT_OPTIONS: readonly LandingDesignOption<LandingAccentColor>[] = [
  {
    id: 'teal',
    title: 'Тил',
    description: 'Спокойный сервисный акцент.',
    icon: 'palette',
  },
  {
    id: 'blue',
    title: 'Синий',
    description: 'Технологичный и деловой акцент.',
    icon: 'palette',
  },
  {
    id: 'rose',
    title: 'Роза',
    description: 'Живой акцент для эмоций и записи.',
    icon: 'palette',
  },
  {
    id: 'violet',
    title: 'Фиолетовый',
    description: 'Выразительный акцент для продукта.',
    icon: 'palette',
  },
  {
    id: 'amber',
    title: 'Янтарный',
    description: 'Теплый премиальный акцент.',
    icon: 'palette',
  },
] as const;

export const LANDING_FONT_OPTIONS: readonly LandingDesignOption<LandingFontPairing>[] = [
  {
    id: 'grotesk',
    title: 'Гротеск',
    description: 'Ровная SaaS-типографика.',
    icon: 'format_size',
  },
  {
    id: 'serif',
    title: 'Антиква',
    description: 'Редакционная подача.',
    icon: 'title',
  },
  {
    id: 'rounded',
    title: 'Мягкий',
    description: 'Дружелюбный ритм.',
    icon: 'text_fields',
  },
] as const;

export const LANDING_DENSITY_OPTIONS: readonly LandingDesignOption<LandingDensity>[] = [
  {
    id: 'compact',
    title: 'Плотно',
    description: 'Больше информации на экран.',
    icon: 'density_small',
  },
  {
    id: 'balanced',
    title: 'Баланс',
    description: 'Универсальная высота секций.',
    icon: 'density_medium',
  },
  {
    id: 'spacious',
    title: 'Воздух',
    description: 'Крупнее и спокойнее.',
    icon: 'density_large',
  },
] as const;

export const LANDING_TEMPLATE_STYLE_OPTIONS: readonly LandingDesignOption<LandingTemplateStyle>[] =
  [
    {
      id: 'classic',
      title: 'Классика',
      description: 'Прямая структура лендинга.',
      icon: 'dashboard',
    },
    {
      id: 'editorial',
      title: 'Журнал',
      description: 'Крупная типографика и ритм.',
      icon: 'auto_stories',
    },
    {
      id: 'conversion',
      title: 'Заявки',
      description: 'Больше CTA и контраста.',
      icon: 'ads_click',
    },
  ] as const;

export const LANDING_INDUSTRY_RECOMMENDATIONS: Readonly<
  Record<LandingIndustry, LandingIndustryRecommendation>
> = {
  restaurant: {
    tone: 'friendly',
    header: 'reservationBar',
    offerList: 'menuGrid',
    footer: 'contactMap',
    design: {
      accentColor: 'amber',
      fontPairing: 'serif',
      density: 'spacious',
      templateStyle: 'editorial',
    },
  },
  hotel: {
    tone: 'premium',
    header: 'splitMedia',
    offerList: 'roomCards',
    footer: 'bookingFooter',
    design: {
      accentColor: 'blue',
      fontPairing: 'grotesk',
      density: 'balanced',
      templateStyle: 'conversion',
    },
  },
  beauty: {
    tone: 'friendly',
    header: 'centeredHero',
    offerList: 'pricingTable',
    footer: 'socialLead',
    design: {
      accentColor: 'rose',
      fontPairing: 'rounded',
      density: 'balanced',
      templateStyle: 'classic',
    },
  },
  product: {
    tone: 'bold',
    header: 'splitMedia',
    offerList: 'catalogGrid',
    footer: 'compactLegal',
    design: {
      accentColor: 'violet',
      fontPairing: 'grotesk',
      density: 'compact',
      templateStyle: 'conversion',
    },
  },
  education: {
    tone: 'minimal',
    header: 'editorial',
    offerList: 'pricingTable',
    footer: 'bookingFooter',
    design: {
      accentColor: 'teal',
      fontPairing: 'serif',
      density: 'spacious',
      templateStyle: 'editorial',
    },
  },
} as const;

export const LANDING_HEADER_OPTIONS_BY_INDUSTRY: Readonly<
  Record<LandingIndustry, readonly LandingHeaderVariant[]>
> = {
  restaurant: ['reservationBar', 'centeredHero', 'editorial'],
  hotel: ['splitMedia', 'reservationBar', 'editorial'],
  beauty: ['centeredHero', 'splitMedia', 'reservationBar'],
  product: ['splitMedia', 'centeredHero', 'editorial'],
  education: ['editorial', 'splitMedia', 'centeredHero'],
} as const;

export const LANDING_OFFER_LIST_OPTIONS_BY_INDUSTRY: Readonly<
  Record<LandingIndustry, readonly LandingOfferListVariant[]>
> = {
  restaurant: ['menuGrid', 'catalogGrid', 'pricingTable'],
  hotel: ['roomCards', 'pricingTable', 'catalogGrid'],
  beauty: ['pricingTable', 'catalogGrid', 'menuGrid'],
  product: ['catalogGrid', 'pricingTable', 'roomCards'],
  education: ['pricingTable', 'catalogGrid', 'roomCards'],
} as const;

export const LANDING_FOOTER_OPTIONS_BY_INDUSTRY: Readonly<
  Record<LandingIndustry, readonly LandingFooterVariant[]>
> = {
  restaurant: ['contactMap', 'socialLead', 'bookingFooter'],
  hotel: ['bookingFooter', 'contactMap', 'compactLegal'],
  beauty: ['socialLead', 'bookingFooter', 'contactMap'],
  product: ['compactLegal', 'bookingFooter', 'socialLead'],
  education: ['bookingFooter', 'socialLead', 'compactLegal'],
} as const;
