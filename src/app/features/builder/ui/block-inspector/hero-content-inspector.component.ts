import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import type { HeroBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-hero-content-inspector',
  standalone: true,
  imports: [MediaInputComponent],
  templateUrl: './hero-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<HeroBlockConfig>();

  updateHeroText(field: 'title' | 'subtitle' | 'buttonText' | 'buttonHref', event: Event): void {
    this.builderStore.updateHeroBlock(this.block().id, { [field]: readInputValue(event) });
  }

  updateHeroMedia(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateHeroBlock(this.block().id, {
      media: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateHeroSecondary(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateHeroBlock(this.block().id, {
      secondaryButton: { [field]: readInputValue(event) },
    });
  }
}
