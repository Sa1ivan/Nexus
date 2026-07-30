import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { OfferListBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-offer-list-content-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule, MediaInputComponent],
  templateUrl: './offer-list-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferListContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<OfferListBlockConfig>();

  updateOfferText(field: 'eyebrow' | 'title', event: Event): void {
    this.builderStore.updateOfferListBlock(this.block().id, { [field]: readInputValue(event) });
  }

  updateOfferItemText(
    itemId: string,
    field: 'title' | 'description' | 'meta' | 'price' | 'badge',
    event: Event,
  ): void {
    this.builderStore.updateOfferListItem(this.block().id, itemId, {
      [field]: readInputValue(event),
    });
  }

  updateOfferImage(itemId: string, field: 'src' | 'alt', value: string): void {
    this.builderStore.updateOfferListItem(this.block().id, itemId, {
      image: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateOfferCta(itemId: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateOfferListItem(this.block().id, itemId, {
      cta: { [field]: readInputValue(event) },
    });
  }

  addOfferItem(): void {
    this.builderStore.addOfferListItem(this.block().id);
  }
  duplicateOfferItem(id: string): void {
    this.builderStore.duplicateOfferListItem(this.block().id, id);
  }
  moveOfferItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveOfferListItem(this.block().id, id, direction);
  }
  removeOfferItem(id: string): void {
    this.builderStore.removeOfferListItem(this.block().id, id);
  }
}
