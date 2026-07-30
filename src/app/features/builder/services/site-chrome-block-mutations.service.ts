import { inject, Injectable } from '@angular/core';

import type {
  LinkConfig,
  LinkConfigUpdate,
  SiteBusinessConfig,
  SiteFooterBlockUpdate,
  SiteHeaderBlockUpdate,
} from '../domain/models';
import {
  duplicateCollectionItem,
  moveCollectionItem,
  removeCollectionItem,
} from '../domain/utils/collection-update';
import {
  createDefaultBooking,
  createExternalLink,
  createLink,
} from '../domain/registry/block-registry';
import type { MoveDirection } from '../stores/builder-store.types';
import { BlockConfigMergeService } from './block-config-merge.service';
import { IdentifiedCollectionService } from './identified-collection.service';
import { SiteBusinessInheritanceService } from './site-business-inheritance.service';
import { BuilderElementIdService } from './builder-element-id.service';
import type { BlockMutationExecutor } from './block-mutation.types';
import type { FooterLinkCollection } from './site-chrome-block-mutations.types';

@Injectable({ providedIn: 'root' })
export class SiteChromeBlockMutationsService {
  private readonly merge = inject(BlockConfigMergeService);
  private readonly collections = inject(IdentifiedCollectionService);
  private readonly inheritance = inject(SiteBusinessInheritanceService);
  private readonly ids = inject(BuilderElementIdService);

  updateSiteHeaderBlock(
    execute: BlockMutationExecutor,
    business: SiteBusinessConfig,
    blockId: string,
    update: SiteHeaderBlockUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const hasBusinessOverride = update.brandName !== undefined || update.logo !== undefined;
      const inheritBusiness =
        update.inheritBusiness ?? (hasBusinessOverride ? false : block.inheritBusiness);

      return {
        ...block,
        inheritBusiness,
        variant: update.variant ?? block.variant,
        brandName: inheritBusiness ? business.brandName : (update.brandName ?? block.brandName),
        logo: inheritBusiness
          ? this.inheritance.createLogo(business)
          : this.merge.mergeOptionalMedia(block.logo, update.logo),
        navigationItems: update.navigationItems ?? block.navigationItems,
        cta: this.merge.mergeLink(block.cta, update.cta),
        booking:
          update.booking === undefined
            ? block.booking
            : this.merge.mergeBooking(block.booking ?? createDefaultBooking(), update.booking),
      };
    });
  }

  updateHeaderNavigationItem(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
    update: LinkConfigUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const linkIndex = this.collections.findIndex(block.navigationItems, linkId);

      if (linkIndex === -1) {
        return block;
      }

      const nextLink = this.merge.mergeLink(block.navigationItems[linkIndex]!, update);

      if (nextLink === block.navigationItems[linkIndex]) {
        return block;
      }

      return {
        ...block,
        navigationItems: block.navigationItems.map((link, index) =>
          index === linkIndex ? nextLink : link,
        ),
      };
    });
  }

  addHeaderNavigationItem(execute: BlockMutationExecutor, blockId: string): boolean {
    return execute(blockId, (block) =>
      block.type === 'siteHeader'
        ? {
            ...block,
            navigationItems: [...block.navigationItems, createLink('Новая ссылка', '#lead-form')],
          }
        : block,
    );
  }

  duplicateHeaderNavigationItem(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const linkIndex = this.collections.findIndex(block.navigationItems, linkId);
      const navigationItems = duplicateCollectionItem(block.navigationItems, linkIndex, (link) =>
        this.merge.duplicateLink(link, this.ids.create('link')),
      );

      return navigationItems === block.navigationItems ? block : { ...block, navigationItems };
    });
  }

  moveHeaderNavigationItem(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
    direction: MoveDirection,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const currentIndex = this.collections.findIndex(block.navigationItems, linkId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const navigationItems = moveCollectionItem(block.navigationItems, currentIndex, nextIndex);

      return navigationItems === block.navigationItems ? block : { ...block, navigationItems };
    });
  }

  removeHeaderNavigationItem(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'siteHeader') {
        return block;
      }

      const linkIndex = this.collections.findIndex(block.navigationItems, linkId);
      const navigationItems = removeCollectionItem(block.navigationItems, linkIndex, 1);

      return navigationItems === block.navigationItems ? block : { ...block, navigationItems };
    });
  }

  updateSiteFooterBlock(
    execute: BlockMutationExecutor,
    business: SiteBusinessConfig,
    blockId: string,
    update: SiteFooterBlockUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'siteFooter') {
        return block;
      }

      const hasBusinessOverride =
        update.brandName !== undefined ||
        update.logo !== undefined ||
        update.contactLines !== undefined ||
        update.socialLinks !== undefined ||
        update.map !== undefined;
      const inheritBusiness =
        update.inheritBusiness ?? (hasBusinessOverride ? false : block.inheritBusiness);
      const updatedMap =
        update.map === undefined
          ? block.map
          : {
              label: update.map.label ?? block.map?.label ?? 'Карта',
              address: update.map.address ?? block.map?.address ?? '',
              embedUrl: update.map.embedUrl ?? block.map?.embedUrl ?? '',
            };

      return {
        ...block,
        inheritBusiness,
        variant: update.variant ?? block.variant,
        brandName: inheritBusiness ? business.brandName : (update.brandName ?? block.brandName),
        logo: inheritBusiness
          ? this.inheritance.createLogo(business)
          : this.merge.mergeOptionalMedia(block.logo, update.logo),
        cta: this.merge.mergeLink(block.cta, update.cta),
        contactLines: inheritBusiness
          ? this.inheritance.createContactLines(business)
          : (update.contactLines ?? block.contactLines),
        links: update.links ?? block.links,
        socialLinks: inheritBusiness
          ? this.inheritance.createSocialLinks(business)
          : (update.socialLinks ?? block.socialLinks),
        map: inheritBusiness
          ? this.inheritance.createFooterMap(updatedMap, business.address)
          : updatedMap,
      };
    });
  }

  updateFooterLink(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
    update: LinkConfigUpdate,
  ): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'links', (links) => {
      const linkIndex = this.collections.findIndex(links, linkId);
      const link = links[linkIndex];

      if (linkIndex === -1 || link === undefined) {
        return links;
      }

      const nextLink = this.merge.mergeLink(link, update);

      return nextLink === link
        ? links
        : links.map((currentLink, index) => (index === linkIndex ? nextLink : currentLink));
    });
  }

  addFooterLink(execute: BlockMutationExecutor, blockId: string): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'links', (links) => [
      ...links,
      createLink('Новая ссылка', '#contact'),
    ]);
  }

  duplicateFooterLink(execute: BlockMutationExecutor, blockId: string, linkId: string): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'links', (links) =>
      duplicateCollectionItem(links, this.collections.findIndex(links, linkId), (link) =>
        this.merge.duplicateLink(link, this.ids.create('link')),
      ),
    );
  }

  moveFooterLink(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
    direction: MoveDirection,
  ): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'links', (links) => {
      const currentIndex = this.collections.findIndex(links, linkId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      return moveCollectionItem(links, currentIndex, nextIndex);
    });
  }

  removeFooterLink(execute: BlockMutationExecutor, blockId: string, linkId: string): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'links', (links) =>
      removeCollectionItem(links, this.collections.findIndex(links, linkId), 1),
    );
  }

  updateFooterSocialLink(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
    update: LinkConfigUpdate,
  ): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'socialLinks', (links) => {
      const linkIndex = this.collections.findIndex(links, linkId);
      const link = links[linkIndex];

      if (linkIndex === -1 || link === undefined) {
        return links;
      }

      const nextLink = this.merge.mergeLink(link, update);

      return nextLink === link
        ? links
        : links.map((currentLink, index) => (index === linkIndex ? nextLink : currentLink));
    });
  }

  addFooterSocialLink(execute: BlockMutationExecutor, blockId: string): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'socialLinks', (links) => [
      ...links,
      createExternalLink('Новая соцсеть', 'https://example.com'),
    ]);
  }

  duplicateFooterSocialLink(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
  ): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'socialLinks', (links) =>
      duplicateCollectionItem(links, this.collections.findIndex(links, linkId), (link) =>
        this.merge.duplicateLink(link, this.ids.create('link')),
      ),
    );
  }

  moveFooterSocialLink(
    execute: BlockMutationExecutor,
    blockId: string,
    linkId: string,
    direction: MoveDirection,
  ): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'socialLinks', (links) => {
      const currentIndex = this.collections.findIndex(links, linkId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      return moveCollectionItem(links, currentIndex, nextIndex);
    });
  }

  removeFooterSocialLink(execute: BlockMutationExecutor, blockId: string, linkId: string): boolean {
    return this.updateFooterLinkCollection(execute, blockId, 'socialLinks', (links) =>
      removeCollectionItem(links, this.collections.findIndex(links, linkId)),
    );
  }

  private updateFooterLinkCollection(
    execute: BlockMutationExecutor,
    blockId: string,
    collection: FooterLinkCollection,
    updater: (links: readonly LinkConfig[]) => readonly LinkConfig[],
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'siteFooter') return block;
      const currentLinks = collection === 'links' ? block.links : (block.socialLinks ?? []);
      const links = updater(currentLinks);
      if (links === currentLinks) return block;
      return collection === 'links'
        ? { ...block, links }
        : { ...block, inheritBusiness: false, socialLinks: links.length === 0 ? undefined : links };
    });
  }
}
