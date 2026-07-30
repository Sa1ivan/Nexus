import { inject, Injectable } from '@angular/core';

import type { GalleryBlockUpdate, GalleryItemUpdate } from '../domain/models';
import { duplicateCollectionItem } from '../domain/utils/collection-update';
import type { MoveDirection } from '../stores/builder-store.types';
import { BlockConfigMergeService } from './block-config-merge.service';
import { IdentifiedCollectionService } from './identified-collection.service';
import { BuilderElementIdService } from './builder-element-id.service';
import type { BlockMutationExecutor } from './block-mutation.types';

@Injectable({ providedIn: 'root' })
export class GalleryBlockMutationsService {
  private readonly merge = inject(BlockConfigMergeService);
  private readonly collections = inject(IdentifiedCollectionService);
  private readonly ids = inject(BuilderElementIdService);

  updateGalleryBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: GalleryBlockUpdate,
  ): boolean {
    return execute(blockId, (block) =>
      block.type === 'gallery'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            description: update.description ?? block.description,
            items: update.items ?? block.items,
            lightboxEnabled: update.lightboxEnabled ?? block.lightboxEnabled,
          }
        : block,
    );
  }

  updateGalleryItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    update: GalleryItemUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'gallery') {
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
                image: update.image ?? item.image,
                caption: update.caption ?? item.caption,
              }
            : currentItem,
        ),
      };
    });
  }

  addGalleryItem(execute: BlockMutationExecutor, blockId: string): boolean {
    return execute(blockId, (block) =>
      block.type === 'gallery'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.ids.create('gallery'),
                image: {
                  src: 'images/landing/product-2.webp',
                  alt: 'Новый кадр галереи',
                  focalPoint: { x: 50, y: 50 },
                },
                caption: 'Новый кадр',
              },
            ],
          }
        : block,
    );
  }

  duplicateGalleryItem(execute: BlockMutationExecutor, blockId: string, itemId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'gallery') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.collections.findIndex(block.items, itemId),
        (item) => ({
          ...item,
          id: this.ids.create('gallery'),
          image: this.merge.cloneRequiredMedia(item.image),
        }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveGalleryItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    direction: MoveDirection,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'gallery') {
        return block;
      }

      const items = this.collections.move(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeGalleryItem(execute: BlockMutationExecutor, blockId: string, itemId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'gallery') {
        return block;
      }

      const items = this.collections.remove(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }
}
