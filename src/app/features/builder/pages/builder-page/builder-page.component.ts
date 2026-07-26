import { CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BlockRendererComponent } from '../../../preview/ui/block-renderer/block-renderer.component';
import type { BlockType, PageBlockConfig } from '../../domain/models';
import {
  BLOCK_DEFINITIONS,
  BLOCK_PALETTE,
  type BlockDefinition,
} from '../../domain/registry/block-registry';
import { BuilderStore } from '../../stores/builder.store';
import { BlockInspectorComponent } from '../../ui/block-inspector/block-inspector.component';
import { SiteSettingsEditorComponent } from '../../ui/site-settings-editor/site-settings-editor.component';

type CanvasMode = 'edit' | 'preview';
type CanvasViewport = 'desktop' | 'mobile';
type MobilePanel = 'blocks' | 'canvas' | 'settings';
type SidebarTab = 'add' | 'layers' | 'theme';

interface PaletteGroup {
  readonly label: string;
  readonly items: readonly BlockDefinition[];
}

@Component({
  selector: 'app-builder-page',
  standalone: true,
  imports: [
    BlockInspectorComponent,
    BlockRendererComponent,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    SiteSettingsEditorComponent,
  ],
  templateUrl: './builder-page.component.html',
  styleUrl: './builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderPageComponent implements OnInit {
  private readonly builderStore = inject(BuilderStore);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly siteConfig = this.builderStore.siteConfig;
  readonly pages = this.builderStore.pages;
  readonly activePageSlug = this.builderStore.activePageSlug;
  readonly activePage = this.builderStore.activePage;
  readonly activeBlocks = this.builderStore.activeBlocks;
  readonly selectedBlock = this.builderStore.selectedBlock;
  readonly saveStatus = this.builderStore.saveStatus;
  readonly projectError = this.builderStore.projectError;
  readonly publishedUrl = this.builderStore.publishedUrl;
  readonly canUndo = this.builderStore.canUndo;
  readonly canRedo = this.builderStore.canRedo;

  readonly canvasMode = signal<CanvasMode>('edit');
  readonly canvasViewport = signal<CanvasViewport>('desktop');
  readonly mobilePanel = signal<MobilePanel>('canvas');
  readonly sidebarTab = signal<SidebarTab>('add');
  readonly paletteGroups: readonly PaletteGroup[] = ['Основа', 'Контент', 'Доверие', 'Конверсия']
    .map((label) => ({
      label,
      items: BLOCK_PALETTE.filter((item) => this.getPaletteGroup(item.type) === label),
    }))
    .filter((group) => group.items.length > 0);

  async ngOnInit(): Promise<void> {
    await this.builderStore.initialize(this.route.snapshot.paramMap.get('projectId') ?? undefined);
  }

  selectPage(slug: string): void {
    this.builderStore.selectPage(slug);
  }

  selectBlock(blockId: string): void {
    this.builderStore.selectBlock(blockId);
  }

  addBlock(type: BlockType): void {
    this.builderStore.addBlock(type);
  }

  async saveProject(): Promise<void> {
    await this.builderStore.saveCurrentProject();
  }

  async publishProject(): Promise<void> {
    await this.builderStore.publishCurrentProject();
  }

  exportProject(): void {
    const { fileName, blob } = this.builderStore.exportCurrentProject();
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = this.document.createElement('a');

    downloadLink.href = objectUrl;
    downloadLink.download = fileName;
    downloadLink.hidden = true;
    this.document.body.append(downloadLink);

    try {
      downloadLink.click();
    } finally {
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    }
  }

  async importProject(event: Event): Promise<void> {
    const fileInput = event.currentTarget as HTMLInputElement;
    const file = fileInput.files?.[0];

    try {
      if (file === undefined || !(await this.builderStore.importProjectFile(file))) {
        return;
      }

      const projectId = this.builderStore.currentProject()?.id;

      if (projectId !== undefined) {
        await this.router.navigate(['/builder', projectId], {
          replaceUrl: true,
        });
      }
    } finally {
      fileInput.value = '';
    }
  }

  undo(): void {
    this.builderStore.undo();
  }

  redo(): void {
    this.builderStore.redo();
  }

  setCanvasMode(mode: CanvasMode): void {
    this.canvasMode.set(mode);
  }

  setCanvasViewport(viewport: CanvasViewport): void {
    this.canvasViewport.set(viewport);
  }

  setMobilePanel(panel: MobilePanel): void {
    this.mobilePanel.set(panel);
  }

  setSidebarTab(tab: SidebarTab): void {
    this.sidebarTab.set(tab);
  }

  duplicateBlock(blockId: string): void {
    this.builderStore.duplicateBlock(blockId);
  }

  removeBlock(blockId: string): void {
    this.builderStore.removeBlock(blockId);
  }

  moveBlock(blockId: string, direction: 'up' | 'down'): void {
    this.builderStore.moveBlock(blockId, direction);
  }

  toggleBlockVisibility(blockId: string): void {
    this.builderStore.toggleBlockVisibility(blockId);
  }

  dropBlock(event: CdkDragDrop<readonly PageBlockConfig[]>): void {
    if (this.builderStore.reorderActiveBlocks(event.previousIndex, event.currentIndex)) {
      this.builderStore.selectBlock(event.item.data.id);
    }
  }

  getBlockIcon(type: BlockType): string {
    return BLOCK_DEFINITIONS[type].icon;
  }

  getBlockTypeLabel(type: BlockType): string {
    return BLOCK_DEFINITIONS[type].label;
  }

  getBlockLabel(block: PageBlockConfig): string {
    switch (block.type) {
      case 'siteHeader':
      case 'siteFooter':
        return block.brandName;
      case 'hero':
      case 'contentMedia':
      case 'featureGrid':
      case 'offerList':
      case 'gallery':
      case 'testimonials':
      case 'faq':
      case 'callToAction':
      case 'leadForm':
        return block.title;
    }
  }

  canMoveBlock(blockId: string, direction: 'up' | 'down'): boolean {
    const index = this.activeBlocks().findIndex((block) => block.id === blockId);
    return index >= 0 && (direction === 'up' ? index > 0 : index < this.activeBlocks().length - 1);
  }

  private getPaletteGroup(type: BlockType): string {
    const value: string = type;

    if (['siteHeader', 'hero', 'siteFooter'].includes(value)) {
      return 'Основа';
    }

    if (['contentMedia', 'featureGrid', 'offerList', 'gallery'].includes(value)) {
      return 'Контент';
    }

    if (['testimonials', 'faq'].includes(value)) {
      return 'Доверие';
    }

    return 'Конверсия';
  }
}
