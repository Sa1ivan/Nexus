import { CdkMenu, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { SettingsSelectOption } from './settings-select.types';

@Component({
  selector: 'app-settings-select',
  standalone: true,
  imports: [CdkMenu, CdkMenuItemRadio, CdkMenuTrigger, MatIconModule],
  templateUrl: './settings-select.component.html',
  styleUrl: './settings-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSelectComponent {
  readonly ariaLabel = input.required<string>();
  readonly options = input.required<readonly SettingsSelectOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  readonly isOpen = signal(false);
  readonly menuWidth = signal(220);
  readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );
  readonly selectedLabel = computed(() => this.selectedOption()?.label ?? this.value());

  syncMenuWidth(event: Event): void {
    const trigger = event.currentTarget;

    if (trigger instanceof HTMLElement) {
      this.menuWidth.set(trigger.getBoundingClientRect().width);
    }
  }

  select(value: string): void {
    if (value !== this.value()) {
      this.valueChange.emit(value);
    }
  }
}
