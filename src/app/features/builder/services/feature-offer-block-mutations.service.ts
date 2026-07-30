import { inject, Injectable } from '@angular/core';

import type {
  FeatureGridBlockUpdate,
  FeatureGridItemUpdate,
  OfferListBlockUpdate,
  OfferListItemUpdate,
} from '../domain/models';
import {
  duplicateCollectionItem,
  moveCollectionItem,
  removeCollectionItem,
} from '../domain/utils/collection-update';
import { createLink } from '../domain/registry/block-registry';
import type { MoveDirection } from '../stores/builder-store.types';
import { BlockConfigMergeService } from './block-config-merge.service';
import { IdentifiedCollectionService } from './identified-collection.service';
import { BuilderElementIdService } from './builder-element-id.service';
import type { BlockMutationExecutor } from './block-mutation.types';

@Injectable({ providedIn: 'root' })
export class FeatureOfferBlockMutationsService {
  private readonly merge = inject(BlockConfigMergeService);
  private readonly collections = inject(IdentifiedCollectionService);
  private readonly ids = inject(BuilderElementIdService);

  updateFeatureGridBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: FeatureGridBlockUpdate,
  ): boolean {
    return execute(blockId, (block) =>
      block.type === 'featureGrid'
        ? {
            ...block,
            variant: update.variant ?? block.variant,
            eyebrow: update.eyebrow ?? block.eyebrow,
            title: update.title ?? block.title,
            description: update.description ?? block.description,
            items: update.items ?? block.items,
          }
        : block,
    );
  }

  updateFeatureGridItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    update: FeatureGridItemUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const itemIndex = this.collections.findIndex(block.items, itemId);
      const item = block.items[itemIndex];

      if (item === undefined) {
        return block;
      }

      const nextItem = {
        ...item,
        icon: update.icon ?? item.icon,
        image: this.merge.mergeOptionalMedia(item.image, update.image),
        title: update.title ?? item.title,
        description: update.description ?? item.description,
        link: update.link ?? item.link,
      };

      return {
        ...block,
        items: block.items.map((currentItem, index) =>
          index === itemIndex ? nextItem : currentItem,
        ),
      };
    });
  }

  addFeatureGridItem(execute: BlockMutationExecutor, blockId: string): boolean {
    return execute(blockId, (block) =>
      block.type === 'featureGrid'
        ? {
            ...block,
            items: [
              ...block.items,
              {
                id: this.ids.create('feature'),
                icon: 'star',
                title: 'Новое преимущество',
                description: 'Опишите конкретную пользу для посетителя.',
                link: createLink('Подробнее', '#lead-form'),
              },
            ],
          }
        : block,
    );
  }

  duplicateFeatureGridItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const items = duplicateCollectionItem(
        block.items,
        this.collections.findIndex(block.items, itemId),
        (item) => ({
          ...item,
          id: this.ids.create('feature'),
          image: this.merge.cloneOptionalMedia(item.image),
          link:
            item.link === undefined
              ? undefined
              : this.merge.duplicateLink(item.link, this.ids.create('link')),
        }),
      );

      return items === block.items ? block : { ...block, items };
    });
  }

  moveFeatureGridItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemId: string,
    direction: MoveDirection,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const items = this.collections.move(block.items, itemId, direction);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeFeatureGridItem(execute: BlockMutationExecutor, blockId: string, itemId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'featureGrid') {
        return block;
      }

      const items = this.collections.remove(block.items, itemId);

      return items === block.items ? block : { ...block, items };
    });
  }

  updateOfferListBlock(
    execute: BlockMutationExecutor,
    blockId: string,
    update: OfferListBlockUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      return {
        ...block,
        variant: update.variant ?? block.variant,
        eyebrow: update.eyebrow ?? block.eyebrow,
        title: update.title ?? block.title,
        items: update.items ?? block.items,
      };
    });
  }

  updateOfferListItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemIdentity: number | string,
    update: OfferListItemUpdate,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const itemIndex = this.collections.findIndex(block.items, itemIdentity);

      if (itemIndex === -1) {
        return block;
      }

      return {
        ...block,
        items: block.items.map((item, index) =>
          index === itemIndex
            ? {
                ...item,
                title: update.title ?? item.title,
                description: update.description ?? item.description,
                meta: update.meta ?? item.meta,
                price: update.price ?? item.price,
                badge: update.badge ?? item.badge,
                image: this.merge.mergeOptionalMedia(item.image, update.image),
                cta: this.merge.mergeOptionalLink(item.cta, update.cta),
              }
            : item,
        ),
      };
    });
  }

  addOfferListItem(execute: BlockMutationExecutor, blockId: string): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      return {
        ...block,
        items: [
          ...block.items,
          {
            id: this.ids.create('offer'),
            title: 'Новый пункт',
            description: 'Опишите преимущество, услугу или пакет.',
            meta: 'Новое',
            price: 'от 0 ₽',
            badge: 'Новое',
            image: {
              src: 'images/landing/product-1.webp',
              alt: 'Новый пункт предложения',
            },
            cta: createLink('Подробнее', '#lead-form'),
          },
        ],
      };
    });
  }

  duplicateOfferListItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemIdentity: number | string,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const itemIndex = this.collections.findIndex(block.items, itemIdentity);
      const items = duplicateCollectionItem(block.items, itemIndex, (item) => ({
        ...item,
        id: this.ids.create('offer'),
        image:
          item.image === undefined
            ? undefined
            : {
                ...item.image,
                focalPoint:
                  item.image.focalPoint === undefined ? undefined : { ...item.image.focalPoint },
              },
        cta:
          item.cta === undefined
            ? undefined
            : this.merge.duplicateLink(item.cta, this.ids.create('link')),
      }));

      return items === block.items ? block : { ...block, items };
    });
  }

  moveOfferListItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemIdentity: number | string,
    direction: MoveDirection,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const currentIndex = this.collections.findIndex(block.items, itemIdentity);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const items = moveCollectionItem(block.items, currentIndex, nextIndex);

      return items === block.items ? block : { ...block, items };
    });
  }

  removeOfferListItem(
    execute: BlockMutationExecutor,
    blockId: string,
    itemIdentity: number | string,
  ): boolean {
    return execute(blockId, (block) => {
      if (block.type !== 'offerList') {
        return block;
      }

      const itemIndex = this.collections.findIndex(block.items, itemIdentity);
      const items = removeCollectionItem(block.items, itemIndex, 1);

      return items === block.items ? block : { ...block, items };
    });
  }
}
