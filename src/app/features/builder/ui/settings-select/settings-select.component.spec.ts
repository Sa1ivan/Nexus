import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SettingsSelectComponent } from './settings-select.component';
import type { SettingsSelectOption } from './settings-select.types';

const OPTIONS: readonly SettingsSelectOption[] = [
  { value: 'filled', label: 'Обычная' },
  { value: 'outline', label: 'Контурная' },
];

describe('SettingsSelectComponent', () => {
  it('renders the current input value after its host is recreated', () => {
    const fixture = TestBed.createComponent(SettingsSelectComponent);
    fixture.componentRef.setInput('ariaLabel', 'Главная кнопка: тип');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', 'outline');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector<HTMLButtonElement>('.settings-select__trigger');

    expect(trigger?.textContent).toContain('Контурная');
    expect(trigger?.getAttribute('aria-label')).toBe('Главная кнопка: тип');
    expect(trigger?.getAttribute('aria-description')).toBe('Выбрано: Контурная');
  });

  it('reacts to an external value change without keeping a stale local selection', () => {
    const fixture = TestBed.createComponent(SettingsSelectComponent);
    fixture.componentRef.setInput('ariaLabel', 'Главная кнопка: тип');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', 'filled');
    fixture.detectChanges();

    fixture.componentRef.setInput('value', 'outline');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector<HTMLButtonElement>('.settings-select__trigger');
    expect(trigger?.textContent).toContain('Контурная');
    expect(trigger?.getAttribute('aria-description')).toBe('Выбрано: Контурная');
  });
});
