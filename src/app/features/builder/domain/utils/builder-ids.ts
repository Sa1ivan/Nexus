import type { BlockAnchor, BlockId, BlockType, PageId } from '../models';

let fallbackIdCounter = 0;

export function createProjectId(): string {
  return createStableId('project');
}

export function createPageId(slug: string): PageId {
  return createStableId(`page-${slug}`);
}

export function createBlockId(type: BlockType): BlockId {
  return createStableId(type);
}

export function createBlockAnchor(
  type: BlockType,
  existingAnchors: readonly string[],
): BlockAnchor {
  const baseAnchor = toAnchor(type);
  const usedAnchors = new Set(existingAnchors);
  let anchor = baseAnchor;
  let index = 2;

  while (usedAnchors.has(anchor)) {
    anchor = `${baseAnchor}-${index}`;
    index += 1;
  }

  return anchor;
}

export function normalizeAnchor(value: string): BlockAnchor {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/giu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'section';
}

function createStableId(prefix: string): string {
  if (globalThis.crypto?.randomUUID !== undefined) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  fallbackIdCounter += 1;

  return `${prefix}-${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}`;
}

function toAnchor(type: BlockType): string {
  switch (type) {
    case 'siteHeader':
      return 'header';
    case 'hero':
      return 'hero';
    case 'offerList':
      return 'offers';
    case 'siteFooter':
      return 'contact';
    case 'leadForm':
      return 'lead-form';
  }
}
