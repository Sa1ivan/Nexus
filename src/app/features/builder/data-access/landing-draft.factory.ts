import { getLandingAccentValue } from '../domain/models';
import type {
  CompleteLandingWizardSelection,
  HeroContentAlignment,
  HeroBlockStyles,
  LandingDensity,
  LandingHeaderVariant,
  LandingIndustry,
  LandingTemplateStyle,
  LandingTone,
  OfferListItem,
  SiteConfig,
} from '../domain/models';

interface LandingIndustryPreset {
  readonly brandName: string;
  readonly siteName: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly ctaText: string;
  readonly offerEyebrow: string;
  readonly offerTitle: string;
  readonly navigationItems: readonly string[];
  readonly offers: readonly OfferListItem[];
  readonly contactLines: readonly string[];
}

const INDUSTRY_PRESETS: Readonly<Record<LandingIndustry, LandingIndustryPreset>> = {
  restaurant: {
    brandName: 'Nexus Бистро',
    siteName: 'Лендинг ресторана',
    heroTitle: 'Вечер, ради которого хочется забронировать стол',
    heroSubtitle: 'Авторская кухня, сезонное меню и спокойный сервис в центре города.',
    ctaText: 'Забронировать стол',
    offerEyebrow: 'Меню',
    offerTitle: 'Популярные позиции',
    navigationItems: ['Меню', 'Атмосфера', 'Отзывы'],
    offers: [
      {
        title: 'Сет от шефа',
        description: 'Пять подач, локальные продукты и винное сопровождение.',
        meta: 'от 4 900 ₽',
      },
      {
        title: 'Завтраки',
        description: 'Кофе, выпечка, блюда из яиц и легкие позиции до полудня.',
        meta: '08:00-12:00',
      },
      {
        title: 'Ужин для двоих',
        description: 'Горячее, десерт и напитки для спокойного вечера.',
        meta: '2 гостя',
      },
    ],
    contactLines: ['Москва, Тверская 12', '+7 999 120-45-67', 'Ежедневно 08:00-23:00'],
  },
  hotel: {
    brandName: 'Nexus Отель',
    siteName: 'Лендинг отеля',
    heroTitle: 'Отель для спокойной остановки в городе',
    heroSubtitle: 'Номера с видом, завтраки, трансфер и бронирование за пару кликов.',
    ctaText: 'Проверить даты',
    offerEyebrow: 'Номера',
    offerTitle: 'Варианты размещения',
    navigationItems: ['Номера', 'Удобства', 'Локация'],
    offers: [
      {
        title: 'Стандарт',
        description: 'Уютный номер для короткой поездки с рабочей зоной.',
        meta: 'от 7 500 ₽',
      },
      {
        title: 'Комфорт',
        description: 'Больше пространства, вид на город и завтрак включен.',
        meta: 'от 10 900 ₽',
      },
      {
        title: 'Люкс',
        description: 'Гостиная зона, большая кровать и поздний выезд.',
        meta: 'от 18 000 ₽',
      },
    ],
    contactLines: ['Санкт-Петербург, Невский 48', '+7 999 210-30-40', 'Заезд с 14:00'],
  },
  beauty: {
    brandName: 'Nexus Студия',
    siteName: 'Лендинг бьюти-услуг',
    heroTitle: 'Студия ухода с записью на удобное время',
    heroSubtitle: 'Процедуры, мастера и персональные программы для уверенного результата.',
    ctaText: 'Записаться',
    offerEyebrow: 'Услуги',
    offerTitle: 'Популярные процедуры',
    navigationItems: ['Услуги', 'Мастера', 'Прайс'],
    offers: [
      {
        title: 'Уход для лица',
        description: 'Диагностика кожи, очищение, маска и рекомендации мастера.',
        meta: '90 мин',
      },
      {
        title: 'СПА-программа',
        description: 'Расслабляющий комплекс для восстановления после недели.',
        meta: '2 часа',
      },
      {
        title: 'Макияж',
        description: 'Дневной, вечерний или свадебный образ под событие.',
        meta: 'от 3 500 ₽',
      },
    ],
    contactLines: ['Казань, Пушкина 7', '+7 999 540-20-10', 'Запись 10:00-21:00'],
  },
  product: {
    brandName: 'Nexus Продукт',
    siteName: 'Лендинг продукта',
    heroTitle: 'Продукт, который быстро объясняет свою ценность',
    heroSubtitle: 'Сильный оффер, понятные сценарии, тарифы и сбор заявок в одном потоке.',
    ctaText: 'Получить демонстрацию',
    offerEyebrow: 'Возможности',
    offerTitle: 'Что получает клиент',
    navigationItems: ['Функции', 'Тарифы', 'Кейсы'],
    offers: [
      {
        title: 'Автоматизация',
        description: 'Сбор заявок, статусы, уведомления и единая воронка.',
        meta: 'База',
      },
      {
        title: 'Аналитика',
        description: 'Понятные метрики по трафику, конверсии и источникам.',
        meta: 'Про',
      },
      {
        title: 'Интеграции',
        description: 'Подключение CRM, платежей, рассылок и внешних сервисов.',
        meta: 'Подключения',
      },
    ],
    contactLines: ['demo@nexus.app', '+7 999 600-88-20', 'Ответ в течение дня'],
  },
  education: {
    brandName: 'Nexus Академия',
    siteName: 'Лендинг курса',
    heroTitle: 'Курс с понятной программой и видимым результатом',
    heroSubtitle: 'Модули, наставники, практика и заявка на ближайший поток.',
    ctaText: 'Оставить заявку',
    offerEyebrow: 'Программа',
    offerTitle: 'Модули обучения',
    navigationItems: ['Программа', 'Наставники', 'Результаты'],
    offers: [
      {
        title: 'Старт',
        description: 'База, настройка рабочего процесса и первый практический проект.',
        meta: '1 неделя',
      },
      {
        title: 'Практика',
        description: 'Разбор кейсов, домашние задания и обратная связь.',
        meta: '4 недели',
      },
      {
        title: 'Финал',
        description: 'Защита проекта, план развития и подготовка портфолио.',
        meta: 'сертификат',
      },
    ],
    contactLines: ['learn@nexus.academy', '+7 999 700-42-42', 'Новый поток 15 июля'],
  },
} as const;

const TONE_STYLES: Readonly<Record<LandingTone, HeroBlockStyles>> = {
  premium: {
    backgroundColor: '#111827',
    textColor: '#f8fafc',
    buttonBackgroundColor: '#d7b46a',
    buttonTextColor: '#111827',
    minHeight: '520px',
    alignment: 'center',
  },
  friendly: {
    backgroundColor: '#f7efe5',
    textColor: '#1f2937',
    buttonBackgroundColor: '#0f766e',
    buttonTextColor: '#ffffff',
    minHeight: '520px',
    alignment: 'center',
  },
  minimal: {
    backgroundColor: '#ffffff',
    textColor: '#111827',
    buttonBackgroundColor: '#111827',
    buttonTextColor: '#ffffff',
    minHeight: '520px',
    alignment: 'center',
  },
  bold: {
    backgroundColor: '#0f766e',
    textColor: '#ecfeff',
    buttonBackgroundColor: '#f97316',
    buttonTextColor: '#ffffff',
    minHeight: '520px',
    alignment: 'center',
  },
} as const;

function getHeroMinHeight(density: LandingDensity): string {
  switch (density) {
    case 'compact':
      return '460px';
    case 'balanced':
      return '540px';
    case 'spacious':
      return '620px';
  }
}

function getHeroAlignment(
  header: LandingHeaderVariant,
  templateStyle: LandingTemplateStyle,
  fallback: HeroContentAlignment,
): HeroContentAlignment {
  if (header === 'splitMedia' || templateStyle === 'editorial') {
    return 'left';
  }

  if (templateStyle === 'conversion') {
    return 'center';
  }

  return fallback;
}

function getHeroBackgroundColor(
  tone: LandingTone,
  templateStyle: LandingTemplateStyle,
  fallback: string,
): string {
  if (templateStyle === 'editorial') {
    return tone === 'premium' ? '#111827' : '#fff7ed';
  }

  if (templateStyle === 'conversion' && tone !== 'minimal') {
    return '#f8fafc';
  }

  return fallback;
}

export function buildLandingDraft(selection: CompleteLandingWizardSelection): SiteConfig {
  const preset = INDUSTRY_PRESETS[selection.industry];
  const toneStyles = TONE_STYLES[selection.tone];
  const headerDesign = selection.stepDesigns?.header ?? selection.design;
  const heroDesign = selection.stepDesigns?.tone ?? selection.stepDesigns?.industry ?? selection.design;
  const offerListDesign = selection.stepDesigns?.offerList ?? selection.design;
  const footerDesign = selection.stepDesigns?.footer ?? selection.design;
  const accentColor = getLandingAccentValue(heroDesign.accentColor);
  const heroAlignment = getHeroAlignment(
    selection.header,
    heroDesign.templateStyle,
    toneStyles.alignment,
  );

  return {
    id: `landing-${selection.industry}`,
    name: preset.siteName,
    pages: [
      {
        slug: 'home',
        title: 'Главная',
        blocks: [
          {
            id: 'header-main',
            type: 'siteHeader',
            design: headerDesign,
            variant: selection.header,
            brandName: preset.brandName,
            navigationItems: preset.navigationItems,
            ctaText: preset.ctaText,
          },
          {
            id: 'hero-main',
            type: 'hero',
            design: heroDesign,
            title: preset.heroTitle,
            subtitle: preset.heroSubtitle,
            buttonText: preset.ctaText,
            styles: {
              ...toneStyles,
              backgroundColor: getHeroBackgroundColor(
                selection.tone,
                heroDesign.templateStyle,
                toneStyles.backgroundColor,
              ),
              buttonBackgroundColor: accentColor,
              minHeight: getHeroMinHeight(heroDesign.density),
              alignment: heroAlignment,
            },
          },
          {
            id: 'offers-main',
            type: 'offerList',
            design: offerListDesign,
            variant: selection.offerList,
            eyebrow: preset.offerEyebrow,
            title: preset.offerTitle,
            items: preset.offers,
          },
          {
            id: 'footer-main',
            type: 'siteFooter',
            design: footerDesign,
            variant: selection.footer,
            brandName: preset.brandName,
            ctaText: preset.ctaText,
            contactLines: preset.contactLines,
            links: ['Условия', 'Контакты', 'Политика'],
          },
        ],
      },
    ],
  };
}
