import { inject, Injectable } from '@angular/core';

import type {
  CallToActionBlockUpdate,
  ContentMediaBlockUpdate,
  HeroBlockUpdate,
} from '../domain/models';
import { BlockConfigMergeService } from './block-config-merge.service';
import type { BlockMutationExecutor } from './block-mutation.types';

@Injectable({ providedIn: 'root' })
export class HeroContentBlockMutationsService {
  private readonly merge = inject(BlockConfigMergeService);

  updateHeroBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: HeroBlockUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'hero') {
        return block;
      }

      return {
        ...block,
        title: update.title ?? block.title,
        subtitle: update.subtitle ?? block.subtitle,
        buttonText: update.buttonText ?? block.buttonText,
        buttonHref: update.buttonHref ?? block.buttonHref,
        media: this.merge.mergeOptionalMedia(block.media, update.media),
        primaryButtonAppearance: this.merge.mergeButtonAppearance(
          block.primaryButtonAppearance,
          update.primaryButtonAppearance,
        ),
        secondaryButton: this.merge.mergeOptionalLink(
          block.secondaryButton,
          update.secondaryButton,
        ),
        styles: this.merge.mergeHeroStyles(block.styles, update.styles),
      };
    });
  }

  updateContentMediaBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: ContentMediaBlockUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'contentMedia') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        eyebrow: update.eyebrow ?? block.eyebrow,
        title: update.title ?? block.title,
        body: update.body ?? block.body,
        cta: this.merge.mergeOptionalLink(block.cta, update.cta),
        media: this.merge.mergeOptionalMedia(block.media, update.media),
      };
    });
  }

  updateCallToActionBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: CallToActionBlockUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'callToAction') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        eyebrow: update.eyebrow ?? block.eyebrow,
        title: update.title ?? block.title,
        text: update.text ?? block.text,
        primaryAction: this.merge.mergeLink(block.primaryAction, update.primaryAction),
        secondaryAction: this.merge.mergeOptionalLink(
          block.secondaryAction,
          update.secondaryAction,
        ),
        media: this.merge.mergeOptionalMedia(block.media, update.media),
      };
    });
  }
}
