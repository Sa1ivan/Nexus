import type { LandingFontPairing } from './landing-design.model';

export type ContentWidth = 'narrow' | 'wide' | 'full';
export type SectionSpacing = 'compact' | 'balanced' | 'spacious';
export type ButtonShape = 'square' | 'rounded' | 'pill';
export type TypeScale = 'compact' | 'balanced' | 'display';

export interface SiteThemeConfig {
  readonly pageBackground: string;
  readonly surfaceColor: string;
  readonly textColor: string;
  readonly mutedTextColor: string;
  readonly accentColor: string;
  readonly fontPairing: LandingFontPairing;
  readonly typeScale: TypeScale;
  readonly contentWidth: ContentWidth;
  readonly sectionSpacing: SectionSpacing;
  readonly buttonShape: ButtonShape;
  readonly radius: number;
}

export const DEFAULT_SITE_THEME: SiteThemeConfig = {
  pageBackground: '#ffffff',
  surfaceColor: '#f5f7fb',
  textColor: '#111827',
  mutedTextColor: '#5f6b7a',
  accentColor: '#0a7f72',
  fontPairing: 'grotesk',
  typeScale: 'balanced',
  contentWidth: 'wide',
  sectionSpacing: 'balanced',
  buttonShape: 'rounded',
  radius: 8,
};
