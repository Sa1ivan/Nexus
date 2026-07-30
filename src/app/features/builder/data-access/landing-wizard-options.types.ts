import type {
  LandingDesignSettings,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingOfferListVariant,
  LandingTone,
} from '../domain/models';

export interface LandingIndustryRecommendation {
  readonly tone: LandingTone;
  readonly header: LandingHeaderVariant;
  readonly offerList: LandingOfferListVariant;
  readonly footer: LandingFooterVariant;
  readonly design: LandingDesignSettings;
}
