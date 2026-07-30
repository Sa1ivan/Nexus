import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { ButtonAppearance } from '../../domain/models';
import type { ButtonColorField, ButtonVariantOption } from './button-appearance-editor.types';

const BUTTON_VARIANTS: readonly ButtonVariantOption[] = [
  { value: 'filled', label: 'Обычная' },
  { value: 'outline', label: 'Контурная' },
  { value: 'ghost', label: 'Прозрачная' },
];

@Component({
  selector: 'app-button-appearance-editor',
  standalone: true,
  templateUrl: './button-appearance-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAppearanceEditorComponent {
  readonly label = input.required<string>();
  readonly appearance = input.required<ButtonAppearance>();
  readonly appearanceChange = output<ButtonAppearance>();
  readonly variants = BUTTON_VARIANTS;

  updateVariant(event: Event): void {
    const value = this.readValue(event);
    const variant = this.variants.find((option) => option.value === value)?.value;

    if (variant !== undefined) {
      this.emitUpdate({ variant });
    }
  }

  updateColor(field: ButtonColorField, event: Event): void {
    this.emitUpdate({ [field]: this.readValue(event) });
  }

  private emitUpdate(update: Partial<ButtonAppearance>): void {
    this.appearanceChange.emit({
      ...this.appearance(),
      ...update,
    });
  }

  private readValue(event: Event): string {
    const target = event.target;

    return target instanceof HTMLInputElement || target instanceof HTMLSelectElement
      ? target.value
      : '';
  }
}
