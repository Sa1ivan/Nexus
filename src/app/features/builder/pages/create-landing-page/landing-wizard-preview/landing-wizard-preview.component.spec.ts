import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CompleteLandingWizardSelection } from '../../../domain/models';
import { LandingWizardPreviewComponent } from './landing-wizard-preview.component';

describe('LandingWizardPreviewComponent', () => {
  it('renders the complete wizard selection without replacing edited content', () => {
    const fixture = TestBed.createComponent(LandingWizardPreviewComponent);
    const selection: CompleteLandingWizardSelection = {
      industry: 'hotel',
      tone: 'premium',
      header: 'burgerMenu',
      offerList: 'roomCards',
      footer: 'contactMap',
      design: {
        accentColor: 'blue',
        fontPairing: 'grotesk',
        density: 'compact',
        templateStyle: 'conversion',
      },
      stepDesigns: {
        tone: {
          accentColor: 'rose',
          fontPairing: 'serif',
          density: 'compact',
          templateStyle: 'conversion',
        },
      },
      brandName: 'Тихий отель',
      heroTitle: 'Номера для спокойного отдыха',
      heroSubtitle: 'Описание, введенное пользователем',
      ctaText: 'Проверить свободные даты',
      ctaDestination: '#booking',
      contactEmail: 'booking@example.com',
      contactPhone: '+7 900 100-20-30',
    };

    fixture.componentRef.setInput('selection', selection);

    const siteConfig = fixture.componentInstance.siteConfig();
    const header = siteConfig.chrome.header;
    const hero = siteConfig.pages[0]?.blocks.find((block) => block.type === 'hero');

    expect(header?.type === 'siteHeader' ? header.cta.label : null).toBe(selection.ctaText);
    expect(hero?.type === 'hero' ? hero.buttonText : null).toBe(selection.ctaText);
    expect(siteConfig.theme.accentColor).toBe('#007aff');
    expect(hero?.design?.accentColor).toBe('rose');
    expect(hero?.appearance?.accentColor).toBe('#ff375f');
    expect(siteConfig.business.email).toBe(selection.contactEmail);
    expect(siteConfig.business.phone).toBe(selection.contactPhone);
  });
});
