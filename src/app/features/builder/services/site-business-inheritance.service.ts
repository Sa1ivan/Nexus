import { Injectable } from '@angular/core';

import type {
  FooterMapConfig,
  LinkConfig,
  MediaAsset,
  PageBlockConfig,
  SiteBusinessConfig,
  SiteConfig,
} from '../domain/models';
import { createMapSearchUrl } from '../domain/registry/block-registry';

@Injectable({
  providedIn: 'root',
})
export class SiteBusinessInheritanceService {
  apply(siteConfig: SiteConfig): SiteConfig {
    return {
      ...siteConfig,
      pages: siteConfig.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) => this.applyToBlock(block, siteConfig.business)),
      })),
    };
  }

  applyToBlock(block: PageBlockConfig, business: SiteBusinessConfig): PageBlockConfig {
    if (block.type === 'siteHeader' && block.inheritBusiness) {
      return {
        ...block,
        brandName: business.brandName,
        logo: this.createLogo(business),
      };
    }

    if (block.type === 'siteFooter' && block.inheritBusiness) {
      return {
        ...block,
        brandName: business.brandName,
        logo: this.createLogo(business),
        contactLines: this.createContactLines(business),
        socialLinks: this.createSocialLinks(business),
        map: this.createFooterMap(block.map, business.address),
      };
    }

    return block;
  }

  createContactLines(business: SiteBusinessConfig): readonly string[] {
    return [business.phone, business.email, business.address, business.hours]
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  createSocialLinks(business: SiteBusinessConfig): readonly LinkConfig[] {
    return [...business.socialLinks, ...business.messengers].map((link) => ({ ...link }));
  }

  createLogo(business: SiteBusinessConfig): MediaAsset | undefined {
    return business.logo === null
      ? undefined
      : {
          ...business.logo,
          focalPoint:
            business.logo.focalPoint === undefined ? undefined : { ...business.logo.focalPoint },
        };
  }

  createFooterMap(map: FooterMapConfig | undefined, address: string): FooterMapConfig {
    return {
      label: map?.label ?? 'Карта',
      address,
      embedUrl: createMapSearchUrl(address),
    };
  }
}
