import type { BlockConfig } from './block-config.model';

export type HeroContentAlignment = 'left' | 'center' | 'right';

export interface HeroBlockStyles {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly buttonBackgroundColor: string;
  readonly buttonTextColor: string;
  readonly minHeight: string;
  readonly alignment: HeroContentAlignment;
}

export interface HeroBlockConfig extends BlockConfig<'hero'> {
  readonly title: string;
  readonly subtitle: string;
  readonly buttonText: string;
  readonly buttonHref: string;
  readonly styles: HeroBlockStyles;
}

export interface HeroBlockUpdate {
  readonly title?: string;
  readonly subtitle?: string;
  readonly buttonText?: string;
  readonly buttonHref?: string;
  readonly styles?: Partial<HeroBlockStyles>;
}
