import { Injectable } from '@angular/core';

import type { PageBlockConfig, SiteChromeConfig } from '../domain/models';
import { moveCollectionItem } from '../domain/utils/collection-update';

@Injectable({ providedIn: 'root' })
export class PageBlockDocumentService {
  reorder(
    blocks: readonly PageBlockConfig[],
    previousCanvasIndex: number,
    currentCanvasIndex: number,
  ): readonly PageBlockConfig[] {
    const firstContentIndex = 1;
    const lastContentIndex = blocks.length;

    if (
      previousCanvasIndex < firstContentIndex ||
      previousCanvasIndex > lastContentIndex ||
      currentCanvasIndex < firstContentIndex ||
      currentCanvasIndex > lastContentIndex
    ) {
      return blocks;
    }

    return moveCollectionItem(
      blocks,
      previousCanvasIndex - firstContentIndex,
      currentCanvasIndex - firstContentIndex,
    );
  }

  getInsertIndex(
    blocks: readonly PageBlockConfig[],
    afterBlockId: string | null,
    chrome: SiteChromeConfig,
  ): number {
    if (afterBlockId === chrome.header.id) {
      return 0;
    }

    if (afterBlockId === null || afterBlockId === chrome.footer.id) {
      return blocks.length;
    }

    const blockIndex = blocks.findIndex((block) => block.id === afterBlockId);

    return blockIndex === -1 ? blocks.length : blockIndex + 1;
  }
}
