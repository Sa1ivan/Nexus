import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, skip, type Subscription } from 'rxjs';

import type { SiteConfig } from '../domain/models';
import { BuilderProjectStore } from '../stores/builder-project.store';
import { BuilderStore } from '../stores/builder.store';

const AUTOSAVE_DELAY_MS = 800;

@Injectable({
  providedIn: 'root',
})
export class BuilderAutosaveService {
  private readonly builderStore = inject(BuilderStore);
  private readonly projectStore = inject(BuilderProjectStore);
  private readonly documentRevisionChanges = toObservable(this.builderStore.documentRevision);
  private subscription: Subscription | null = null;
  private saveQueue: Promise<void> = Promise.resolve();
  private lastQueuedRevision: number | null = null;

  start(): void {
    if (this.subscription !== null) {
      return;
    }

    this.subscription = this.documentRevisionChanges
      .pipe(skip(1), debounceTime(AUTOSAVE_DELAY_MS))
      .subscribe((revision) => {
        void this.queueSave(revision, this.builderStore.siteConfig());
      });
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  flush(): Promise<void> {
    const revision = this.builderStore.documentRevision();

    if (this.lastQueuedRevision !== null && revision <= this.lastQueuedRevision) {
      return this.saveQueue;
    }

    if (this.projectStore.currentProject() !== null && this.projectStore.saveStatus() !== 'dirty') {
      return this.saveQueue;
    }

    return this.queueSave(revision, this.builderStore.siteConfig());
  }

  private queueSave(revision: number, snapshot: SiteConfig): Promise<void> {
    if (this.lastQueuedRevision !== null && revision <= this.lastQueuedRevision) {
      return this.saveQueue;
    }

    this.lastQueuedRevision = revision;
    this.saveQueue = this.saveQueue
      .catch(() => undefined)
      .then(async () => {
        await this.projectStore.save(snapshot);

        if (this.builderStore.documentRevision() !== revision) {
          this.projectStore.markDirty();
        }
      });

    return this.saveQueue;
  }
}
