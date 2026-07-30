import type { SiteConfig } from '../domain/models';

export interface BuilderHistorySnapshot {
  readonly undo: readonly SiteConfig[];
  readonly redo: readonly SiteConfig[];
}
