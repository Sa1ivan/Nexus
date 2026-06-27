import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingRadiusValue,
  getLandingSectionPaddingY,
} from '../../../builder/domain/models';
import type { LeadFormBlockConfig, LeadFormFieldConfig } from '../../../builder/domain/models';

type LeadFormStatus = 'idle' | 'success' | 'error';

@Component({
  selector: 'app-lead-form-block',
  standalone: true,
  templateUrl: './lead-form-block.component.html',
  styleUrl: './lead-form-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadFormBlockComponent {
  readonly block = input.required<LeadFormBlockConfig>();
  readonly formSubmit = output<Readonly<Record<string, string>>>();
  readonly status = signal<LeadFormStatus>('idle');

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly accentColor = computed<string>(() => getLandingAccentValue(this.design().accentColor));
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly sectionPaddingY = computed<string>(() =>
    getLandingSectionPaddingY(this.design().density),
  );

  submit(event: Event): void {
    event.preventDefault();

    const form = event.target;

    if (!(form instanceof HTMLFormElement) || !form.checkValidity()) {
      this.status.set('error');
      return;
    }

    const fields = this.readFields(form, this.block().fields);

    this.formSubmit.emit(fields);
    this.status.set('success');
    form.reset();
  }

  private readFields(
    form: HTMLFormElement,
    fields: readonly LeadFormFieldConfig[],
  ): Readonly<Record<string, string>> {
    return fields.reduce<Record<string, string>>((result, field) => {
      const value = new FormData(form).get(field.id);

      return {
        ...result,
        [field.id]: typeof value === 'string' ? value.trim() : '',
      };
    }, {});
  }
}
