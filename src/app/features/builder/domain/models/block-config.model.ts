import type { BlockType } from './block-type.model';
import type { LandingDesignSettings } from './landing-design.model';

export type BlockId = string;
export type BlockAnchor = string;

export interface BlockConfig<TType extends BlockType = BlockType> {
  readonly id: BlockId;
  readonly anchor: BlockAnchor;
  readonly type: TType;
  readonly design?: LandingDesignSettings;
}
