import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { ButtonAppearance, ButtonAppearanceUpdate } from '../../domain/models';
import { SettingsSelectComponent } from '../settings-select/settings-select.component';
import type { ButtonColorField, ButtonVariantOption } from './button-appearance-editor.types';

const BUTTON_VARIANTS: readonly ButtonVariantOption[] = [
  { value: 'filled', label: 'Обычная' },
  { value: 'outline', label: 'Контурная' },
  { value: 'ghost', label: 'Прозрачная' },
];

@Component({
  selector: 'app-button-appearance-editor',
  standalone: true,
  imports: [SettingsSelectComponent],
  templateUrl: './button-appearance-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAppearanceEditorComponent {
  readonly label = input.required<string>();
  readonly appearance = input.required<ButtonAppearance>();
  readonly appearanceChange = output<ButtonAppearanceUpdate>();
  readonly variants = BUTTON_VARIANTS;

  updateVariant(value: string): void {
    const variant = this.variants.find((option) => option.value === value)?.value;

    if (variant !== undefined) {
      this.emitUpdate({ variant });
    }
  }

  updateColor(field: ButtonColorField, event: Event): void {
    this.emitUpdate({ [field]: this.readValue(event) });
  }

  private emitUpdate(update: ButtonAppearanceUpdate): void {
    this.appearanceChange.emit(update);
  }

  private readValue(event: Event): string {
    const target = event.target;

    return target instanceof HTMLInputElement ? target.value : '';
  }
}
