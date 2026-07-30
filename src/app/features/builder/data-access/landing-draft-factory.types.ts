import type { OfferListItem } from '../domain/models';

export type LandingOfferPreset = Omit<OfferListItem, 'id'>;

export interface LandingIndustryPreset {
  readonly brandName: string;
  readonly siteName: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly ctaText: string;
  readonly offerEyebrow: string;
  readonly offerTitle: string;
  readonly navigationItems: readonly string[];
  readonly offers: readonly LandingOfferPreset[];
  readonly contactLines: readonly string[];
}
