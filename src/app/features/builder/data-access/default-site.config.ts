import { DEFAULT_LANDING_DESIGN_SETTINGS } from '../domain/models';
import type { SiteConfig } from '../domain/models';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'site-mvp',
  name: 'MVP-сайт',
  pages: [
    {
      slug: 'home',
      title: 'Главная',
      blocks: [
        {
          id: 'hero-home',
          type: 'hero',
          design: DEFAULT_LANDING_DESIGN_SETTINGS,
          title: 'Соберите сайт быстрее',
          subtitle: 'Чистая основа для визуального конструктора лендингов и сайтов.',
          buttonText: 'Начать сборку',
          styles: {
            backgroundColor: '#f5f7fb',
            textColor: '#111827',
            buttonBackgroundColor: '#2563eb',
            buttonTextColor: '#ffffff',
            minHeight: '520px',
            alignment: 'center',
          },
        },
      ],
    },
  ],
};
