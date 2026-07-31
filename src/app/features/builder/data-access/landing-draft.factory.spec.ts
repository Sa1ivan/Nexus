import { describe, expect, it } from 'vitest';

import type {
  CompleteLandingWizardSelection,
  HeroBlockConfig,
  LandingAccentColor,
  LandingDesignSettings,
  LandingTemplateStyle,
  LandingTone,
} from '../domain/models';
import { buildLandingDraft } from './landing-draft.factory';

const BASE_DESIGN: LandingDesignSettings = {
  accentColor: 'teal',
  fontPairing: 'grotesk',
  density: 'balanced',
  templateStyle: 'classic',
};

describe('buildLandingDraft', () => {
  it.each([
    ['premium', 'conversion', 'teal'],
    ['bold', 'conversion', 'blue'],
    ['friendly', 'classic', 'rose'],
    ['minimal', 'editorial', 'amber'],
  ] satisfies readonly [LandingTone, LandingTemplateStyle, LandingAccentColor][])(
    'keeps hero and CTA text readable for %s/%s/%s',
    (tone, templateStyle, accentColor) => {
      const hero = getHero(
        buildLandingDraft(
          createSelection(
            {
              accentColor,
              templateStyle,
            },
            tone,
          ),
        ),
      );

      expect(
        contrastRatio(hero.styles.backgroundColor, hero.styles.textColor),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(
          hero.primaryButtonAppearance?.backgroundColor ?? '',
          hero.primaryButtonAppearance?.textColor ?? '',
        ),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('uses a custom accent in the generated theme and hero button', () => {
    const selection = createSelection({ accentColor: '#0c2238' as LandingAccentColor });
    const draft = buildLandingDraft(selection);
    const hero = getHero(draft);

    expect(draft.theme.accentColor).toBe('#0c2238');
    expect(hero.primaryButtonAppearance?.backgroundColor).toBe('#0c2238');
  });

  it('writes per-step design differences as block appearance overrides', () => {
    const selection = createSelection({ accentColor: 'blue', templateStyle: 'conversion' });
    const draft = buildLandingDraft({
      ...selection,
      stepDesigns: {
        ...selection.stepDesigns,
        tone: {
          ...selection.design,
          accentColor: 'rose',
        },
        header: {
          ...selection.design,
          fontPairing: 'humanist',
        },
      },
    });
    const header = draft.chrome.header;
    const hero = getHero(draft);

    expect(draft.theme.accentColor).toBe('#007aff');
    expect(draft.theme.radius).toBe(14);
    expect(header?.appearance).toMatchObject({
      fontPairing: 'humanist',
    });
    expect(header?.appearance?.accentColor).toBeUndefined();
    expect(hero.appearance?.accentColor).toBe('#ff375f');
    expect(hero.primaryButtonAppearance?.backgroundColor).toBe('#ff375f');
  });
});

function createSelection(
  designUpdate: Partial<LandingDesignSettings> = {},
  tone: LandingTone = 'minimal',
): CompleteLandingWizardSelection {
  const design = { ...BASE_DESIGN, ...designUpdate };

  return {
    industry: 'product',
    tone,
    header: 'centeredHero',
    offerList: 'catalogGrid',
    footer: 'compactLegal',
    design,
    stepDesigns: {
      industry: design,
      tone: design,
      header: design,
      offerList: design,
      footer: design,
      summary: design,
    },
    brandName: 'Nexus Studio',
    heroTitle: 'Понятный заголовок',
    heroSubtitle: 'Понятное описание',
    ctaText: 'Запросить демо',
    ctaDestination: '#lead-form',
    contactEmail: 'hello@nexus.app',
    contactPhone: '+7 999 000-00-00',
  };
}

function getHero(draft: ReturnType<typeof buildLandingDraft>): HeroBlockConfig {
  const hero = draft.pages[0]?.blocks.find(
    (block): block is HeroBlockConfig => block.type === 'hero',
  );

  if (hero === undefined) {
    throw new Error('Hero block is missing.');
  }

  return hero;
}

function contrastRatio(background: string, foreground: string): number {
  const first = relativeLuminance(background);
  const second = relativeLuminance(foreground);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: string): number {
  const hex = color.match(/^#([\da-f]{6})$/iu)?.[1];

  if (hex === undefined) {
    throw new Error(`Unsupported test color: ${color}`);
  }

  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return red! * 0.2126 + green! * 0.7152 + blue! * 0.0722;
}
