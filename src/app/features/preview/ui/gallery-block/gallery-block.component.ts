import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import type { GalleryBlockConfig, MediaAsset } from '../../../builder/domain/models';
import { lockDocumentScroll } from '../../../../shared/utils/document-scroll-lock';

@Component({
  selector: 'app-gallery-block',
  standalone: true,
  templateUrl: './gallery-block.component.html',
  styleUrl: './gallery-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryBlockComponent {
  private readonly documentRef = inject(DOCUMENT);

  readonly block = input.required<GalleryBlockConfig>();
  readonly activeIndex = signal<number | null>(null);
  readonly activeItem = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : (this.block().items[index] ?? null);
  });
  readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private lastTrigger: HTMLButtonElement | null = null;

  constructor() {
    effect(() => {
      if (this.activeIndex() !== null) {
        const button = this.closeButton()?.nativeElement;
        if (button !== undefined) {
          queueMicrotask(() => button.focus());
        }
      }
    });

    effect((onCleanup) => {
      if (this.activeIndex() === null) {
        return;
      }

      onCleanup(lockDocumentScroll(this.documentRef));
    });
  }

  open(index: number, event: MouseEvent): void {
    if (!this.block().lightboxEnabled) return;
    this.lastTrigger =
      event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
    this.activeIndex.set(index);
  }

  close(): void {
    this.activeIndex.set(null);
    const trigger = this.lastTrigger;
    this.lastTrigger = null;
    queueMicrotask(() => trigger?.focus());
  }

  navigate(direction: -1 | 1): void {
    const index = this.activeIndex();
    const count = this.block().items.length;
    if (index === null || count < 2) return;
    this.activeIndex.set((index + direction + count) % count);
  }

  objectPosition(media: MediaAsset): string {
    return `${media.focalPoint?.x ?? 50}% ${media.focalPoint?.y ?? 50}%`;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (this.activeIndex() === null) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.keepFocusInsideDialog(event);
      return;
    }

    if (event.key === 'ArrowLeft') this.navigate(-1);
    if (event.key === 'ArrowRight') this.navigate(1);
  }

  private keepFocusInsideDialog(event: KeyboardEvent): void {
    const focusable = Array.from(
      this.dialog()?.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    if (first === undefined || last === undefined) {
      event.preventDefault();
      this.closeButton()?.nativeElement.focus();
      return;
    }

    if (event.shiftKey && this.documentRef.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.documentRef.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
