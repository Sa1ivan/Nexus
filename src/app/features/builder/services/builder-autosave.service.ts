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
  private failedRevision: number | null = null;
  private failedProjectId: string | null = null;

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

  async flushPending(): Promise<boolean> {
    this.clearResolvedFailure();

    if (
      this.projectStore.currentProject() === null &&
      this.lastQueuedRevision === null &&
      this.builderStore.documentRevision() === 0
    ) {
      return this.failedRevision === null;
    }

    while (true) {
      await this.projectStore.waitForActiveWrite();
      const revision = this.builderStore.documentRevision();

      await this.flush();
      await this.saveQueue;
      await this.projectStore.waitForActiveWrite();
      this.clearResolvedFailure();

      if (
        this.builderStore.documentRevision() !== revision ||
        this.projectStore.saveStatus() === 'dirty'
      ) {
        continue;
      }

      return this.failedRevision !== revision;
    }
  }

  flush(): Promise<void> {
    const revision = this.builderStore.documentRevision();

    if (this.lastQueuedRevision !== null && revision <= this.lastQueuedRevision) {
      return this.saveQueue;
    }

    if (
      this.projectStore.currentProject() !== null &&
      this.projectStore.saveStatus() !== 'dirty' &&
      this.projectStore.saveStatus() !== 'error'
    ) {
      return this.saveQueue;
    }

    return this.queueSave(revision, this.builderStore.siteConfig());
  }

  private queueSave(revision: number, snapshot: SiteConfig): Promise<void> {
    if (this.lastQueuedRevision !== null && revision <= this.lastQueuedRevision) {
      return this.saveQueue;
    }

    const projectId = this.projectStore.currentProject()?.id ?? null;
    this.lastQueuedRevision = revision;
    this.saveQueue = this.saveQueue
      .catch(() => undefined)
      .then(async () => {
        const savedProject = await this.projectStore.saveForProject(snapshot, projectId);
        const isCurrentProject = (this.projectStore.currentProject()?.id ?? null) === projectId;

        if (
          savedProject === null &&
          !this.projectStore.hasVersionConflict() &&
          this.lastQueuedRevision === revision
        ) {
          this.lastQueuedRevision = null;
        }

        if (savedProject !== null) {
          this.failedRevision = null;
          this.failedProjectId = null;
        } else if (isCurrentProject) {
          this.failedRevision = revision;
          this.failedProjectId = projectId;
        }

        if (isCurrentProject && this.builderStore.documentRevision() !== revision) {
          this.projectStore.markDirty();
        }
      });

    return this.saveQueue;
  }

  private clearResolvedFailure(): void {
    if (this.failedRevision === null) {
      return;
    }

    const currentProjectId = this.projectStore.currentProject()?.id ?? null;
    const competingWritePersistedRevision =
      this.builderStore.documentRevision() === this.failedRevision &&
      this.projectStore.saveStatus() === 'saved';

    if (currentProjectId !== this.failedProjectId || competingWritePersistedRevision) {
      this.failedRevision = null;
      this.failedProjectId = null;
    }
  }
}
