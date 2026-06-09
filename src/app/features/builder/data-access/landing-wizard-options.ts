import type {
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingIndustry,
  LandingOfferListVariant,
  LandingOption,
  LandingTone,
  LandingWizardStep,
} from '../domain/models';

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
