import type { BlockType } from './block-type.model';
import type { BlockAppearanceOverrides } from './block-appearance.model';
import type { LandingDesignSettings } from './landing-design.model';

export type BlockId = string;
export type BlockAnchor = string;

export interface BlockConfig<TType extends BlockType = BlockType> {
  readonly id: BlockId;
  readonly anchor: BlockAnchor;
  readonly type: TType;
  readonly appearance?: BlockAppearanceOverrides;
  readonly hidden: boolean;
  readonly design?: LandingDesignSettings;
}
