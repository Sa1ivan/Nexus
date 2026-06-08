import type { BlockType } from './block-type.model';

export interface BlockConfig<TType extends BlockType = BlockType> {
  readonly id: string;
  readonly type: TType;
}
