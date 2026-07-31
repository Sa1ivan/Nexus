import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { BuilderStore } from '../../stores/builder.store';
import { SettingsSelectComponent } from '../settings-select/settings-select.component';
import type { SettingsSelectOption } from '../settings-select/settings-select.types';

const CUSTOM_TARGET = '__custom_target__';

@Component({
  selector: 'app-page-link-editor',
  standalone: true,
  imports: [SettingsSelectComponent],
  templateUrl: './page-link-editor.component.html',
  styleUrl: './page-link-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLinkEditorComponent {
  private readonly builderStore = inject(BuilderStore);

  readonly label = input('Ссылка');
  readonly target = input.required<string>();
  readonly targetChange = output<string>();
  readonly pageOptions = computed<readonly SettingsSelectOption[]>(() => [
    { value: CUSTOM_TARGET, label: 'Якорь или внешний адрес' },
    ...this.builderStore.pages().map((page) => ({
      value: `/${page.slug}`,
      label: `Страница · ${page.title}`,
    })),
  ]);
  readonly selectedTarget = computed(() => {
    const target = this.target();

    return this.pageOptions().some((option) => option.value === target) ? target : CUSTOM_TARGET;
  });

  selectTarget(target: string): void {
    if (target !== CUSTOM_TARGET) {
      this.targetChange.emit(target);
    }
  }

  updateTarget(event: Event): void {
    if (event.currentTarget instanceof HTMLInputElement) {
      this.targetChange.emit(event.currentTarget.value);
    }
  }
}
