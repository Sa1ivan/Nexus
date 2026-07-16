export function moveCollectionItem<TItem>(
  items: readonly TItem[],
  previousIndex: number,
  currentIndex: number,
): readonly TItem[] {
  if (
    !isValidIndex(items, previousIndex) ||
    !isValidIndex(items, currentIndex) ||
    previousIndex === currentIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(previousIndex, 1);

  if (movedItem === undefined) {
    return items;
  }

  nextItems.splice(currentIndex, 0, movedItem);

  return nextItems;
}

export function duplicateCollectionItem<TItem>(
  items: readonly TItem[],
  index: number,
  createDuplicate: (item: TItem) => TItem,
): readonly TItem[] {
  if (!isValidIndex(items, index)) {
    return items;
  }

  const item = items[index];

  if (item === undefined) {
    return items;
  }

  return [...items.slice(0, index + 1), createDuplicate(item), ...items.slice(index + 1)];
}

export function removeCollectionItem<TItem>(
  items: readonly TItem[],
  index: number,
  minimumItems = 0,
): readonly TItem[] {
  if (!isValidIndex(items, index) || items.length <= Math.max(0, minimumItems)) {
    return items;
  }

  return [...items.slice(0, index), ...items.slice(index + 1)];
}

function isValidIndex<TItem>(items: readonly TItem[], index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < items.length;
}
