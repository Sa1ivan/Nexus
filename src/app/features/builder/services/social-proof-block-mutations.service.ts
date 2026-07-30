import { inject, Injectable } from '@angular/core';

import type {
  FaqBlockUpdate,
  FaqItemUpdate,
  TestimonialItemUpdate,
  TestimonialsBlockUpdate,
} from '../domain/models';
import { duplicateCollectionItem } from '../domain/utils/collection-update';
import type { MoveDirection } from '../stores/builder-store.types';
import { BlockConfigMergeService } from './block-config-merge.service';
import { IdentifiedCollectionService } from './identified-collection.service';
import { BuilderElementIdService } from './builder-element-id.service';
import type { BlockMutationExecutor } from './block-mutation.types';

@Injectable({ providedIn: 'root' })
export class SocialProofBlockMutationsService {
  private readonly merge = inject(BlockConfigMergeService);
  private readonly collections = inject(IdentifiedCollectionService);
  private readonly ids = inject(BuilderElementIdService);

  updateTestimonialsBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: TestimonialsBlockUpdate,
  ): boolean {
    return execute(blockId, (block) =>
      block.type === 'testimonials'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            items: update.items ?? block.items,
          }
        : block,
    );
  }

  updateTestimonialItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    update: TestimonialItemUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const itemIndex = this.collections.findIndex(block.items, itemId);
      const item = block.items[itemIndex];

      if (item === undefined) {
        return block;
      }

      return {
        ...block,
        items: block.items.map((currentItem, index) =>
          index === itemIndex
            ? {
                ...item,
                quote: update.quote ?? item.quote,
                author: update.author ?? item.author,
                role: update.role ?? item.role,
                avatar: this.merge.mergeOptionalMedia(item.avatar, update.avatar),
                rating:
                  update.rating === undefined
                    ? item.rating
                    : Math.round(Math.min(5, Math.max(1, update.rating))),
              }
            : currentItem,
        ),
      };
    });
  }

  addTestimonialItem(execute: BlockMutationExecutor, blockId: string): boolean {
    return execute(blockId, (block) =>
      block.type === 'testimonials'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.ids.create('testimonial'),
                quote: 'Добавьте конкретный результат или впечатление клиента.',
                author: 'Имя клиента',
                role: 'Роль или компания',
                rating: 5,
              },
            ],
          }
        : block,
    );
  }

  duplicateTestimonialItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.collections.findIndex(block.items, itemId),
        (item) => ({
          ...item,
          id: this.ids.create('testimonial'),
          avatar: this.merge.cloneOptionalMedia(item.avatar),
        }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveTestimonialItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    direction: MoveDirection,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const items = this.collections.move(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeTestimonialItem(execute: BlockMutationExecutor, blockId: string, itemId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'testimonials') {
        return block;
      }

      const items = this.collections.remove(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }

  updateFaqBlock(execute: BlockMutationExecutor, blockId: string, update: FaqBlockUpdate): boolean {
    return execute(blockId, (block) =>
      block.type === 'faq'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            description: update.description ?? block.description,
            items: update.items ?? block.items,
            allowMultipleOpen: update.allowMultipleOpen ?? block.allowMultipleOpen,
          }
        : block,
    );
  }

  updateFaqItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    update: FaqItemUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const itemIndex = this.collections.findIndex(block.items, itemId);
      const item = block.items[itemIndex];

      if (item === undefined) {
        return block;
      }

      return {
        ...block,
        items: block.items.map((currentItem, index) =>
          index === itemIndex
            ? {
                ...item,
                question: update.question ?? item.question,
                answer: update.answer ?? item.answer,
                initiallyOpen: update.initiallyOpen ?? item.initiallyOpen,
              }
            : currentItem,
        ),
      };
    });
  }

  addFaqItem(execute: BlockMutationExecutor, blockId: string): boolean {
    return execute(blockId, (block) =>
      block.type === 'faq'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.ids.create('faq'),
                question: 'Новый вопрос',
                answer: 'Добавьте понятный и полезный ответ.',
                initiallyOpen: false,
              },
            ],
          }
        : block,
    );
  }

  duplicateFaqItem(execute: BlockMutationExecutor, blockId: string, itemId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.collections.findIndex(block.items, itemId),
        (item) => ({ ...item, id: this.ids.create('faq'), initiallyOpen: false }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveFaqItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    direction: MoveDirection,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const items = this.collections.move(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeFaqItem(execute: BlockMutationExecutor, blockId: string, itemId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'faq') {
        return block;
      }

      const items = this.collections.remove(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }
}
