import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { FeatureGridBlockConfig, LinkConfig, LinkConfigUpdate } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-feature-grid-content-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule, MediaInputComponent],
  templateUrl: './feature-grid-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureGridContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<FeatureGridBlockConfig>();

  updateFeatureText(field: 'eyebrow' | 'title' | 'description', event: Event): void {
    this.builderStore.updateFeatureGridBlock(this.block().id, { [field]: readInputValue(event) });
  }

  updateFeatureItem(itemId: string, field: 'icon' | 'title' | 'description', event: Event): void {
    this.builderStore.updateFeatureGridItem(this.block().id, itemId, {
      [field]: readInputValue(event),
    });
  }

  updateFeatureLink(
    itemId: string,
    current: LinkConfig | undefined,
    field: 'label' | 'target',
    event: Event,
  ): void {
    this.builderStore.updateFeatureGridItem(this.block().id, itemId, {
      link: this.patchLink(current, { [field]: readInputValue(event) }),
    });
  }

  updateFeatureImage(
    itemId: string,
    currentSrc: string,
    currentAlt: string,
    field: 'src' | 'alt',
    value: string,
  ): void {
    this.builderStore.updateFeatureGridItem(this.block().id, itemId, {
      image:
        value === '' && field === 'src'
          ? null
          : {
              src: field === 'src' ? value : currentSrc,
              alt: field === 'alt' ? value : currentAlt,
            },
    });
  }

  addFeatureItem(): void {
    this.builderStore.addFeatureGridItem(this.block().id);
  }
  duplicateFeatureItem(id: string): void {
    this.builderStore.duplicateFeatureGridItem(this.block().id, id);
  }
  moveFeatureItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFeatureGridItem(this.block().id, id, direction);
  }
  removeFeatureItem(id: string): void {
    this.builderStore.removeFeatureGridItem(this.block().id, id);
  }
  private patchLink(link: LinkConfig | undefined, update: LinkConfigUpdate): LinkConfig {
    return {
      id: link?.id ?? `inspector-link-${Date.now()}`,
      label: update.label ?? link?.label ?? 'Подробнее',
      target: update.target ?? link?.target ?? '#lead-form',
      kind: link?.kind ?? 'anchor',
      openInNewTab: link?.openInNewTab ?? false,
    };
  }
}
