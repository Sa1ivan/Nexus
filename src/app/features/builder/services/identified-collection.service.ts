import { Injectable } from '@angular/core';

import { moveCollectionItem, removeCollectionItem } from '../domain/utils/collection-update';
import type { MoveDirection } from '../stores/builder-store.types';

@Injectable({
  providedIn: 'root',
})
export class IdentifiedCollectionService {
  findIndex<TItem extends { readonly id: string }>(
    items: readonly TItem[],
    identity: number | string,
  ): number {
    return typeof identity === 'number'
      ? Number.isInteger(identity) && identity >= 0 && identity < items.length
        ? identity
        : -1
      : items.findIndex((item) => item.id === identity);
  }

  move<TItem extends { readonly id: string }>(
    items: readonly TItem[],
    itemId: string,
    direction: MoveDirection,
  ): readonly TItem[] {
    const currentIndex = this.findIndex(items, itemId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    return moveCollectionItem(items, currentIndex, nextIndex);
  }

  remove<TItem extends { readonly id: string }>(
    items: readonly TItem[],
    itemId: string,
  ): readonly TItem[] {
    return removeCollectionItem(items, this.findIndex(items, itemId), 1);
  }
}
