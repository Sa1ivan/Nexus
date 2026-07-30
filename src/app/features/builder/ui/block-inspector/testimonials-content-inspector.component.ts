import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { TestimonialsBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputNumber, readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-testimonials-content-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule, MediaInputComponent],
  templateUrl: './testimonials-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<TestimonialsBlockConfig>();

  updateTestimonialsText(field: 'eyebrow' | 'title', event: Event): void {
    this.builderStore.updateTestimonialsBlock(this.block().id, { [field]: readInputValue(event) });
  }
  updateTestimonialText(id: string, field: 'quote' | 'author' | 'role', event: Event): void {
    this.builderStore.updateTestimonialItem(this.block().id, id, {
      [field]: readInputValue(event),
    });
  }
  updateTestimonialRating(id: string, event: Event): void {
    this.builderStore.updateTestimonialItem(this.block().id, id, {
      rating: readInputNumber(event),
    });
  }
  updateTestimonialAvatar(
    id: string,
    src: string,
    alt: string,
    field: 'src' | 'alt',
    value: string,
  ): void {
    this.builderStore.updateTestimonialItem(this.block().id, id, {
      avatar:
        value === '' && field === 'src'
          ? null
          : { src: field === 'src' ? value : src, alt: field === 'alt' ? value : alt },
    });
  }
  addTestimonial(): void {
    this.builderStore.addTestimonialItem(this.block().id);
  }
  duplicateTestimonial(id: string): void {
    this.builderStore.duplicateTestimonialItem(this.block().id, id);
  }
  moveTestimonial(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveTestimonialItem(this.block().id, id, direction);
  }
  removeTestimonial(id: string): void {
    this.builderStore.removeTestimonialItem(this.block().id, id);
  }
}
