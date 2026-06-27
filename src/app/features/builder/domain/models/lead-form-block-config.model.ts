import type { BlockConfig } from './block-config.model';

export type LeadFormFieldType = 'text' | 'email' | 'tel' | 'textarea';

export interface LeadFormFieldConfig {
  readonly id: string;
  readonly label: string;
  readonly type: LeadFormFieldType;
  readonly placeholder: string;
  readonly required: boolean;
}

export interface LeadFormBlockConfig extends BlockConfig<'leadForm'> {
  readonly title: string;
  readonly description: string;
  readonly submitText: string;
  readonly successMessage: string;
  readonly fields: readonly LeadFormFieldConfig[];
}

export interface LeadFormBlockUpdate {
  readonly title?: string;
  readonly description?: string;
  readonly submitText?: string;
  readonly successMessage?: string;
  readonly fields?: readonly LeadFormFieldConfig[];
}
