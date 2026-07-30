import { computed, inject, Injectable, signal, type Signal } from '@angular/core';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import { buildLandingDraft } from '../data-access/landing-draft.factory';
import {
  ProjectTransferService,
  type ProjectTransferDecodeFailureReason,
} from '../data-access/project-transfer.service';
import {
  DEFAULT_BLOCK_APPEARANCE,
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
} from '../domain/models';
import {
  cloneRegisteredBlock,
  createDefaultBlock as createRegisteredDefaultBlock,
} from '../domain/registry/block-registry';
import { moveCollectionItem, removeCollectionItem } from '../domain/utils/collection-update';
import { normalizeAnchor } from '../domain/utils/builder-ids';
import { areStructurallyEqual } from '../domain/utils/structural-equality';
import {
  createPage as createPageConfig,
  duplicatePage as duplicatePageConfig,
  movePage as movePageConfig,
  removePage as removePageConfig,
  renamePage as renamePageConfig,
  updatePageSeo as updatePageSeoConfig,
  updatePageSlug as updatePageSlugConfig,
  type PageMutationResult,
} from '../domain/utils/page-config-update';
import type {
  BlockAppearanceOverrides,
  BlockType,
  CompleteLandingWizardSelection,
  LandingDesignSettings,
  PageBlockConfig,
  PageConfig,
  PageSeoConfig,
  Project,
  SiteBusinessConfig,
  SiteConfig,
  SiteSeoConfig,
  SiteThemeConfig,
} from '../domain/models';
import { BlockConfigMergeService } from '../services/block-config-merge.service';
import { SiteBusinessInheritanceService } from '../services/site-business-inheritance.service';
import { BuilderHistoryStore } from './builder-history.store';
import { BuilderProjectStore } from './builder-project.store';
import type { MoveDirection } from './builder-store.types';

@Injectable({
  providedIn: 'root',
})
export class BuilderStore {
  private readonly projectStore = inject(BuilderProjectStore);
  private readonly historyStore = inject(BuilderHistoryStore);
  private readonly projectTransferService = inject(ProjectTransferService);
  private readonly blockConfigMerge = inject(BlockConfigMergeService);
  private readonly businessInheritance = inject(SiteBusinessInheritanceService);
  private readonly siteConfigSignal = signal<SiteConfig>(DEFAULT_SITE_CONFIG);
  private readonly activePageIdSignal = signal<string>(DEFAULT_SITE_CONFIG.pages[0]?.id ?? '');
  private readonly selectedBlockIdSignal = signal<string | null>(
    DEFAULT_SITE_CONFIG.pages[0]?.blocks[0]?.id ?? null,
  );
  private readonly pageErrorSignal = signal<string | null>(null);
  private readonly documentRevisionSignal = signal(0);
  private projectImportSequence = 0;
  private projectInitializationSequence = 0;
  private projectImportInProgress = false;

  readonly currentProject = this.projectStore.currentProject;
  readonly saveStatus = this.projectStore.saveStatus;
  readonly projectError = this.projectStore.projectError;
  readonly pageError = this.pageErrorSignal.asReadonly();
  readonly documentRevision: Signal<number> = this.documentRevisionSignal.asReadonly();
  readonly siteConfig = computed<SiteConfig>(() => this.siteConfigSignal());
  readonly pages = computed<readonly PageConfig[]>(() => this.siteConfig().pages);
  readonly activePageId = computed<string>(() => this.activePageIdSignal());
  readonly activePage = computed<PageConfig | null>(() => {
    const activePageId = this.activePageId();

    return this.pages().find((page) => page.id === activePageId) ?? null;
  });
  readonly activePageSlug = computed<string>(() => this.activePage()?.slug ?? '');
  readonly selectedBlockId = computed<string | null>(() => this.selectedBlockIdSignal());
  readonly canUndo = this.historyStore.canUndo;
  readonly canRedo = this.historyStore.canRedo;
  readonly publishedUrl = this.projectStore.publishedUrl;
  readonly activeBlocks = computed<readonly PageBlockConfig[]>(
    () => this.activePage()?.blocks ?? [],
  );
  readonly selectedBlock = computed<PageBlockConfig | null>(() => {
    const blocks = this.activeBlocks();
    const selectedBlockId = this.selectedBlockId();

    return blocks.find((block) => block.id === selectedBlockId) ?? blocks[0] ?? null;
  });

  selectPage(slug: string): boolean {
    const page = this.pages().find((pageConfig) => pageConfig.slug === slug);

    if (page === undefined) {
      return false;
    }

    this.activePageIdSignal.set(page.id);
    this.selectedBlockIdSignal.set(page.blocks[0]?.id ?? null);
    this.pageErrorSignal.set(null);

    return true;
  }

  selectBlock(blockId: string): boolean {
    const blockExists = this.activeBlocks().some((block) => block.id === blockId);

    if (!blockExists) {
      return false;
    }

    this.selectedBlockIdSignal.set(blockId);

    return true;
  }

  async initialize(projectId?: string): Promise<boolean> {
    this.projectImportSequence += 1;
    const initializationSequence = ++this.projectInitializationSequence;
    const previousProject = this.currentProject();
    const previousSiteConfig = this.siteConfig();
    const previousActivePageId = this.activePageId();
    const previousSelectedBlockId = this.selectedBlockId();
    const previousHistory = this.historyStore.snapshot();

    if (projectId !== undefined) {
      this.hydrateSiteConfig(DEFAULT_SITE_CONFIG);
    }

    const siteConfig = await this.projectStore.initialize(projectId);

    if (initializationSequence !== this.projectInitializationSequence) {
      return false;
    }

    if (siteConfig !== null) {
      this.hydrateSiteConfig(siteConfig);
      return true;
    }

    const initializationError = this.projectError();

    if (previousProject !== null) {
      this.projectStore.replaceCurrentProject(previousProject);
      if (initializationError !== null) {
        this.projectStore.reportError(initializationError, true);
      }
      this.siteConfigSignal.set(previousSiteConfig);
      this.activePageIdSignal.set(previousActivePageId);
      this.selectedBlockIdSignal.set(previousSelectedBlockId);
      this.historyStore.restore(previousHistory);
    } else if (projectId !== undefined) {
      this.hydrateSiteConfig(DEFAULT_SITE_CONFIG);
    }

    return projectId === undefined && initializationError === null;
  }

  async saveCurrentProject(): Promise<boolean> {
    return (await this.projectStore.save(this.siteConfig())) !== null;
  }

  async publishCurrentProject(): Promise<boolean> {
    return (await this.projectStore.publish(this.siteConfig())) !== null;
  }

  exportCurrentProject(): { readonly fileName: string; readonly blob: Blob } {
    return this.projectTransferService.createDownload(this.siteConfig());
  }

  async importProjectFile(file: File): Promise<boolean> {
    if (this.projectImportInProgress || this.saveStatus() === 'saving') {
      this.projectStore.reportError('Дождитесь завершения текущего сохранения или импорта.', true);
      return false;
    }

    this.projectImportInProgress = true;

    try {
      const importSequence = ++this.projectImportSequence;
      const projectBeforeImport = this.currentProject();
      const documentBeforeImport = this.siteConfig();
      const decodedProject = await this.projectTransferService.readFile(file);

      if (!this.isCurrentProjectImport(importSequence, projectBeforeImport, documentBeforeImport)) {
        return false;
      }

      if (!decodedProject.ok) {
        this.projectStore.reportError(this.getProjectImportError(decodedProject.reason));
        return false;
      }

      const project = await this.projectStore.create(decodedProject.value, () =>
        this.isCurrentProjectImport(importSequence, projectBeforeImport, documentBeforeImport),
      );

      if (project === null) {
        if (
          !this.isCurrentProjectImport(importSequence, projectBeforeImport, documentBeforeImport)
        ) {
          return false;
        }

        this.projectStore.reportError('Не удалось создать проект из импортированного файла.');
        return false;
      }

      this.hydrateSiteConfig(project.draft);

      return true;
    } finally {
      this.projectImportInProgress = false;
    }
  }

  addPage(title: string): boolean {
    return this.applyPageMutation(createPageConfig(this.pages(), title));
  }

  renamePage(pageId: string, title: string): boolean {
    return this.applyPageMutation(renamePageConfig(this.pages(), pageId, title));
  }

  updatePageSlug(pageId: string, slug: string): boolean {
    return this.applyPageMutation(updatePageSlugConfig(this.pages(), pageId, slug));
  }

  updatePageSeo(pageId: string, update: Partial<PageSeoConfig>): boolean {
    return this.applyPageMutation(updatePageSeoConfig(this.pages(), pageId, update));
  }

  duplicatePage(pageId: string): boolean {
    return this.applyPageMutation(duplicatePageConfig(this.pages(), pageId));
  }

  movePage(pageId: string, direction: MoveDirection): boolean {
    return this.applyPageMutation(movePageConfig(this.pages(), pageId, direction));
  }

  removePage(pageId: string): boolean {
    return this.applyPageMutation(removePageConfig(this.pages(), pageId));
  }

  updateSiteName(name: string): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    const current = this.siteConfig();

    return normalizedName === current.name
      ? false
      : this.commitSiteConfig({
          ...current,
          name: normalizedName,
        });
  }

  updateSiteTheme(update: Partial<SiteThemeConfig>): boolean {
    if (update.radius !== undefined && !Number.isFinite(update.radius)) {
      return false;
    }

    const current = this.siteConfig();
    const normalizedUpdate: Partial<SiteThemeConfig> =
      update.radius === undefined
        ? update
        : { ...update, radius: Math.min(32, Math.max(0, update.radius)) };
    const theme = this.blockConfigMerge.mergeRecord(current.theme, normalizedUpdate);

    return theme === current.theme
      ? false
      : this.commitSiteConfig({
          ...current,
          theme,
        });
  }

  updateSiteBusiness(update: Partial<SiteBusinessConfig>): boolean {
    const current = this.siteConfig();
    const business = this.blockConfigMerge.mergeRecord(current.business, update);

    return business === current.business
      ? false
      : this.commitSiteConfig(
          this.businessInheritance.apply({
            ...current,
            business,
          }),
        );
  }

  updateSiteSeo(update: Partial<SiteSeoConfig>): boolean {
    const current = this.siteConfig();
    const seo = this.blockConfigMerge.mergeRecord(current.seo, update);

    return seo === current.seo
      ? false
      : this.commitSiteConfig({
          ...current,
          seo,
        });
  }

  updateBlockAppearance(blockId: string, update: Partial<BlockAppearanceOverrides>): boolean {
    if (
      !this.blockConfigMerge.hasDefinedUpdate(update) ||
      (update.radius !== undefined && !Number.isFinite(update.radius))
    ) {
      return false;
    }

    return this.applyBlockMutation(blockId, (block) => {
      const appearance = this.blockConfigMerge.mergeRecord(
        block.appearance ?? DEFAULT_BLOCK_APPEARANCE,
        update.radius === undefined
          ? update
          : { ...update, radius: Math.min(32, Math.max(0, update.radius)) },
      );

      return appearance === block.appearance ? block : { ...block, appearance };
    });
  }

  updateBlockAnchor(blockId: string, anchor: string): boolean {
    const normalizedAnchor = normalizeAnchor(anchor);
    const duplicateAnchor = this.activeBlocks().some(
      (block) => block.id !== blockId && block.anchor === normalizedAnchor,
    );

    if (duplicateAnchor) {
      return false;
    }

    return this.applyBlockMutation(blockId, (block) =>
      block.anchor === normalizedAnchor ? block : { ...block, anchor: normalizedAnchor },
    );
  }

  toggleBlockVisibility(blockId: string): boolean {
    return this.applyBlockMutation(blockId, (block) => ({
      ...block,
      hidden: !block.hidden,
    }));
  }

  undo(): boolean {
    const previous = this.historyStore.undo(this.siteConfig());

    if (previous === null) {
      return false;
    }

    this.siteConfigSignal.set(previous);
    this.reconcileTransientState();
    this.markDirty();

    return true;
  }

  redo(): boolean {
    const next = this.historyStore.redo(this.siteConfig());

    if (next === null) {
      return false;
    }

    this.siteConfigSignal.set(next);
    this.reconcileTransientState();
    this.markDirty();

    return true;
  }

  async createLandingDraft(selection: CompleteLandingWizardSelection): Promise<Project | null> {
    const siteConfig = buildLandingDraft(selection);
    const project = await this.projectStore.create(siteConfig);

    if (project !== null) {
      this.hydrateSiteConfig(project.draft);
    }

    return project;
  }

  addBlock(
    type: BlockType,
    afterBlockId: string | null = this.selectedBlock()?.id ?? null,
  ): string | null {
    let insertedBlockId: string | null = null;

    const didInsert = this.updateActiveBlocks((blocks) => {
      const block = this.createDefaultBlock(type, blocks);
      const insertIndex = this.getInsertIndex(blocks, afterBlockId);

      insertedBlockId = block.id;

      return [...blocks.slice(0, insertIndex), block, ...blocks.slice(insertIndex)];
    });

    if (!didInsert || insertedBlockId === null) {
      return null;
    }

    this.selectedBlockIdSignal.set(insertedBlockId);

    return insertedBlockId;
  }

  duplicateBlock(blockId: string): string | null {
    let duplicatedBlockId: string | null = null;

    this.updateActiveBlocks((blocks) => {
      const blockIndex = blocks.findIndex((block) => block.id === blockId);
      const block = blocks[blockIndex];

      if (blockIndex === -1 || block === undefined) {
        return blocks;
      }

      const duplicatedBlock = this.cloneBlock(block, blocks);
      duplicatedBlockId = duplicatedBlock.id;

      return [...blocks.slice(0, blockIndex + 1), duplicatedBlock, ...blocks.slice(blockIndex + 1)];
    });

    if (duplicatedBlockId !== null) {
      this.selectedBlockIdSignal.set(duplicatedBlockId);
    }

    return duplicatedBlockId;
  }

  removeBlock(blockId: string): boolean {
    let nextSelectedBlockId: string | null = null;
    const didRemove = this.updateActiveBlocks((blocks) => {
      const blockIndex = blocks.findIndex((block) => block.id === blockId);

      if (blockIndex === -1) {
        return blocks;
      }

      const nextBlocks = removeCollectionItem(blocks, blockIndex);
      nextSelectedBlockId = nextBlocks[Math.min(blockIndex, nextBlocks.length - 1)]?.id ?? null;

      return nextBlocks;
    });

    if (didRemove) {
      this.selectedBlockIdSignal.set(nextSelectedBlockId);
    }

    return didRemove;
  }

  moveBlock(blockId: string, direction: MoveDirection): boolean {
    const currentIndex = this.activeBlocks().findIndex((block) => block.id === blockId);

    if (currentIndex === -1) {
      return false;
    }

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    return this.reorderActiveBlocks(currentIndex, nextIndex);
  }

  reorderActiveBlocks(previousIndex: number, currentIndex: number): boolean {
    return this.updateActiveBlocks((blocks) =>
      moveCollectionItem(blocks, previousIndex, currentIndex),
    );
  }

  updateBlockDesign(blockId: string, update: Partial<LandingDesignSettings>): boolean {
    if (!this.blockConfigMerge.hasDefinedUpdate(update)) {
      return false;
    }

    return this.applyBlockMutation(blockId, (block) => {
      const design = this.blockConfigMerge.mergeDesign(
        block.design ?? DEFAULT_LANDING_DESIGN_SETTINGS,
        update,
      );

      if (block.type !== 'hero' || update.accentColor === undefined) {
        return {
          ...block,
          design,
        };
      }

      return {
        ...block,
        design,
        styles: {
          ...block.styles,
          buttonBackgroundColor: getLandingAccentValue(update.accentColor),
        },
      };
    });
  }

  applyBlockMutation(
    blockId: string,
    updater: (block: PageBlockConfig) => PageBlockConfig,
  ): boolean {
    return this.updateActiveBlocks((blocks) => {
      const blockIndex = blocks.findIndex((block) => block.id === blockId);
      const block = blocks[blockIndex];

      if (blockIndex === -1 || block === undefined) {
        return blocks;
      }

      const nextBlock = updater(block);

      return nextBlock === block || areStructurallyEqual(nextBlock, block)
        ? blocks
        : blocks.map((currentBlock, index) => (index === blockIndex ? nextBlock : currentBlock));
    });
  }

  private updateActiveBlocks(
    updater: (blocks: readonly PageBlockConfig[]) => readonly PageBlockConfig[],
  ): boolean {
    const current = this.siteConfig();
    const activeSlug = this.activePageSlug();
    const activePageIndex = current.pages.findIndex((page) => page.slug === activeSlug);
    const activePage = current.pages[activePageIndex];

    if (activePageIndex === -1 || activePage === undefined) {
      return false;
    }

    const blocks = updater(activePage.blocks);

    if (blocks === activePage.blocks) {
      return false;
    }

    return this.commitSiteConfig({
      ...current,
      pages: current.pages.map((page, index) =>
        index === activePageIndex ? { ...page, blocks } : page,
      ),
    });
  }

  private createDefaultBlock(
    type: BlockType,
    currentBlocks: readonly PageBlockConfig[],
  ): PageBlockConfig {
    return this.businessInheritance.applyToBlock(
      createRegisteredDefaultBlock(type, currentBlocks),
      this.siteConfig().business,
    );
  }

  private cloneBlock(
    block: PageBlockConfig,
    currentBlocks: readonly PageBlockConfig[],
  ): PageBlockConfig {
    return cloneRegisteredBlock(block, currentBlocks);
  }

  private getInsertIndex(blocks: readonly PageBlockConfig[], afterBlockId: string | null): number {
    if (afterBlockId === null) {
      return blocks.length;
    }

    const blockIndex = blocks.findIndex((block) => block.id === afterBlockId);

    return blockIndex === -1 ? blocks.length : blockIndex + 1;
  }

  private hydrateSiteConfig(siteConfig: SiteConfig): void {
    this.siteConfigSignal.set(siteConfig);
    this.activePageIdSignal.set(siteConfig.pages[0]?.id ?? '');
    this.selectedBlockIdSignal.set(siteConfig.pages[0]?.blocks[0]?.id ?? null);
    this.pageErrorSignal.set(null);
    this.historyStore.reset();
  }

  private applyPageMutation(result: PageMutationResult): boolean {
    if (!result.ok) {
      this.pageErrorSignal.set(this.getPageMutationError(result.reason));
      return false;
    }

    const didCommit = this.commitSiteConfig({
      ...this.siteConfig(),
      pages: result.pages,
    });

    if (!didCommit) {
      this.pageErrorSignal.set(null);
      return false;
    }

    this.activePageIdSignal.set(result.activePageId);
    this.pageErrorSignal.set(null);
    this.reconcileTransientState();

    return true;
  }

  private getPageMutationError(
    reason: Extract<PageMutationResult, { readonly ok: false }>['reason'],
  ): string {
    switch (reason) {
      case 'not-found':
        return 'Страница не найдена.';
      case 'last-page':
        return 'Нельзя удалить единственную страницу.';
      case 'empty-title':
        return 'Введите название страницы.';
      case 'empty-slug':
        return 'Введите адрес страницы.';
      case 'reserved-slug':
        return 'Этот адрес страницы зарезервирован системой.';
      case 'duplicate-slug':
        return 'Страница с таким адресом уже существует.';
      case 'boundary':
        return 'Страницу нельзя переместить дальше.';
    }
  }

  private getProjectImportError(reason: ProjectTransferDecodeFailureReason): string {
    switch (reason) {
      case 'file-too-large':
        return 'Файл проекта превышает допустимый размер 5 МБ.';
      case 'unsupported-format':
      case 'unsupported-site-schema':
        return 'Версия файла проекта не поддерживается.';
      default:
        return 'Не удалось импортировать проект. Проверьте файл и повторите попытку.';
    }
  }

  private isCurrentProjectImport(
    importSequence: number,
    project: Project | null,
    siteConfig: SiteConfig,
  ): boolean {
    return (
      importSequence === this.projectImportSequence &&
      project === this.currentProject() &&
      siteConfig === this.siteConfig()
    );
  }

  private commitSiteConfig(siteConfig: SiteConfig): boolean {
    const current = this.siteConfig();

    if (siteConfig === current || areStructurallyEqual(siteConfig, current)) {
      return false;
    }

    this.historyStore.record(current);
    this.siteConfigSignal.set(siteConfig);
    this.markDirty();

    return true;
  }

  private reconcileTransientState(): void {
    const siteConfig = this.siteConfig();
    const activePage =
      siteConfig.pages.find((page) => page.id === this.activePageId()) ??
      siteConfig.pages[0] ??
      null;

    if (activePage === null) {
      this.activePageIdSignal.set('');
      this.selectedBlockIdSignal.set(null);
      return;
    }

    this.activePageIdSignal.set(activePage.id);

    if (!activePage.blocks.some((block) => block.id === this.selectedBlockId())) {
      this.selectedBlockIdSignal.set(activePage.blocks[0]?.id ?? null);
    }
  }

  private markDirty(): void {
    this.documentRevisionSignal.update((revision) => revision + 1);
    this.projectStore.markDirty();
  }
}
