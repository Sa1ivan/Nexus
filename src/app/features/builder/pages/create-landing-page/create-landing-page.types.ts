import type {
  LandingAccentColor,
  LandingAccentRgb,
  LandingDensity,
  LandingDesignSettings,
  LandingFooterVariant,
  LandingFontPairing,
  LandingHeaderVariant,
  LandingIndustry,
  LandingOfferListVariant,
  LandingTemplateStyle,
  LandingTone,
  LandingWizardStepId,
} from '../../domain/models';

export interface LandingQuestionCopy {
  readonly title: string;
  readonly description: string;
}

export interface LandingBusinessDetails {
  readonly brandName: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly ctaText: string;
  readonly ctaDestination: string;
  readonly contactEmail: string;
  readonly contactPhone: string;
}

export type LandingChoiceId =
  | LandingIndustry
  | LandingTone
  | LandingHeaderVariant
  | LandingOfferListVariant
  | LandingFooterVariant
  | LandingAccentColor
  | LandingFontPairing
  | LandingDensity
  | LandingTemplateStyle;

export type BusinessDetailsField = keyof LandingBusinessDetails;
export type LandingAccentRgbChannel = keyof LandingAccentRgb;
export type LandingDesignByStep = Readonly<Record<LandingWizardStepId, LandingDesignSettings>>;
