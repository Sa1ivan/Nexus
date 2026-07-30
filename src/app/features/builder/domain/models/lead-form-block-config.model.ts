import type { BlockConfig } from './block-config.model';
import type { ButtonAppearance, ButtonAppearanceUpdate } from './button-appearance.model';

export type LeadFormFieldType = 'text' | 'email' | 'tel' | 'textarea';

export interface LeadFormFieldConfig {
  readonly id: string;
  readonly label: string;
  readonly type: LeadFormFieldType;
  readonly placeholder: string;
  readonly required: boolean;
  readonly helpText?: string;
  readonly order: number;
}

export interface LeadFormBlockConfig extends BlockConfig<'leadForm'> {
  readonly title: string;
  readonly description: string;
  readonly submitText: string;
  readonly submitAppearance?: ButtonAppearance;
  readonly successMessage: string;
  readonly fields: readonly LeadFormFieldConfig[];
}

export interface LeadFormBlockUpdate {
  readonly title?: string;
  readonly description?: string;
  readonly submitText?: string;
  readonly submitAppearance?: ButtonAppearanceUpdate | null;
  readonly successMessage?: string;
  readonly fields?: readonly LeadFormFieldConfig[];
}
