import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { ButtonAppearance, ButtonAppearanceUpdate } from '../../domain/models';
import { ButtonAppearanceEditorComponent } from './button-appearance-editor.component';

const APPEARANCE: ButtonAppearance = {
  variant: 'filled',
  backgroundColor: '#2563eb',
  textColor: '#ffffff',
  borderColor: '#2563eb',
};

describe('ButtonAppearanceEditorComponent', () => {
  it('emits independent patches for sequential controls before the input is refreshed', () => {
    const fixture = TestBed.createComponent(ButtonAppearanceEditorComponent);
    fixture.componentRef.setInput('label', 'Главная кнопка');
    fixture.componentRef.setInput('appearance', APPEARANCE);
    const updates: ButtonAppearanceUpdate[] = [];
    fixture.componentInstance.appearanceChange.subscribe((update) => updates.push(update));
    const colorInput = document.createElement('input');
    colorInput.value = '#123456';

    fixture.componentInstance.updateVariant('outline');
    fixture.componentInstance.updateColor('textColor', { target: colorInput } as unknown as Event);

    expect(updates).toEqual([{ variant: 'outline' }, { textColor: '#123456' }]);
  });
});
