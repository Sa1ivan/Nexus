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
      return '#0a7f72';
    case 'blue':
      return '#007aff';
    case 'rose':
      return '#ff375f';
    case 'violet':
      return '#7d5fff';
    case 'amber':
      return '#b87514';
  }
}

export function getLandingFontFamily(fontPairing: LandingFontPairing): string {
  switch (fontPairing) {
    case 'grotesk':
      return "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
    case 'serif':
      return "'New York', Georgia, 'Times New Roman', serif";
    case 'rounded':
      return "'SF Pro Rounded', 'Avenir Next', 'Helvetica Neue', Arial, sans-serif";
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
