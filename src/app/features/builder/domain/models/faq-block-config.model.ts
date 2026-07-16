import type { BlockConfig } from './block-config.model';

export type FaqVariant = 'borderedAccordion' | 'separatedList' | 'twoColumns';

export interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly initiallyOpen: boolean;
}

export interface FaqBlockConfig extends BlockConfig<'faq'> {
  readonly variant: FaqVariant;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly FaqItem[];
  readonly allowMultipleOpen: boolean;
}

export interface FaqBlockUpdate {
  readonly variant?: FaqVariant;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly description?: string;
  readonly items?: readonly FaqItem[];
  readonly allowMultipleOpen?: boolean;
}

export type FaqItemUpdate = Partial<Omit<FaqItem, 'id'>>;
