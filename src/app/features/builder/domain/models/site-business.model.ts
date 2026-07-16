import type { LinkConfig } from './link-config.model';
import type { MediaAsset } from './media-asset.model';

export interface SiteBusinessConfig {
  readonly brandName: string;
  readonly logo: MediaAsset | null;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly hours: string;
  readonly messengers: readonly LinkConfig[];
  readonly socialLinks: readonly LinkConfig[];
}

export const DEFAULT_SITE_BUSINESS: SiteBusinessConfig = {
  brandName: 'Nexus Studio',
  logo: null,
  phone: '',
  email: '',
  address: '',
  hours: '',
  messengers: [],
  socialLinks: [],
};
