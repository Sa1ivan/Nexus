import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import type { CallToActionBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-call-to-action-content-inspector',
  standalone: true,
  imports: [MediaInputComponent],
  templateUrl: './call-to-action-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallToActionContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<CallToActionBlockConfig>();

  updateCtaText(field: 'eyebrow' | 'title' | 'text', event: Event): void {
    this.builderStore.updateCallToActionBlock(this.block().id, { [field]: readInputValue(event) });
  }
  updateCtaLink(
    kind: 'primaryAction' | 'secondaryAction',
    field: 'label' | 'target',
    event: Event,
  ): void {
    this.builderStore.updateCallToActionBlock(this.block().id, {
      [kind]: { [field]: readInputValue(event) },
    });
  }
  updateCtaMedia(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateCallToActionBlock(this.block().id, {
      media: value === '' && field === 'src' ? null : { [field]: value },
    });
  }
}
