import type { LandingDesignSettings } from './landing-design.model';

export type LandingWizardStepId =
  | 'industry'
  | 'tone'
  | 'header'
  | 'offerList'
  | 'footer'
  | 'summary';

export type LandingIndustry = 'restaurant' | 'hotel' | 'beauty' | 'product' | 'education';

export type LandingTone = 'premium' | 'friendly' | 'minimal' | 'bold';

export type LandingHeaderVariant = 'centeredHero' | 'splitMedia' | 'reservationBar' | 'editorial';

export type LandingOfferListVariant = 'menuGrid' | 'roomCards' | 'pricingTable' | 'catalogGrid';

export type LandingFooterVariant = 'contactMap' | 'compactLegal' | 'socialLead' | 'bookingFooter';

export interface LandingOption<TValue extends string> {
  readonly id: TValue;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export interface LandingWizardStep {
  readonly id: LandingWizardStepId;
  readonly label: string;
  readonly icon: string;
}

export interface LandingWizardSelection {
  readonly industry: LandingIndustry | null;
  readonly tone: LandingTone | null;
  readonly header: LandingHeaderVariant | null;
  readonly offerList: LandingOfferListVariant | null;
  readonly footer: LandingFooterVariant | null;
}

export interface CompleteLandingWizardSelection {
  readonly industry: LandingIndustry;
  readonly tone: LandingTone;
  readonly header: LandingHeaderVariant;
  readonly offerList: LandingOfferListVariant;
  readonly footer: LandingFooterVariant;
  readonly design: LandingDesignSettings;
  readonly brandName: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly ctaText: string;
  readonly ctaDestination: string;
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly stepDesigns?: Readonly<Partial<Record<LandingWizardStepId, LandingDesignSettings>>>;
}

export interface LandingBlueprintItem {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly completed: boolean;
}
