import type { ContentWidth, SectionSpacing, SiteThemeConfig } from './site-theme.model';
import type { LandingFontPairing } from './landing-design.model';

export interface BlockAppearanceOverrides {
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly accentColor?: string;
  readonly contentWidth?: ContentWidth;
  readonly spacing?: SectionSpacing;
  readonly radius?: number;
  readonly fontPairing?: LandingFontPairing;
}

export interface ResolvedBlockAppearance {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly accentColor: string;
  readonly contentWidth: ContentWidth;
  readonly spacing: SectionSpacing;
  readonly radius: number;
  readonly fontPairing: LandingFontPairing;
}

export const DEFAULT_BLOCK_APPEARANCE: BlockAppearanceOverrides = {};

export function resolveBlockAppearance(
  theme: SiteThemeConfig,
  overrides: BlockAppearanceOverrides = DEFAULT_BLOCK_APPEARANCE,
): ResolvedBlockAppearance {
  return {
    backgroundColor: overrides.backgroundColor ?? theme.surfaceColor,
    textColor: overrides.textColor ?? theme.textColor,
    accentColor: overrides.accentColor ?? theme.accentColor,
    contentWidth: overrides.contentWidth ?? theme.contentWidth,
    spacing: overrides.spacing ?? theme.sectionSpacing,
    radius: clampRadius(overrides.radius ?? theme.radius),
    fontPairing: overrides.fontPairing ?? theme.fontPairing,
  };
}

function clampRadius(radius: number): number {
  return Math.min(32, Math.max(0, radius));
}
