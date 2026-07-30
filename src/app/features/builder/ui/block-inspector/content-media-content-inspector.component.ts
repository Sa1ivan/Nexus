import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import type { ContentMediaBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-content-media-content-inspector',
  standalone: true,
  imports: [MediaInputComponent],
  templateUrl: './content-media-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentMediaContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<ContentMediaBlockConfig>();

  updateContentMediaText(field: 'eyebrow' | 'title' | 'body', event: Event): void {
    this.builderStore.updateContentMediaBlock(this.block().id, { [field]: readInputValue(event) });
  }

  updateContentMediaCta(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateContentMediaBlock(this.block().id, {
      cta: { [field]: readInputValue(event) },
    });
  }

  updateContentMediaAsset(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateContentMediaBlock(this.block().id, {
      media: value === '' && field === 'src' ? null : { [field]: value },
    });
  }
}
