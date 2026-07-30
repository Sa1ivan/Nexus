import type { BlockDefinition } from '../../domain/registry/block-registry';

export type CanvasMode = 'edit' | 'preview';
export type CanvasViewport = 'desktop' | 'mobile';
export type MobilePanel = 'blocks' | 'canvas' | 'settings';
export type SidebarTab = 'add' | 'layers' | 'theme';

export interface PaletteGroup {
  readonly label: string;
  readonly items: readonly BlockDefinition[];
}
