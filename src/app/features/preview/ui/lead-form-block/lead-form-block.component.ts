import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingRadiusValue,
  getLandingSectionPaddingY,
} from '../../../builder/domain/models';
import type { LeadFormBlockConfig, LeadFormFieldConfig } from '../../../builder/domain/models';

type LeadFormStatus = 'idle' | 'submitting' | 'success' | 'error' | 'unavailable';

export interface LeadFormSubmitEvent {
  readonly fields: Readonly<Record<string, string>>;
  readonly complete: (saved: boolean) => void;
}

@Component({
  selector: 'app-lead-form-block',
  standalone: true,
  templateUrl: './lead-form-block.component.html',
  styleUrl: './lead-form-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadFormBlockComponent {
  readonly block = input.required<LeadFormBlockConfig>();
  readonly submissionEnabled = input(false);
  readonly formSubmit = output<LeadFormSubmitEvent>();
  readonly status = signal<LeadFormStatus>('idle');

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly accentColor = computed<string>(() => getLandingAccentValue(this.design().accentColor));
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly sectionPaddingY = computed<string>(() =>
    getLandingSectionPaddingY(this.design().density),
  );
  readonly orderedFields = computed<readonly LeadFormFieldConfig[]>(() =>
    [...this.block().fields].sort((left, right) => left.order - right.order),
  );

  submit(event: Event): void {
    event.preventDefault();

    const form = event.currentTarget;

    if (!(form instanceof HTMLFormElement)) {
      this.status.set('error');
      return;
    }

    const fields = this.readFields(form, this.orderedFields());

    if (!form.checkValidity() || !this.hasRequiredValues(fields, this.orderedFields())) {
      form.reportValidity();
      this.status.set('error');
      return;
    }

    if (!this.submissionEnabled()) {
      this.status.set('unavailable');
      return;
    }

    this.status.set('submitting');
    let completed = false;
    const complete = (saved: boolean): void => {
      if (completed) {
        return;
      }

      completed = true;
      this.status.set(saved ? 'success' : 'error');

      if (saved) {
        form.reset();
      }
    };

    try {
      this.formSubmit.emit({ fields, complete });
    } catch {
      complete(false);
    }
  }

  resetStatus(): void {
    if (this.status() !== 'idle') {
      this.status.set('idle');
    }
  }

  fieldControlId(fieldId: string): string {
    return `${this.block().id}-${fieldId}`;
  }

  fieldHelpId(fieldId: string): string {
    return `${this.fieldControlId(fieldId)}-help`;
  }

  private readFields(
    form: HTMLFormElement,
    fields: readonly LeadFormFieldConfig[],
  ): Readonly<Record<string, string>> {
    const formData = new FormData(form);

    return fields.reduce<Record<string, string>>((result, field) => {
      const value = formData.get(field.id);

      return {
        ...result,
        [field.id]: typeof value === 'string' ? value.trim() : '',
      };
    }, {});
  }

  private hasRequiredValues(
    values: Readonly<Record<string, string>>,
    fields: readonly LeadFormFieldConfig[],
  ): boolean {
    return fields.every((field) => !field.required || Boolean(values[field.id]));
  }
}
