import { DEFAULT_LANDING_DESIGN_SETTINGS, SITE_CONFIG_SCHEMA_VERSION } from '../domain/models';
import type { SiteConfig } from '../domain/models';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'site-mvp',
  schemaVersion: SITE_CONFIG_SCHEMA_VERSION,
  name: 'MVP-сайт',
  pages: [
    {
      id: 'page-home',
      slug: 'home',
      title: 'Главная',
      blocks: [
        {
          id: 'hero-home',
          anchor: 'hero',
          type: 'hero',
          design: DEFAULT_LANDING_DESIGN_SETTINGS,
          title: 'Соберите сайт быстрее',
          subtitle: 'Чистая основа для визуального конструктора лендингов и сайтов.',
          buttonText: 'Начать сборку',
          buttonHref: '#lead-form',
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
            },
            {
              id: 'contact',
              label: 'Телефон или email',
              type: 'text',
              placeholder: '+7 999 000-00-00',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
