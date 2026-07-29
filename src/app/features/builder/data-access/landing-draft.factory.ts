import {
  DEFAULT_BLOCK_APPEARANCE,
  DEFAULT_SITE_SEO,
  DEFAULT_SITE_THEME,
  getLandingAccentValue,
  getLandingRadiusValue,
  getReadableTextColor,
  SITE_CONFIG_SCHEMA_VERSION,
} from '../domain/models';
import {
  createDefaultBooking,
  createExternalLink,
  createLink,
  createMapSearchUrl,
} from '../domain/registry/block-registry';
import type {
  BlockAppearanceOverrides,
  CompleteLandingWizardSelection,
  HeroContentAlignment,
  HeroBlockStyles,
  LandingDensity,
  LandingDesignSettings,
  LandingHeaderVariant,
  LandingIndustry,
  LandingTemplateStyle,
  LandingTone,
  OfferListItem,
  SiteBusinessConfig,
  SiteConfig,
} from '../domain/models';

type LandingOfferPreset = Omit<OfferListItem, 'id'>;

interface LandingIndustryPreset {
  readonly brandName: string;
  readonly siteName: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly ctaText: string;
  readonly offerEyebrow: string;
  readonly offerTitle: string;
  readonly navigationItems: readonly string[];
  readonly offers: readonly LandingOfferPreset[];
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

const NAVIGATION_TARGETS: Readonly<Record<LandingIndustry, readonly string[]>> = {
  restaurant: ['#offers', '#gallery', '#testimonials'],
  hotel: ['#offers', '#features', '#contact'],
  beauty: ['#offers', '#about', '#lead-form'],
  product: ['#features', '#offers', '#testimonials'],
  education: ['#offers', '#about', '#testimonials'],
};

const OFFER_IMAGE_URLS: Readonly<Record<LandingIndustry, readonly string[]>> = {
  restaurant: [
    'images/landing/restaurant-1.webp',
    'images/landing/restaurant-2.webp',
    'images/landing/restaurant-3.webp',
  ],
  hotel: [
    'images/landing/hotel-1.webp',
    'images/landing/hotel-2.webp',
    'images/landing/hotel-3.webp',
  ],
  beauty: [
    'images/landing/beauty-1.webp',
    'images/landing/beauty-2.webp',
    'images/landing/beauty-3.webp',
  ],
  product: [
    'images/landing/product-1.webp',
    'images/landing/product-2.webp',
    'images/landing/product-3.webp',
  ],
  education: [
    'images/landing/education-1.webp',
    'images/landing/education-2.webp',
    'images/landing/education-3.webp',
  ],
};

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

function getDesignAppearanceOverrides(
  design: LandingDesignSettings,
  baseDesign: LandingDesignSettings,
): BlockAppearanceOverrides {
  return {
    accentColor:
      design.accentColor === baseDesign.accentColor
        ? undefined
        : getLandingAccentValue(design.accentColor),
    fontPairing: design.fontPairing === baseDesign.fontPairing ? undefined : design.fontPairing,
    spacing: design.density === baseDesign.density ? undefined : design.density,
    radius:
      design.templateStyle === baseDesign.templateStyle
        ? undefined
        : Number.parseFloat(getLandingRadiusValue(design.templateStyle)),
  };
}

export function buildLandingDraft(selection: CompleteLandingWizardSelection): SiteConfig {
  const preset = INDUSTRY_PRESETS[selection.industry];
  const toneStyles = TONE_STYLES[selection.tone];
  const brandName = normalizeBusinessValue(selection.brandName, preset.brandName);
  const heroTitle = normalizeBusinessValue(selection.heroTitle, preset.heroTitle);
  const heroSubtitle = normalizeBusinessValue(selection.heroSubtitle, preset.heroSubtitle);
  const ctaText = normalizeBusinessValue(selection.ctaText, preset.ctaText);
  const ctaDestination = normalizeBusinessValue(selection.ctaDestination, '#lead-form');
  const contactEmail = normalizeBusinessValue(selection.contactEmail, preset.contactLines[0] ?? '');
  const contactPhone = normalizeBusinessValue(selection.contactPhone, preset.contactLines[1] ?? '');
  const headerDesign = selection.stepDesigns?.header ?? selection.design;
  const heroDesign =
    selection.stepDesigns?.tone ?? selection.stepDesigns?.industry ?? selection.design;
  const offerListDesign = selection.stepDesigns?.offerList ?? selection.design;
  const footerDesign = selection.stepDesigns?.footer ?? selection.design;
  const themeAccentColor = getLandingAccentValue(selection.design.accentColor);
  const heroAccentColor = getLandingAccentValue(heroDesign.accentColor);
  const heroBackgroundColor = getHeroBackgroundColor(
    selection.tone,
    heroDesign.templateStyle,
    toneStyles.backgroundColor,
  );
  const heroAlignment = getHeroAlignment(
    selection.header,
    heroDesign.templateStyle,
    toneStyles.alignment,
  );
  const messengers = [createExternalLink('Telegram', 'https://t.me/nexus')];
  const socialLinks = [createExternalLink('VK', 'https://vk.com/nexus')];
  const address = preset.contactLines[0]?.includes('@') ? '' : (preset.contactLines[0] ?? '');
  const business: SiteBusinessConfig = {
    brandName,
    logo: null,
    phone: contactPhone,
    email: contactEmail,
    address,
    hours: preset.contactLines[2] ?? '',
    messengers,
    socialLinks,
  };
  const businessContactLines = [business.phone, business.email, business.address, business.hours]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const businessSocialLinks = [...business.socialLinks, ...business.messengers].map((link) => ({
    ...link,
  }));

  return {
    id: `landing-${selection.industry}`,
    schemaVersion: SITE_CONFIG_SCHEMA_VERSION,
    name: brandName,
    theme: {
      ...DEFAULT_SITE_THEME,
      accentColor: themeAccentColor,
      fontPairing: selection.design.fontPairing,
      sectionSpacing: selection.design.density,
      typeScale: selection.design.templateStyle === 'editorial' ? 'display' : 'balanced',
      radius: Number.parseFloat(getLandingRadiusValue(selection.design.templateStyle)),
    },
    business,
    seo: DEFAULT_SITE_SEO,
    pages: [
      {
        id: 'page-home',
        slug: 'home',
        title: 'Главная',
        seo: {
          title: `${brandName} - ${preset.siteName}`,
          description: heroSubtitle,
          socialImage: null,
          noIndex: false,
        },
        blocks: [
          {
            id: 'header-main',
            anchor: 'header',
            type: 'siteHeader',
            appearance: getDesignAppearanceOverrides(headerDesign, selection.design),
            hidden: false,
            design: headerDesign,
            inheritBusiness: true,
            variant: selection.header,
            brandName: business.brandName,
            logo: undefined,
            navigationItems: preset.navigationItems.map((label, index) =>
              createLink(label, NAVIGATION_TARGETS[selection.industry][index] ?? '#lead-form'),
            ),
            cta: createLink(ctaText, ctaDestination),
            booking: createDefaultBooking(),
          },
          {
            id: 'hero-main',
            anchor: 'hero',
            type: 'hero',
            appearance: getDesignAppearanceOverrides(heroDesign, selection.design),
            hidden: false,
            design: heroDesign,
            title: heroTitle,
            subtitle: heroSubtitle,
            buttonText: ctaText,
            buttonHref: ctaDestination,
            secondaryButton: createLink('Посмотреть предложения', '#offers'),
            media: {
              src: OFFER_IMAGE_URLS[selection.industry][0] ?? OFFER_IMAGE_URLS.product[0],
              alt: `${brandName}: визуальный акцент первого экрана`,
              focalPoint: { x: 50, y: 50 },
            },
            styles: {
              ...toneStyles,
              backgroundColor: heroBackgroundColor,
              textColor: getReadableTextColor(heroBackgroundColor),
              buttonBackgroundColor: heroAccentColor,
              buttonTextColor: getReadableTextColor(heroAccentColor),
              minHeight: getHeroMinHeight(heroDesign.density),
              alignment: heroAlignment,
            },
          },
          {
            id: 'content-main',
            anchor: 'about',
            type: 'contentMedia',
            appearance: DEFAULT_BLOCK_APPEARANCE,
            hidden: false,
            design: selection.design,
            variant: 'mediaRight',
            eyebrow: 'О проекте',
            title: `${brandName}: подход, который понятен до первого обращения`,
            body: `${heroSubtitle} Здесь можно раскрыть процесс, опыт команды и детали, которые помогают посетителю принять решение.`,
            cta: createLink('Обсудить задачу', ctaDestination),
            media: {
              src: OFFER_IMAGE_URLS[selection.industry][1] ?? OFFER_IMAGE_URLS.product[1],
              alt: `${brandName}: команда и рабочий процесс`,
              focalPoint: { x: 50, y: 50 },
            },
          },
          {
            id: 'features-main',
            anchor: 'features',
            type: 'featureGrid',
            appearance: DEFAULT_BLOCK_APPEARANCE,
            hidden: false,
            design: selection.design,
            variant: selection.design.templateStyle === 'editorial' ? 'editorialList' : 'cards',
            eyebrow: 'Преимущества',
            title: 'Что получает клиент',
            description: 'Ключевые аргументы собраны в короткую и понятную структуру.',
            items: preset.offers.slice(0, 3).map((offer, index) => ({
              id: `feature-${selection.industry}-${index + 1}`,
              icon: `${index + 1}`,
              title: offer.title,
              description: offer.description,
              link: createLink('Подробнее', '#offers'),
            })),
          },
          {
            id: 'offers-main',
            anchor: 'offers',
            type: 'offerList',
            appearance: getDesignAppearanceOverrides(offerListDesign, selection.design),
            hidden: false,
            design: offerListDesign,
            variant: selection.offerList,
            eyebrow: preset.offerEyebrow,
            title: preset.offerTitle,
            items: enrichOffers(selection.industry, preset.offers),
          },
          {
            id: 'gallery-main',
            anchor: 'gallery',
            type: 'gallery',
            appearance: DEFAULT_BLOCK_APPEARANCE,
            hidden: false,
            design: selection.design,
            variant: selection.design.templateStyle === 'editorial' ? 'collage' : 'uniformGrid',
            eyebrow: 'Галерея',
            title: `${brandName} в деталях`,
            description: 'Реальные кадры продукта, пространства или процесса.',
            items: OFFER_IMAGE_URLS[selection.industry].slice(0, 3).map((src, index) => ({
              id: `gallery-${selection.industry}-${index + 1}`,
              image: {
                src,
                alt: `${brandName}: ${preset.offers[index]?.title ?? `кадр ${index + 1}`}`,
                focalPoint: { x: 50, y: 50 },
              },
              caption: preset.offers[index]?.title,
            })),
            lightboxEnabled: true,
          },
          {
            id: 'testimonials-main',
            anchor: 'testimonials',
            type: 'testimonials',
            appearance: DEFAULT_BLOCK_APPEARANCE,
            hidden: false,
            design: selection.design,
            variant: selection.design.templateStyle === 'conversion' ? 'featuredQuote' : 'cards',
            eyebrow: 'Отзывы',
            title: 'Опыт клиентов',
            items: [
              {
                id: `testimonial-${selection.industry}-1`,
                quote: `В ${brandName} все объяснили заранее и помогли выбрать подходящий формат.`,
                author: 'Анна Крылова',
                role: 'Клиент',
                rating: 5,
              },
              {
                id: `testimonial-${selection.industry}-2`,
                quote: 'Понравились ясный процесс, внимание к деталям и предсказуемый результат.',
                author: 'Илья Соколов',
                role: 'Постоянный клиент',
                rating: 5,
              },
              {
                id: `testimonial-${selection.industry}-3`,
                quote: 'Получили именно то, что ожидали, и готовы рекомендовать дальше.',
                author: 'Мария Белова',
                role: 'Клиент',
                rating: 5,
              },
            ],
          },
          {
            id: 'faq-main',
            anchor: 'faq',
            type: 'faq',
            appearance: DEFAULT_BLOCK_APPEARANCE,
            hidden: false,
            design: selection.design,
            variant: 'borderedAccordion',
            eyebrow: 'FAQ',
            title: 'Частые вопросы',
            description: 'Важные детали до заявки.',
            allowMultipleOpen: false,
            items: [
              {
                id: `faq-${selection.industry}-1`,
                question: 'Как начать?',
                answer: `Оставьте заявку, и команда ${brandName} уточнит задачу и предложит следующий шаг.`,
                initiallyOpen: true,
              },
              {
                id: `faq-${selection.industry}-2`,
                question: 'Когда вы ответите?',
                answer: 'Мы свяжемся по указанному контакту в течение рабочего дня.',
                initiallyOpen: false,
              },
              {
                id: `faq-${selection.industry}-3`,
                question: 'Можно ли обсудить индивидуальные условия?',
                answer:
                  'Да, детали, состав и формат предложения можно адаптировать под вашу задачу.',
                initiallyOpen: false,
              },
            ],
          },
          {
            id: 'cta-main',
            anchor: 'cta',
            type: 'callToAction',
            appearance: DEFAULT_BLOCK_APPEARANCE,
            hidden: false,
            design: selection.design,
            variant: selection.design.templateStyle === 'conversion' ? 'cover' : 'banner',
            eyebrow: 'Следующий шаг',
            title: `${ctaText} в ${brandName}`,
            text: 'Оставьте контакты, чтобы получить детали и подходящий вариант без лишних звонков.',
            primaryAction: createLink(ctaText, ctaDestination),
            secondaryAction: createLink('Посмотреть предложения', '#offers'),
            media: {
              src: OFFER_IMAGE_URLS[selection.industry][2] ?? OFFER_IMAGE_URLS.product[2],
              alt: `${brandName}: финальный призыв к действию`,
              focalPoint: { x: 50, y: 50 },
            },
          },
          {
            id: 'lead-form-main',
            anchor: 'lead-form',
            type: 'leadForm',
            appearance: DEFAULT_BLOCK_APPEARANCE,
            hidden: false,
            design: selection.design,
            title: `Получить предложение от ${brandName}`,
            description: 'Оставьте контакты, и мы вернемся с деталями по вашему запросу.',
            submitText: ctaText,
            successMessage: 'Заявка сохранена. Мы скоро свяжемся с вами.',
            fields: [
              {
                id: 'name',
                label: 'Имя',
                type: 'text',
                placeholder: 'Как к вам обращаться',
                required: true,
                helpText: 'Имя для персонального ответа.',
                order: 1,
              },
              {
                id: 'contact',
                label: 'Телефон или email',
                type: 'text',
                placeholder: contactPhone || contactEmail || '+7 999 000-00-00',
                required: true,
                helpText: 'Можно оставить телефон или email.',
                order: 2,
              },
              {
                id: 'message',
                label: 'Комментарий',
                type: 'textarea',
                placeholder: 'Расскажите, что вас интересует',
                required: false,
                helpText: 'Поможет подготовить точный ответ.',
                order: 3,
              },
            ],
          },
          {
            id: 'footer-main',
            anchor: 'contact',
            type: 'siteFooter',
            appearance: getDesignAppearanceOverrides(footerDesign, selection.design),
            hidden: false,
            design: footerDesign,
            inheritBusiness: true,
            variant: selection.footer,
            brandName: business.brandName,
            logo: undefined,
            cta: createLink(ctaText, ctaDestination),
            contactLines: businessContactLines,
            links: [
              createLink('Условия', '#contact'),
              createLink('Контакты', '#contact'),
              createLink('Политика', '#contact'),
            ],
            socialLinks: businessSocialLinks,
            map: {
              label: 'Открыть карту',
              address: business.address,
              embedUrl: createMapSearchUrl(business.address),
            },
          },
        ],
      },
    ],
  };
}

function normalizeBusinessValue(value: string, fallback: string): string {
  return value.trim() || fallback;
}

function enrichOffers(
  industry: LandingIndustry,
  offers: readonly LandingOfferPreset[],
): readonly OfferListItem[] {
  return offers.map((offer, index) => ({
    ...offer,
    id: `offer-${industry}-${index + 1}`,
    price: offer.meta.includes('₽') ? offer.meta : undefined,
    badge: index === 0 ? 'Рекомендуем' : undefined,
    image: {
      src:
        OFFER_IMAGE_URLS[industry][index] ??
        OFFER_IMAGE_URLS.product[index] ??
        OFFER_IMAGE_URLS.product[0],
      alt: offer.title,
    },
    cta: createLink(index === 0 ? 'Выбрать' : 'Подробнее', '#lead-form'),
  }));
}
