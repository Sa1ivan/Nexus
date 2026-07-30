import { computed, Injectable, signal } from '@angular/core';

import type { SiteConfig } from '../domain/models';
import type { BuilderHistorySnapshot } from './builder-history-store.types';

const HISTORY_LIMIT = 50;

@Injectable({
  providedIn: 'root',
})
export class BuilderHistoryStore {
  private readonly undoHistory = signal<readonly SiteConfig[]>([]);
  private readonly redoHistory = signal<readonly SiteConfig[]>([]);

  readonly canUndo = computed(() => this.undoHistory().length > 0);
  readonly canRedo = computed(() => this.redoHistory().length > 0);
  readonly undoDepth = computed(() => this.undoHistory().length);

  record(snapshot: SiteConfig): void {
    this.undoHistory.update((history) => this.append(history, snapshot));
    this.redoHistory.set([]);
  }

  undo(current: SiteConfig): SiteConfig | null {
    const history = this.undoHistory();
    const previous = history.at(-1);

    if (previous === undefined) {
      return null;
    }

    this.undoHistory.set(history.slice(0, -1));
    this.redoHistory.update((redoHistory) => this.append(redoHistory, current));

    return previous;
  }

  redo(current: SiteConfig): SiteConfig | null {
    const history = this.redoHistory();
    const next = history.at(-1);

    if (next === undefined) {
      return null;
    }

    this.redoHistory.set(history.slice(0, -1));
    this.undoHistory.update((undoHistory) => this.append(undoHistory, current));

    return next;
  }

  reset(): void {
    this.undoHistory.set([]);
    this.redoHistory.set([]);
  }

  snapshot(): BuilderHistorySnapshot {
    return {
      undo: this.undoHistory(),
      redo: this.redoHistory(),
    };
  }

  restore(snapshot: BuilderHistorySnapshot): void {
    this.undoHistory.set(snapshot.undo);
    this.redoHistory.set(snapshot.redo);
  }

  private append(history: readonly SiteConfig[], snapshot: SiteConfig): readonly SiteConfig[] {
    return [...history.slice(-(HISTORY_LIMIT - 1)), snapshot];
  }
}
