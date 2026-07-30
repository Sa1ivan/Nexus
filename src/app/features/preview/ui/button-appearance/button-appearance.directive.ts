import { Directive, computed, input } from '@angular/core';

import type { ButtonAppearance } from '../../../builder/domain/models';

@Directive({
  selector: '[appButtonAppearance]',
  standalone: true,
  host: {
    '[class.landing-button--custom]': 'appearance() !== undefined',
    '[class.landing-button--ghost]': "appearance()?.variant === 'ghost'",
    '[class.landing-button--outline]': "appearance()?.variant === 'outline'",
    '[style.background]': 'background()',
    '[style.border]': 'border()',
    '[style.color]': 'textColor()',
  },
})
export class ButtonAppearanceDirective {
  readonly appearance = input<ButtonAppearance | undefined>(undefined, {
    alias: 'appButtonAppearance',
  });

  readonly background = computed<string | null>(() => {
    const appearance = this.appearance();

    return appearance === undefined
      ? null
      : appearance.variant === 'filled'
        ? appearance.backgroundColor
        : 'transparent';
  });

  readonly border = computed<string | null>(() => {
    const appearance = this.appearance();

    if (appearance === undefined) {
      return null;
    }

    const borderColor = appearance.variant === 'ghost' ? 'transparent' : appearance.borderColor;

    return `1px solid ${borderColor}`;
  });

  readonly textColor = computed<string | null>(() => this.appearance()?.textColor ?? null);
}
