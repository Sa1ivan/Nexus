import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import type { PageConfig, PageSeoConfig } from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';

@Component({
  selector: 'app-page-manager',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './page-manager.component.html',
  styleUrl: './page-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageManagerComponent {
  private readonly builderStore = inject(BuilderStore);

  readonly pages = this.builderStore.pages;
  readonly activePageId = this.builderStore.activePageId;
  readonly activePage = this.builderStore.activePage;
  readonly pageError = this.builderStore.pageError;
  readonly pendingDeletePageId = signal<string | null>(null);

  addPage(): void {
    this.builderStore.addPage('Новая страница');
  }

  selectPage(page: PageConfig): void {
    this.builderStore.selectPage(page.slug);
  }

  renamePage(pageId: string, event: Event): void {
    const input = this.readControl(event);

    if (!this.builderStore.renamePage(pageId, input.value) && this.pageError() !== null) {
      input.value = this.findPage(pageId)?.title ?? '';
    }
  }

  updatePageSlug(pageId: string, event: Event): void {
    const input = this.readControl(event);

    if (!this.builderStore.updatePageSlug(pageId, input.value) && this.pageError() !== null) {
      input.value = this.findPage(pageId)?.slug ?? '';
    }
  }

  restorePageIdentity(pageId: string, field: 'title' | 'slug', event: Event): void {
    const page = this.findPage(pageId);

    this.readControl(event).value = page?.[field] ?? '';
  }

  updatePageSeo(pageId: string, field: 'title' | 'description', event: Event): void {
    const input = this.readControl(event);
    const page = this.findPage(pageId);
    const value = input.value;
    const isValid =
      field === 'title'
        ? value.trim().length >= 1 && value.trim().length <= 70
        : value.length <= 180;
    const update: Partial<PageSeoConfig> = {
      [field]: value,
    };

    if (!isValid || !this.builderStore.updatePageSeo(pageId, update)) {
      input.value = page?.seo[field] ?? '';
    }
  }

  updatePageNoIndex(pageId: string, event: Event): void {
    if (!(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    this.builderStore.updatePageSeo(pageId, {
      noIndex: event.currentTarget.checked,
    });
  }

  duplicatePage(pageId: string): void {
    this.builderStore.duplicatePage(pageId);
  }

  movePage(pageId: string, direction: 'up' | 'down'): void {
    this.builderStore.movePage(pageId, direction);
  }

  canMovePage(pageId: string, direction: 'up' | 'down'): boolean {
    const pageIndex = this.pages().findIndex((page) => page.id === pageId);

    return (
      pageIndex >= 0 && (direction === 'up' ? pageIndex > 0 : pageIndex < this.pages().length - 1)
    );
  }

  requestDelete(pageId: string): void {
    if (this.pages().length > 1) {
      this.pendingDeletePageId.set(pageId);
    }
  }

  cancelDelete(): void {
    this.pendingDeletePageId.set(null);
  }

  confirmDelete(): void {
    const pageId = this.pendingDeletePageId();

    if (pageId === null) {
      return;
    }

    this.builderStore.removePage(pageId);
    this.pendingDeletePageId.set(null);
  }

  private findPage(pageId: string): PageConfig | undefined {
    return this.pages().find((page) => page.id === pageId);
  }

  private readControl(event: Event): HTMLInputElement | HTMLTextAreaElement {
    if (
      event.currentTarget instanceof HTMLInputElement ||
      event.currentTarget instanceof HTMLTextAreaElement
    ) {
      return event.currentTarget;
    }

    throw new TypeError('Page manager event target must be an input or textarea.');
  }
}
