import type { PageConfig } from '../models';

export type PageMutationResult =
  | {
      readonly ok: true;
      readonly pages: readonly PageConfig[];
      readonly activePageId: string;
    }
  | {
      readonly ok: false;
      readonly reason:
        | 'not-found'
        | 'last-page'
        | 'empty-title'
        | 'empty-slug'
        | 'reserved-slug'
        | 'duplicate-slug'
        | 'boundary';
    };
