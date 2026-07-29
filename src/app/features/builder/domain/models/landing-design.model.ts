export const LANDING_ACCENT_VALUES = {
  teal: '#0a7f72',
  blue: '#007aff',
  rose: '#ff375f',
  violet: '#7d5fff',
  amber: '#b87514',
  indigo: '#4f46e5',
  cyan: '#0891b2',
  emerald: '#059669',
  orange: '#ea580c',
  magenta: '#c026d3',
} as const;

export const LANDING_FONT_FAMILIES = {
  grotesk:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
  serif: "'New York', Georgia, 'Times New Roman', serif",
  rounded: "'SF Pro Rounded', 'Avenir Next', 'Helvetica Neue', Arial, sans-serif",
  geometric: "'Avenir Next', Avenir, Futura, 'Century Gothic', Arial, sans-serif",
  humanist: "Optima, Candara, 'Trebuchet MS', Arial, sans-serif",
  mono: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
} as const;

export type LandingAccentPreset = keyof typeof LANDING_ACCENT_VALUES;
export type CustomAccentColor = `#${string}`;
export type LandingAccentColor = LandingAccentPreset | CustomAccentColor;

export type LandingFontPairing = keyof typeof LANDING_FONT_FAMILIES;

export interface LandingAccentRgb {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

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
  return isLandingAccentPreset(accentColor)
    ? LANDING_ACCENT_VALUES[accentColor]
    : isCustomAccentColor(accentColor)
      ? accentColor.toLowerCase()
      : LANDING_ACCENT_VALUES.teal;
}

export function getLandingFontFamily(fontPairing: LandingFontPairing): string {
  return LANDING_FONT_FAMILIES[fontPairing];
}

export function parseLandingRgbColor(value: string): CustomAccentColor | null {
  const match = value.trim().match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/iu);

  if (match === null) {
    return null;
  }

  const channels = match.slice(1).map(Number);

  if (channels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)) {
    return null;
  }

  return rgbChannelsToAccent({
    red: channels[0]!,
    green: channels[1]!,
    blue: channels[2]!,
  });
}

export function rgbChannelsToAccent(rgb: LandingAccentRgb): CustomAccentColor {
  return `#${[rgb.red, rgb.green, rgb.blue]
    .map((channel) => clampRgbChannel(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function getLandingAccentRgb(accentColor: LandingAccentColor): LandingAccentRgb {
  const value = getLandingAccentValue(accentColor);

  return {
    red: Number.parseInt(value.slice(1, 3), 16),
    green: Number.parseInt(value.slice(3, 5), 16),
    blue: Number.parseInt(value.slice(5, 7), 16),
  };
}

export function formatLandingAccentRgb(accentColor: LandingAccentColor): string {
  const { red, green, blue } = getLandingAccentRgb(accentColor);

  return `rgb(${red}, ${green}, ${blue})`;
}

export function getReadableTextColor(backgroundColor: string): '#0b1020' | '#ffffff' {
  const backgroundLuminance = getColorLuminance(backgroundColor);

  if (backgroundLuminance === null) {
    return '#0b1020';
  }

  const darkContrast = contrastRatio(backgroundLuminance, getColorLuminance('#0b1020')!);
  const lightContrast = contrastRatio(backgroundLuminance, 1);

  return darkContrast >= lightContrast ? '#0b1020' : '#ffffff';
}

export function isLandingAccentPreset(value: string): value is LandingAccentPreset {
  return Object.hasOwn(LANDING_ACCENT_VALUES, value);
}

export function isCustomAccentColor(value: string): value is CustomAccentColor {
  return /^#[\da-f]{6}$/iu.test(value);
}

function clampRgbChannel(channel: number): number {
  if (!Number.isFinite(channel)) {
    return 0;
  }

  return Math.min(255, Math.max(0, Math.round(channel)));
}

function getColorLuminance(color: string): number | null {
  const trimmed = color.trim();
  const longHex = trimmed.match(/^#([\da-f]{6})(?:[\da-f]{2})?$/iu)?.[1];
  const shortHex = trimmed.match(/^#([\da-f]{3})(?:[\da-f])?$/iu)?.[1];
  const rgbHex = parseLandingRgbColor(trimmed)?.slice(1);
  const namedHex =
    trimmed.toLowerCase() === 'black'
      ? '000000'
      : trimmed.toLowerCase() === 'white'
        ? 'ffffff'
        : undefined;
  const normalized =
    longHex ??
    (shortHex === undefined
      ? undefined
      : [...shortHex].map((channel) => `${channel}${channel}`).join('')) ??
    rgbHex ??
    namedHex;

  if (normalized === undefined) {
    return null;
  }

  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return red! * 0.2126 + green! * 0.7152 + blue! * 0.0722;
}

function contrastRatio(firstLuminance: number, secondLuminance: number): number {
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
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
