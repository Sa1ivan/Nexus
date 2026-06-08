import type { SiteConfig } from '../domain/models';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'site-mvp',
  name: 'MVP Website',
  pages: [
    {
      slug: 'home',
      title: 'Home',
      blocks: [
        {
          id: 'hero-home',
          type: 'hero',
          title: 'Build your website faster',
          subtitle: 'A clean SaaS-ready foundation for a visual website builder.',
          buttonText: 'Start building',
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
