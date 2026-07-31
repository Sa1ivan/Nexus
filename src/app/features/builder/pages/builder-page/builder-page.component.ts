import { CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { concatMap, distinctUntilChanged, map, type Subscription } from 'rxjs';

import { BlockRendererComponent } from '../../../preview/ui/block-renderer/block-renderer.component';
import type { BlockType, PageBlockConfig } from '../../domain/models';
import { BLOCK_DEFINITIONS, BLOCK_PALETTE } from '../../domain/registry/block-registry';
import { BuilderAutosaveService } from '../../services/builder-autosave.service';
import { BuilderStore } from '../../stores/builder.store';
import { BlockInspectorComponent } from '../../ui/block-inspector/block-inspector.component';
import { PageManagerComponent } from '../../ui/page-manager/page-manager.component';
import { SiteSettingsEditorComponent } from '../../ui/site-settings-editor/site-settings-editor.component';
import { SettingsSelectComponent } from '../../ui/settings-select/settings-select.component';
import type { SettingsSelectOption } from '../../ui/settings-select/settings-select.types';
import type {
  CanvasMode,
  CanvasViewport,
  MobilePanel,
  PaletteGroup,
  SidebarTab,
} from './builder-page.types';

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
    PageManagerComponent,
    RouterLink,
    SettingsSelectComponent,
    SiteSettingsEditorComponent,
  ],
  templateUrl: './builder-page.component.html',
  styleUrl: './builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderPageComponent implements OnInit, OnDestroy {
  private readonly autosave = inject(BuilderAutosaveService);
  private readonly builderStore = inject(BuilderStore);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private destroyed = false;
  private routeSubscription: Subscription | null = null;

  readonly siteConfig = this.builderStore.siteConfig;
  readonly activePage = this.builderStore.activePage;
  readonly pages = this.builderStore.pages;
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
  readonly pageOptions = computed<readonly SettingsSelectOption[]>(() =>
    this.pages().map((page) => ({
      value: page.slug,
      label: page.title,
    })),
  );
  readonly paletteGroups: readonly PaletteGroup[] = ['Основа', 'Контент', 'Доверие', 'Конверсия']
    .map((label) => ({
      label,
      items: BLOCK_PALETTE.filter(
        (item) =>
          item.type !== 'siteHeader' &&
          item.type !== 'siteFooter' &&
          this.getPaletteGroup(item.type) === label,
      ),
    }))
    .filter((group) => group.items.length > 0);

  ngOnInit(): void {
    let hasLoadedDocument = false;
    let loadedProjectId: string | undefined;

    this.routeSubscription = this.route.paramMap
      .pipe(
        map((params) => params.get('projectId') ?? undefined),
        distinctUntilChanged(),
        concatMap(async (projectId) => {
          if (hasLoadedDocument && projectId === loadedProjectId) {
            return;
          }

          if (hasLoadedDocument && !(await this.autosave.flushPending())) {
            await this.restoreBuilderRoute(loadedProjectId);
            return;
          }

          const previousProjectId = loadedProjectId;
          const didInitialize = await this.builderStore.initialize(projectId);

          if (!didInitialize) {
            if (hasLoadedDocument) {
              await this.restoreBuilderRoute(previousProjectId);
            }
            return;
          }

          hasLoadedDocument = true;
          loadedProjectId = projectId;

          if (!this.destroyed) {
            this.autosave.start();
          }
        }),
      )
      .subscribe();
  }

  private async restoreBuilderRoute(projectId: string | undefined): Promise<void> {
    await this.router.navigate(projectId === undefined ? ['/builder'] : ['/builder', projectId], {
      replaceUrl: true,
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.routeSubscription?.unsubscribe();
    this.routeSubscription = null;
    this.autosave.stop();
    void this.autosave.flushPending();
  }

  selectBlock(blockId: string): void {
    this.builderStore.selectBlock(blockId);
  }

  selectPage(slug: string): void {
    this.builderStore.selectPage(slug);
  }

  addBlock(type: BlockType): void {
    this.builderStore.addBlock(type);
  }

  async saveProject(): Promise<void> {
    await this.autosave.flush();
  }

  async publishProject(): Promise<void> {
    await this.autosave.flush();

    if (this.saveStatus() === 'error') {
      return;
    }

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
    if (!(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    const fileInput = event.currentTarget;
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
        return `${block.brandName} · общий для всех страниц`;
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
    if (this.isSiteChromeBlockId(blockId)) {
      return false;
    }

    const index = this.activeBlocks().findIndex((block) => block.id === blockId);
    return index >= 0 && (direction === 'up' ? index > 1 : index < this.activeBlocks().length - 2);
  }

  isSiteChromeBlock(block: PageBlockConfig): boolean {
    return block.type === 'siteHeader' || block.type === 'siteFooter';
  }

  private isSiteChromeBlockId(blockId: string): boolean {
    const chrome = this.siteConfig().chrome;

    return blockId === chrome.header.id || blockId === chrome.footer.id;
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
