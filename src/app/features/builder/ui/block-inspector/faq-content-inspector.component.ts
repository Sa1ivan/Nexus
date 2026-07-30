import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { FaqBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputChecked, readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-faq-content-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule],
  templateUrl: './faq-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<FaqBlockConfig>();

  updateFaqText(field: 'eyebrow' | 'title' | 'description', event: Event): void {
    this.builderStore.updateFaqBlock(this.block().id, { [field]: readInputValue(event) });
  }
  updateFaqItem(id: string, field: 'question' | 'answer', event: Event): void {
    this.builderStore.updateFaqItem(this.block().id, id, { [field]: readInputValue(event) });
  }
  updateFaqInitiallyOpen(id: string, event: Event): void {
    this.builderStore.updateFaqItem(this.block().id, id, {
      initiallyOpen: readInputChecked(event),
    });
  }
  addFaqItem(): void {
    this.builderStore.addFaqItem(this.block().id);
  }
  duplicateFaqItem(id: string): void {
    this.builderStore.duplicateFaqItem(this.block().id, id);
  }
  moveFaqItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFaqItem(this.block().id, id, direction);
  }
  removeFaqItem(id: string): void {
    this.builderStore.removeFaqItem(this.block().id, id);
  }
}
