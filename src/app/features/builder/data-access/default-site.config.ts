import {
  DEFAULT_BLOCK_APPEARANCE,
  DEFAULT_LANDING_DESIGN_SETTINGS,
  DEFAULT_SITE_BUSINESS,
  DEFAULT_SITE_SEO,
  DEFAULT_SITE_THEME,
  SITE_CONFIG_SCHEMA_VERSION,
} from '../domain/models';
import type { SiteConfig } from '../domain/models';
import { createLink } from '../domain/registry/block-registry';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'site-mvp',
  schemaVersion: SITE_CONFIG_SCHEMA_VERSION,
  name: 'MVP-сайт',
  theme: DEFAULT_SITE_THEME,
  business: {
    ...DEFAULT_SITE_BUSINESS,
    brandName: 'Nexus Studio',
    phone: '+7 999 000-00-00',
    email: 'hello@nexus.app',
  },
  seo: DEFAULT_SITE_SEO,
  pages: [
    {
      id: 'page-home',
      slug: 'home',
      title: 'Главная',
      seo: {
        title: 'Nexus Studio',
        description: 'Лендинг, собранный в Nexus.',
        socialImage: null,
        noIndex: false,
      },
      blocks: [
        {
          id: 'hero-home',
          anchor: 'hero',
          type: 'hero',
          appearance: DEFAULT_BLOCK_APPEARANCE,
          hidden: false,
          design: DEFAULT_LANDING_DESIGN_SETTINGS,
          title: 'Соберите сайт быстрее',
          subtitle: 'Чистая основа для визуального конструктора лендингов и сайтов.',
          buttonText: 'Начать сборку',
          buttonHref: '#lead-form',
          secondaryButton: createLink('Посмотреть блоки', '#lead-form'),
          media: {
            src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
            alt: 'Рабочая зона конструктора сайтов',
            focalPoint: { x: 50, y: 50 },
          },
          styles: {
            backgroundColor: '#f5f7fb',
            textColor: '#111827',
            buttonBackgroundColor: '#2563eb',
            buttonTextColor: '#ffffff',
            minHeight: '520px',
            alignment: 'center',
          },
        },
        {
          id: 'lead-form-home',
          anchor: 'lead-form',
          type: 'leadForm',
          appearance: DEFAULT_BLOCK_APPEARANCE,
          hidden: false,
          design: DEFAULT_LANDING_DESIGN_SETTINGS,
          title: 'Оставьте заявку',
          description: 'Расскажите, какой лендинг нужен, и мы сохраним обращение в проекте.',
          submitText: 'Отправить',
          successMessage: 'Заявка сохранена. Мы скоро свяжемся с вами.',
          fields: [
            {
              id: 'name',
              label: 'Имя',
              type: 'text',
              placeholder: 'Как к вам обращаться',
              required: true,
              helpText: 'Имя для ответа на заявку.',
              order: 1,
            },
            {
              id: 'contact',
              label: 'Телефон или email',
              type: 'text',
              placeholder: '+7 999 000-00-00',
              required: true,
              helpText: 'Телефон или email для связи.',
              order: 2,
            },
          ],
        },
      ],
    },
  ],
};
