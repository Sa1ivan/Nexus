import { computed, inject, Injectable, signal } from '@angular/core';

import {
  ProjectVersionConflictError,
  type Project,
  type ProjectSaveStatus,
  type SiteConfig,
} from '../domain/models';
import { PROJECT_REPOSITORY } from '../domain/ports';

const CONFLICT_MESSAGE =
  'Проект изменён в другой вкладке. Экспортируйте текущую версию или перезагрузите последнюю сохранённую.';

@Injectable({
  providedIn: 'root',
})
export class BuilderProjectStore {
  private readonly repository = inject(PROJECT_REPOSITORY);
  private readonly currentProjectSignal = signal<Project | null>(null);
  private readonly saveStatusSignal = signal<ProjectSaveStatus>('idle');
  private readonly projectErrorSignal = signal<string | null>(null);
  private readonly versionConflictSignal = signal(false);
  private readonly initializedSignal = signal(false);
  private sessionEpoch = 0;
  private documentGeneration = 0;
  private writeSequence = 0;
  private activeWriteId: number | null = null;
  private activationQueue: Promise<void> = Promise.resolve();

  readonly currentProject = this.currentProjectSignal.asReadonly();
  readonly saveStatus = this.saveStatusSignal.asReadonly();
  readonly projectError = this.projectErrorSignal.asReadonly();
  readonly hasVersionConflict = this.versionConflictSignal.asReadonly();
  readonly initialized = this.initializedSignal.asReadonly();
  readonly publishedUrl = computed(() => {
    const project = this.currentProject();

    return project?.publishedReleaseId === null || project === null ? null : `/p/${project.id}`;
  });

  async initialize(projectId?: string): Promise<SiteConfig | null> {
    const sessionEpoch = ++this.sessionEpoch;
    this.activeWriteId = null;
    this.initializedSignal.set(false);
    this.projectErrorSignal.set(null);
    this.versionConflictSignal.set(false);

    if (projectId !== undefined) {
      this.currentProjectSignal.set(null);
      this.saveStatusSignal.set('idle');
    }

    try {
      const project =
        projectId === undefined
          ? await this.repository.getActiveProject()
          : await this.repository.getProject(projectId);

      if (!this.isCurrentSession(sessionEpoch)) {
        return null;
      }

      if (project === null) {
        this.currentProjectSignal.set(null);
        this.saveStatusSignal.set('idle');

        if (projectId !== undefined) {
          this.projectErrorSignal.set('Проект не найден.');
        }

        return null;
      }

      if (projectId !== undefined) {
        await this.activateProject(project.id);

        if (!this.isCurrentSession(sessionEpoch)) {
          return null;
        }
      }

      this.applyProject(project, 'saved');

      return project.draft;
    } catch (error) {
      if (this.isCurrentSession(sessionEpoch)) {
        this.saveStatusSignal.set('error');
        this.projectErrorSignal.set(this.readErrorMessage(error));
      }

      return null;
    } finally {
      if (this.isCurrentSession(sessionEpoch)) {
        this.initializedSignal.set(true);
      }
    }
  }

  async create(
    siteConfig: SiteConfig,
    canApply: () => boolean = () => true,
  ): Promise<Project | null> {
    const writeId = this.beginWrite();

    if (writeId === null) {
      return null;
    }

    const sessionEpoch = ++this.sessionEpoch;
    const documentGeneration = this.documentGeneration;
    this.saveStatusSignal.set('saving');
    this.projectErrorSignal.set(null);
    this.versionConflictSignal.set(false);

    try {
      const project = await this.repository.createProject({ siteConfig });

      if (!this.isCurrentSession(sessionEpoch) || !canApply()) {
        await this.restoreCurrentProjectActivation();
        return null;
      }

      this.applyProject(project, this.getCompletionStatus(documentGeneration));

      return project;
    } catch (error) {
      if (this.isCurrentSession(sessionEpoch)) {
        this.handleError(error);
      }

      return null;
    } finally {
      this.endWrite(writeId);
    }
  }

  async save(siteConfig: SiteConfig): Promise<Project | null> {
    const writeId = this.beginWrite();

    if (writeId === null) {
      return null;
    }

    const currentProject = this.currentProject();
    const sessionEpoch = currentProject === null ? ++this.sessionEpoch : this.sessionEpoch;
    const documentGeneration = this.documentGeneration;
    const projectId = currentProject?.id ?? null;
    this.saveStatusSignal.set('saving');
    this.projectErrorSignal.set(null);
    this.versionConflictSignal.set(false);

    try {
      const project =
        currentProject === null
          ? await this.repository.createProject({ siteConfig })
          : await this.repository.saveDraft({
              projectId: currentProject.id,
              expectedDraftVersion: currentProject.draftVersion,
              siteConfig,
            });

      if (!this.isCurrentOperation(sessionEpoch, projectId)) {
        return null;
      }

      this.applyProject(project, this.getCompletionStatus(documentGeneration));

      return project;
    } catch (error) {
      if (this.isCurrentOperation(sessionEpoch, projectId)) {
        this.handleError(error);
      }

      return null;
    } finally {
      this.endWrite(writeId);
    }
  }

  async publish(siteConfig: SiteConfig): Promise<Project | null> {
    const writeId = this.beginWrite();

    if (writeId === null) {
      return null;
    }

    const initialProject = this.currentProject();
    const sessionEpoch = initialProject === null ? ++this.sessionEpoch : this.sessionEpoch;
    const documentGeneration = this.documentGeneration;
    this.saveStatusSignal.set('saving');
    this.projectErrorSignal.set(null);
    this.versionConflictSignal.set(false);

    try {
      const currentProject =
        initialProject ?? (await this.repository.createProject({ siteConfig }));

      if (!this.isCurrentOperation(sessionEpoch, initialProject?.id ?? null)) {
        return null;
      }

      this.currentProjectSignal.set(currentProject);

      const publishedProject = await this.repository.publishProject({
        projectId: currentProject.id,
        expectedDraftVersion: currentProject.draftVersion,
        siteConfig,
      });

      if (!this.isCurrentOperation(sessionEpoch, currentProject.id)) {
        return null;
      }

      this.applyProject(publishedProject, this.getCompletionStatus(documentGeneration));

      return publishedProject;
    } catch (error) {
      if (this.isCurrentSession(sessionEpoch)) {
        this.handleError(error);
      }

      return null;
    } finally {
      this.endWrite(writeId);
    }
  }

  replaceCurrentProject(project: Project): void {
    this.sessionEpoch += 1;
    this.activeWriteId = null;
    this.applyProject(project, 'saved');
  }

  markDirty(): void {
    this.documentGeneration += 1;
    this.saveStatusSignal.set('dirty');
    this.projectErrorSignal.set(null);
    this.versionConflictSignal.set(false);
  }

  reportError(message: string, preserveSaveStatus = false): void {
    if (!preserveSaveStatus) {
      this.saveStatusSignal.set('error');
    }

    this.projectErrorSignal.set(message);
    this.versionConflictSignal.set(false);
  }

  private applyProject(project: Project, saveStatus: ProjectSaveStatus): void {
    this.currentProjectSignal.set(project);
    this.saveStatusSignal.set(saveStatus);
    this.projectErrorSignal.set(null);
    this.versionConflictSignal.set(false);
  }

  private activateProject(projectId: string): Promise<void> {
    const activation = this.activationQueue.then(() => this.repository.setActiveProject(projectId));
    this.activationQueue = activation.catch(() => undefined);

    return activation;
  }

  private async restoreCurrentProjectActivation(): Promise<void> {
    const currentProjectId = this.currentProject()?.id;

    if (currentProjectId !== undefined) {
      await this.activateProject(currentProjectId);
    }
  }

  private beginWrite(): number | null {
    if (this.activeWriteId !== null) {
      return null;
    }

    const writeId = ++this.writeSequence;
    this.activeWriteId = writeId;

    return writeId;
  }

  private endWrite(writeId: number): void {
    if (this.activeWriteId === writeId) {
      this.activeWriteId = null;
    }
  }

  private getCompletionStatus(documentGeneration: number): ProjectSaveStatus {
    return documentGeneration === this.documentGeneration ? 'saved' : 'dirty';
  }

  private isCurrentSession(sessionEpoch: number): boolean {
    return sessionEpoch === this.sessionEpoch;
  }

  private isCurrentOperation(sessionEpoch: number, projectId: string | null): boolean {
    if (!this.isCurrentSession(sessionEpoch)) {
      return false;
    }

    const currentProjectId = this.currentProject()?.id ?? null;

    return projectId === null ? currentProjectId === null : currentProjectId === projectId;
  }

  private handleError(error: unknown): void {
    const isVersionConflict = error instanceof ProjectVersionConflictError;

    this.saveStatusSignal.set('error');
    this.versionConflictSignal.set(isVersionConflict);
    this.projectErrorSignal.set(
      isVersionConflict ? CONFLICT_MESSAGE : this.readErrorMessage(error),
    );
  }

  private readErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Не удалось выполнить действие.';
  }
}
