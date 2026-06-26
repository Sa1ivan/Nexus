import type { BlockType } from './block-type.model';
import type { LandingDesignSettings } from './landing-design.model';

export interface BlockConfig<TType extends BlockType = BlockType> {
  readonly id: string;
  readonly type: TType;
  readonly design?: LandingDesignSettings;
}
