import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

import type { FaqBlockConfig } from '../../../builder/domain/models';

@Component({
  selector: 'app-faq-block',
  standalone: true,
  templateUrl: './faq-block.component.html',
  styleUrl: './faq-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqBlockComponent {
  readonly block = input.required<FaqBlockConfig>();
  readonly openItemIds = linkedSignal<ReadonlySet<string>>(
    () =>
      new Set(
        this.block()
          .items.filter((item) => item.initiallyOpen)
          .map((item) => item.id),
      ),
  );

  isOpen(itemId: string): boolean {
    return this.openItemIds().has(itemId);
  }

  toggle(itemId: string): void {
    const current = this.openItemIds();
    const next = this.block().allowMultipleOpen ? new Set(current) : new Set<string>();

    if (current.has(itemId)) next.delete(itemId);
    else next.add(itemId);

    this.openItemIds.set(next);
  }

  triggerId(itemId: string): string {
    return `faq-trigger-${this.block().id}-${itemId}`;
  }

  panelId(itemId: string): string {
    return `faq-panel-${this.block().id}-${itemId}`;
  }
}
