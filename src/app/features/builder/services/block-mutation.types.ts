import type { PageBlockConfig } from '../domain/models';

export type BlockMutationExecutor = (
  blockId: string,
  updater: (block: PageBlockConfig) => PageBlockConfig,
) => boolean;
