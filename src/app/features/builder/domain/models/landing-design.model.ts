export type LandingAccentColor = 'teal' | 'blue' | 'rose' | 'violet' | 'amber';

export type LandingFontPairing = 'grotesk' | 'serif' | 'rounded';

export type LandingDensity = 'compact' | 'balanced' | 'spacious';

export type LandingTemplateStyle = 'classic' | 'editorial' | 'conversion';

export interface LandingDesignSettings {
  readonly accentColor: LandingAccentColor;
  readonly fontPairing: LandingFontPairing;
  readonly density: LandingDensity;
  readonly templateStyle: LandingTemplateStyle;
}

export interface LandingDesignOption<TValue extends string> {
  readonly id: TValue;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export const DEFAULT_LANDING_DESIGN_SETTINGS: LandingDesignSettings = {
  accentColor: 'teal',
  fontPairing: 'grotesk',
  density: 'balanced',
  templateStyle: 'classic',
};

export function getLandingAccentValue(accentColor: LandingAccentColor): string {
  switch (accentColor) {
    case 'teal':
      return '#0f766e';
    case 'blue':
      return '#2563eb';
    case 'rose':
      return '#be123c';
    case 'violet':
      return '#7c3aed';
    case 'amber':
      return '#b45309';
  }
}

export function getLandingFontFamily(fontPairing: LandingFontPairing): string {
  switch (fontPairing) {
    case 'grotesk':
      return "Roboto, 'Helvetica Neue', Arial, sans-serif";
    case 'serif':
      return "Georgia, 'Times New Roman', serif";
    case 'rounded':
      return "'Trebuchet MS', Roboto, Arial, sans-serif";
  }
}

export function getLandingRadiusValue(templateStyle: LandingTemplateStyle): string {
  switch (templateStyle) {
    case 'classic':
      return '8px';
    case 'editorial':
      return '2px';
    case 'conversion':
      return '14px';
  }
}

export function getLandingSectionPaddingY(density: LandingDensity): string {
  switch (density) {
    case 'compact':
      return '48px';
    case 'balanced':
      return '72px';
    case 'spacious':
      return '96px';
  }
}

export function getLandingHeaderPaddingY(density: LandingDensity): string {
  switch (density) {
    case 'compact':
      return '16px';
    case 'balanced':
      return '22px';
    case 'spacious':
      return '30px';
  }
}
