import { inject, Injectable } from '@angular/core';

import type {
  CallToActionBlockUpdate,
  ContentMediaBlockUpdate,
  FaqBlockUpdate,
  FaqItemUpdate,
  FeatureGridBlockUpdate,
  FeatureGridItemUpdate,
  GalleryBlockUpdate,
  GalleryItemUpdate,
  HeroBlockUpdate,
  LeadFormBlockUpdate,
  LeadFormFieldConfig,
  LinkConfigUpdate,
  OfferListBlockUpdate,
  OfferListItemUpdate,
  SiteFooterBlockUpdate,
  SiteHeaderBlockUpdate,
  TestimonialItemUpdate,
  TestimonialsBlockUpdate,
} from '../domain/models';
import type { BlockMutationExecutor } from '../services/block-mutation.types';
import { FeatureOfferBlockMutationsService } from '../services/feature-offer-block-mutations.service';
import { GalleryBlockMutationsService } from '../services/gallery-block-mutations.service';
import { HeroContentBlockMutationsService } from '../services/hero-content-block-mutations.service';
import { LeadFormBlockMutationsService } from '../services/lead-form-block-mutations.service';
import { SiteChromeBlockMutationsService } from '../services/site-chrome-block-mutations.service';
import { SocialProofBlockMutationsService } from '../services/social-proof-block-mutations.service';
import { BuilderStore } from './builder.store';
import type { MoveDirection } from './builder-store.types';

@Injectable({ providedIn: 'root' })
export class BuilderBlockStore {
  private readonly builderStore = inject(BuilderStore);
  private readonly heroContentMutations = inject(HeroContentBlockMutationsService);
  private readonly siteChromeMutations = inject(SiteChromeBlockMutationsService);
  private readonly featureOfferMutations = inject(FeatureOfferBlockMutationsService);
  private readonly galleryMutations = inject(GalleryBlockMutationsService);
  private readonly socialProofMutations = inject(SocialProofBlockMutationsService);
  private readonly leadFormMutations = inject(LeadFormBlockMutationsService);
  private readonly executeBlockMutation: BlockMutationExecutor = (blockId, updater) =>
    this.builderStore.applyBlockMutation(blockId, updater);

  updateHeroBlock(blockId: string, update: HeroBlockUpdate): boolean {
    return this.heroContentMutations.updateHeroBlock(this.executeBlockMutation, blockId, update);
  }

  updateSiteHeaderBlock(blockId: string, update: SiteHeaderBlockUpdate): boolean {
    return this.siteChromeMutations.updateSiteHeaderBlock(
      this.executeBlockMutation,
      this.builderStore.siteConfig().business,
      blockId,
      update,
    );
  }

  updateContentMediaBlock(blockId: string, update: ContentMediaBlockUpdate): boolean {
    return this.heroContentMutations.updateContentMediaBlock(
      this.executeBlockMutation,
      blockId,
      update,
    );
  }

  updateFeatureGridBlock(blockId: string, update: FeatureGridBlockUpdate): boolean {
    return this.featureOfferMutations.updateFeatureGridBlock(
      this.executeBlockMutation,
      blockId,
      update,
    );
  }

  updateFeatureGridItem(blockId: string, itemId: string, update: FeatureGridItemUpdate): boolean {
    return this.featureOfferMutations.updateFeatureGridItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      update,
    );
  }

  addFeatureGridItem(blockId: string): boolean {
    return this.featureOfferMutations.addFeatureGridItem(this.executeBlockMutation, blockId);
  }

  duplicateFeatureGridItem(blockId: string, itemId: string): boolean {
    return this.featureOfferMutations.duplicateFeatureGridItem(
      this.executeBlockMutation,
      blockId,
      itemId,
    );
  }

  moveFeatureGridItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.featureOfferMutations.moveFeatureGridItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      direction,
    );
  }

  removeFeatureGridItem(blockId: string, itemId: string): boolean {
    return this.featureOfferMutations.removeFeatureGridItem(
      this.executeBlockMutation,
      blockId,
      itemId,
    );
  }

  updateHeaderNavigationItem(blockId: string, linkId: string, update: LinkConfigUpdate): boolean {
    return this.siteChromeMutations.updateHeaderNavigationItem(
      this.executeBlockMutation,
      blockId,
      linkId,
      update,
    );
  }

  addHeaderNavigationItem(blockId: string): boolean {
    return this.siteChromeMutations.addHeaderNavigationItem(this.executeBlockMutation, blockId);
  }

  duplicateHeaderNavigationItem(blockId: string, linkId: string): boolean {
    return this.siteChromeMutations.duplicateHeaderNavigationItem(
      this.executeBlockMutation,
      blockId,
      linkId,
    );
  }

  moveHeaderNavigationItem(blockId: string, linkId: string, direction: MoveDirection): boolean {
    return this.siteChromeMutations.moveHeaderNavigationItem(
      this.executeBlockMutation,
      blockId,
      linkId,
      direction,
    );
  }

  removeHeaderNavigationItem(blockId: string, linkId: string): boolean {
    return this.siteChromeMutations.removeHeaderNavigationItem(
      this.executeBlockMutation,
      blockId,
      linkId,
    );
  }

  updateOfferListBlock(blockId: string, update: OfferListBlockUpdate): boolean {
    return this.featureOfferMutations.updateOfferListBlock(
      this.executeBlockMutation,
      blockId,
      update,
    );
  }

  updateOfferListItem(
    blockId: string,
    itemIdentity: number | string,
    update: OfferListItemUpdate,
  ): boolean {
    return this.featureOfferMutations.updateOfferListItem(
      this.executeBlockMutation,
      blockId,
      itemIdentity,
      update,
    );
  }

  addOfferListItem(blockId: string): boolean {
    return this.featureOfferMutations.addOfferListItem(this.executeBlockMutation, blockId);
  }

  duplicateOfferListItem(blockId: string, itemIdentity: number | string): boolean {
    return this.featureOfferMutations.duplicateOfferListItem(
      this.executeBlockMutation,
      blockId,
      itemIdentity,
    );
  }

  moveOfferListItem(
    blockId: string,
    itemIdentity: number | string,
    direction: MoveDirection,
  ): boolean {
    return this.featureOfferMutations.moveOfferListItem(
      this.executeBlockMutation,
      blockId,
      itemIdentity,
      direction,
    );
  }

  removeOfferListItem(blockId: string, itemIdentity: number | string): boolean {
    return this.featureOfferMutations.removeOfferListItem(
      this.executeBlockMutation,
      blockId,
      itemIdentity,
    );
  }

  updateGalleryBlock(blockId: string, update: GalleryBlockUpdate): boolean {
    return this.galleryMutations.updateGalleryBlock(this.executeBlockMutation, blockId, update);
  }

  updateGalleryItem(blockId: string, itemId: string, update: GalleryItemUpdate): boolean {
    return this.galleryMutations.updateGalleryItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      update,
    );
  }

  addGalleryItem(blockId: string): boolean {
    return this.galleryMutations.addGalleryItem(this.executeBlockMutation, blockId);
  }

  duplicateGalleryItem(blockId: string, itemId: string): boolean {
    return this.galleryMutations.duplicateGalleryItem(this.executeBlockMutation, blockId, itemId);
  }

  moveGalleryItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.galleryMutations.moveGalleryItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      direction,
    );
  }

  removeGalleryItem(blockId: string, itemId: string): boolean {
    return this.galleryMutations.removeGalleryItem(this.executeBlockMutation, blockId, itemId);
  }

  updateTestimonialsBlock(blockId: string, update: TestimonialsBlockUpdate): boolean {
    return this.socialProofMutations.updateTestimonialsBlock(
      this.executeBlockMutation,
      blockId,
      update,
    );
  }

  updateTestimonialItem(blockId: string, itemId: string, update: TestimonialItemUpdate): boolean {
    return this.socialProofMutations.updateTestimonialItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      update,
    );
  }

  addTestimonialItem(blockId: string): boolean {
    return this.socialProofMutations.addTestimonialItem(this.executeBlockMutation, blockId);
  }

  duplicateTestimonialItem(blockId: string, itemId: string): boolean {
    return this.socialProofMutations.duplicateTestimonialItem(
      this.executeBlockMutation,
      blockId,
      itemId,
    );
  }

  moveTestimonialItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.socialProofMutations.moveTestimonialItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      direction,
    );
  }

  removeTestimonialItem(blockId: string, itemId: string): boolean {
    return this.socialProofMutations.removeTestimonialItem(
      this.executeBlockMutation,
      blockId,
      itemId,
    );
  }

  updateFaqBlock(blockId: string, update: FaqBlockUpdate): boolean {
    return this.socialProofMutations.updateFaqBlock(this.executeBlockMutation, blockId, update);
  }

  updateFaqItem(blockId: string, itemId: string, update: FaqItemUpdate): boolean {
    return this.socialProofMutations.updateFaqItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      update,
    );
  }

  addFaqItem(blockId: string): boolean {
    return this.socialProofMutations.addFaqItem(this.executeBlockMutation, blockId);
  }

  duplicateFaqItem(blockId: string, itemId: string): boolean {
    return this.socialProofMutations.duplicateFaqItem(this.executeBlockMutation, blockId, itemId);
  }

  moveFaqItem(blockId: string, itemId: string, direction: MoveDirection): boolean {
    return this.socialProofMutations.moveFaqItem(
      this.executeBlockMutation,
      blockId,
      itemId,
      direction,
    );
  }

  removeFaqItem(blockId: string, itemId: string): boolean {
    return this.socialProofMutations.removeFaqItem(this.executeBlockMutation, blockId, itemId);
  }

  updateCallToActionBlock(blockId: string, update: CallToActionBlockUpdate): boolean {
    return this.heroContentMutations.updateCallToActionBlock(
      this.executeBlockMutation,
      blockId,
      update,
    );
  }

  updateSiteFooterBlock(blockId: string, update: SiteFooterBlockUpdate): boolean {
    return this.siteChromeMutations.updateSiteFooterBlock(
      this.executeBlockMutation,
      this.builderStore.siteConfig().business,
      blockId,
      update,
    );
  }

  updateFooterLink(blockId: string, linkId: string, update: LinkConfigUpdate): boolean {
    return this.siteChromeMutations.updateFooterLink(
      this.executeBlockMutation,
      blockId,
      linkId,
      update,
    );
  }

  addFooterLink(blockId: string): boolean {
    return this.siteChromeMutations.addFooterLink(this.executeBlockMutation, blockId);
  }

  duplicateFooterLink(blockId: string, linkId: string): boolean {
    return this.siteChromeMutations.duplicateFooterLink(this.executeBlockMutation, blockId, linkId);
  }

  moveFooterLink(blockId: string, linkId: string, direction: MoveDirection): boolean {
    return this.siteChromeMutations.moveFooterLink(
      this.executeBlockMutation,
      blockId,
      linkId,
      direction,
    );
  }

  removeFooterLink(blockId: string, linkId: string): boolean {
    return this.siteChromeMutations.removeFooterLink(this.executeBlockMutation, blockId, linkId);
  }

  updateFooterSocialLink(blockId: string, linkId: string, update: LinkConfigUpdate): boolean {
    return this.siteChromeMutations.updateFooterSocialLink(
      this.executeBlockMutation,
      blockId,
      linkId,
      update,
    );
  }

  addFooterSocialLink(blockId: string): boolean {
    return this.siteChromeMutations.addFooterSocialLink(this.executeBlockMutation, blockId);
  }

  duplicateFooterSocialLink(blockId: string, linkId: string): boolean {
    return this.siteChromeMutations.duplicateFooterSocialLink(
      this.executeBlockMutation,
      blockId,
      linkId,
    );
  }

  moveFooterSocialLink(blockId: string, linkId: string, direction: MoveDirection): boolean {
    return this.siteChromeMutations.moveFooterSocialLink(
      this.executeBlockMutation,
      blockId,
      linkId,
      direction,
    );
  }

  removeFooterSocialLink(blockId: string, linkId: string): boolean {
    return this.siteChromeMutations.removeFooterSocialLink(
      this.executeBlockMutation,
      blockId,
      linkId,
    );
  }

  updateLeadFormBlock(blockId: string, update: LeadFormBlockUpdate): boolean {
    return this.leadFormMutations.updateLeadFormBlock(this.executeBlockMutation, blockId, update);
  }

  updateLeadFormField(
    blockId: string,
    fieldId: string,
    update: Partial<LeadFormFieldConfig>,
  ): boolean {
    return this.leadFormMutations.updateLeadFormField(
      this.executeBlockMutation,
      blockId,
      fieldId,
      update,
    );
  }

  addLeadFormField(blockId: string): boolean {
    return this.leadFormMutations.addLeadFormField(this.executeBlockMutation, blockId);
  }

  duplicateLeadFormField(blockId: string, fieldId: string): boolean {
    return this.leadFormMutations.duplicateLeadFormField(
      this.executeBlockMutation,
      blockId,
      fieldId,
    );
  }

  moveLeadFormField(blockId: string, fieldId: string, direction: MoveDirection): boolean {
    return this.leadFormMutations.moveLeadFormField(
      this.executeBlockMutation,
      blockId,
      fieldId,
      direction,
    );
  }

  removeLeadFormField(blockId: string, fieldId: string): boolean {
    return this.leadFormMutations.removeLeadFormField(this.executeBlockMutation, blockId, fieldId);
  }
}
