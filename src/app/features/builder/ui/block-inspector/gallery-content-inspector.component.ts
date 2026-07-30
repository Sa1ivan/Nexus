import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { GalleryBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-gallery-content-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule, MediaInputComponent],
  templateUrl: './gallery-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<GalleryBlockConfig>();

  updateGalleryText(field: 'eyebrow' | 'title' | 'description', event: Event): void {
    this.builderStore.updateGalleryBlock(this.block().id, { [field]: readInputValue(event) });
  }

  updateGalleryCaption(id: string, event: Event): void {
    this.builderStore.updateGalleryItem(this.block().id, id, { caption: readInputValue(event) });
  }
  updateGalleryImage(
    id: string,
    src: string,
    alt: string,
    field: 'src' | 'alt',
    value: string,
  ): void {
    this.builderStore.updateGalleryItem(this.block().id, id, {
      image: { src: field === 'src' ? value : src, alt: field === 'alt' ? value : alt },
    });
  }
  addGalleryItem(): void {
    this.builderStore.addGalleryItem(this.block().id);
  }
  duplicateGalleryItem(id: string): void {
    this.builderStore.duplicateGalleryItem(this.block().id, id);
  }
  moveGalleryItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveGalleryItem(this.block().id, id, direction);
  }
  removeGalleryItem(id: string): void {
    this.builderStore.removeGalleryItem(this.block().id, id);
  }
}
