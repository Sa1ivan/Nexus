import type { BlockType } from '../models';

export interface BlockVariantOption<TVariant extends string = string> {
  readonly id: TVariant;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export interface BlockDefinition<TType extends BlockType = BlockType> {
  readonly type: TType;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly anchorBase: string;
  readonly renderer: string;
  readonly inspector: string;
  readonly variants: readonly BlockVariantOption[];
}

export interface CloneBlockOptions {
  readonly preserveAnchor?: boolean;
}
