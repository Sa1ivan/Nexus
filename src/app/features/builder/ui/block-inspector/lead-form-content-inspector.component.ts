import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { LeadFormBlockConfig, LeadFormFieldType } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputChecked, readInputValue } from './block-inspector-input';

const LEAD_FORM_FIELD_TYPES: readonly LeadFormFieldType[] = ['text', 'email', 'tel', 'textarea'];

@Component({
  selector: 'app-lead-form-content-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule],
  templateUrl: './lead-form-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadFormContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<LeadFormBlockConfig>();

  updateLeadText(
    field: 'title' | 'description' | 'submitText' | 'successMessage',
    event: Event,
  ): void {
    this.builderStore.updateLeadFormBlock(this.block().id, { [field]: readInputValue(event) });
  }
  updateLeadField(id: string, field: 'label' | 'placeholder' | 'helpText', event: Event): void {
    this.builderStore.updateLeadFormField(this.block().id, id, { [field]: readInputValue(event) });
  }
  updateLeadFieldType(id: string, event: Event): void {
    const fieldType = LEAD_FORM_FIELD_TYPES.find((type) => type === readInputValue(event));

    if (fieldType !== undefined) {
      this.builderStore.updateLeadFormField(this.block().id, id, { type: fieldType });
    }
  }
  updateLeadRequired(id: string, event: Event): void {
    this.builderStore.updateLeadFormField(this.block().id, id, {
      required: readInputChecked(event),
    });
  }
  addLeadField(): void {
    this.builderStore.addLeadFormField(this.block().id);
  }
  duplicateLeadField(id: string): void {
    this.builderStore.duplicateLeadFormField(this.block().id, id);
  }
  moveLeadField(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveLeadFormField(this.block().id, id, direction);
  }
  removeLeadField(id: string): void {
    this.builderStore.removeLeadFormField(this.block().id, id);
  }
}
