import { inject, Injectable } from '@angular/core';

import { SITE_CONFIG_SCHEMA_VERSION } from '../domain/models';
import type { DraftRevision, LeadSubmission, Project, PublishedRelease } from '../domain/models';
import { SiteConfigCodec } from './site-config.codec';
import type { UnsupportedStoredSchemaVersion } from './project-storage-codec.types';
import type { ProjectStorageState } from './project-storage.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectStorageCodec {
  private readonly siteConfigCodec = inject(SiteConfigCodec);
  private fallbackIdCounter = 0;

  encode(state: ProjectStorageState): string {
    return JSON.stringify(state);
  }

  decode(serialized: string): ProjectStorageState {
    try {
      return this.normalizeStorageState(JSON.parse(serialized) as unknown);
    } catch {
      return this.createEmptyState();
    }
  }

  assertSupportedSchemaVersions(serialized: string): void {
    let storedValue: unknown;

    try {
      storedValue = JSON.parse(serialized) as unknown;
    } catch {
      throw new Error('Existing storage is corrupted and was not modified.');
    }

    const unsupportedVersion = this.findUnsupportedStoredSchemaVersion(storedValue);

    if (unsupportedVersion === null) {
      return;
    }

    throw new Error(
      `Unsupported SiteConfig schema version ${String(unsupportedVersion.value)} at ${unsupportedVersion.location}. ` +
        `Supported versions are 1, 2, 3 and ${SITE_CONFIG_SCHEMA_VERSION}. Existing storage was not modified.`,
    );
  }

  private normalizeStorageState(value: unknown): ProjectStorageState {
    const record = this.asRecord(value);

    if (record === null) {
      return this.createEmptyState();
    }

    const projects = this.asArray(record['projects'])
      .map((project) => this.normalizeProject(project))
      .filter((project): project is Project => project !== null);
    const leads = this.asArray(record['leads'])
      .map((lead) => this.normalizeLead(lead))
      .filter((lead): lead is LeadSubmission => lead !== null);
    const activeProjectId =
      typeof record['activeProjectId'] === 'string' &&
      projects.some((project) => project.id === record['activeProjectId'])
        ? record['activeProjectId']
        : null;

    return {
      projects,
      leads,
      activeProjectId,
    };
  }

  private normalizeProject(value: unknown): Project | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const draftResult = this.siteConfigCodec.normalize(record['draft']);

    if (!draftResult.ok) {
      return null;
    }

    const draft = draftResult.value;

    return {
      id: this.readString(record['id'], this.createId('project')),
      name: this.readString(record['name'], draft.name),
      draft,
      draftVersion: this.readNumber(record['draftVersion'], 1),
      publishedReleaseId:
        typeof record['publishedReleaseId'] === 'string' ? record['publishedReleaseId'] : null,
      releases: this.asArray(record['releases'])
        .map((release) => this.normalizeRelease(release))
        .filter((release): release is PublishedRelease => release !== null),
      revisions: this.asArray(record['revisions'])
        .map((revision) => this.normalizeRevision(revision))
        .filter((revision): revision is DraftRevision => revision !== null),
      createdAt: this.readString(record['createdAt'], new Date().toISOString()),
      updatedAt: this.readString(record['updatedAt'], new Date().toISOString()),
    };
  }

  private normalizeRelease(value: unknown): PublishedRelease | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const siteConfigResult = this.siteConfigCodec.normalize(record['siteConfig']);

    if (!siteConfigResult.ok) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('release')),
      version: this.readNumber(record['version'], 1),
      siteConfig: siteConfigResult.value,
      publishedAt: this.readString(record['publishedAt'], new Date().toISOString()),
    };
  }

  private normalizeRevision(value: unknown): DraftRevision | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const siteConfigResult = this.siteConfigCodec.normalize(record['siteConfig']);

    if (!siteConfigResult.ok) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('revision')),
      version: this.readNumber(record['version'], 1),
      siteConfig: siteConfigResult.value,
      createdAt: this.readString(record['createdAt'], new Date().toISOString()),
    };
  }

  private normalizeLead(value: unknown): LeadSubmission | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('lead')),
      projectId: this.readString(record['projectId'], ''),
      blockId: this.readString(record['blockId'], ''),
      fields: this.readStringRecord(record['fields']),
      status: record['status'] === 'failed' ? 'failed' : 'stored',
      createdAt: this.readString(record['createdAt'], new Date().toISOString()),
    };
  }

  private findUnsupportedStoredSchemaVersion(
    value: unknown,
  ): UnsupportedStoredSchemaVersion | null {
    const state = this.asRecord(value);

    if (state === null) {
      return null;
    }

    for (const [projectIndex, projectValue] of this.asArray(state['projects']).entries()) {
      const project = this.asRecord(projectValue);

      if (project === null) {
        continue;
      }

      const draftVersion = this.readUnsupportedSchemaVersion(
        project['draft'],
        `projects[${projectIndex}].draft`,
      );

      if (draftVersion !== null) {
        return draftVersion;
      }

      const releaseVersion = this.findUnsupportedCollectionSchemaVersion(
        project['releases'],
        `projects[${projectIndex}].releases`,
      );

      if (releaseVersion !== null) {
        return releaseVersion;
      }

      const revisionVersion = this.findUnsupportedCollectionSchemaVersion(
        project['revisions'],
        `projects[${projectIndex}].revisions`,
      );

      if (revisionVersion !== null) {
        return revisionVersion;
      }
    }

    return null;
  }

  private findUnsupportedCollectionSchemaVersion(
    value: unknown,
    location: string,
  ): UnsupportedStoredSchemaVersion | null {
    for (const [index, itemValue] of this.asArray(value).entries()) {
      const item = this.asRecord(itemValue);

      if (item === null) {
        continue;
      }

      const unsupportedVersion = this.readUnsupportedSchemaVersion(
        item['siteConfig'],
        `${location}[${index}].siteConfig`,
      );

      if (unsupportedVersion !== null) {
        return unsupportedVersion;
      }
    }

    return null;
  }

  private readUnsupportedSchemaVersion(
    value: unknown,
    location: string,
  ): UnsupportedStoredSchemaVersion | null {
    const siteConfig = this.asRecord(value);

    if (siteConfig === null) {
      return null;
    }

    const schemaVersion = siteConfig['schemaVersion'];

    return schemaVersion === 1 ||
      schemaVersion === 2 ||
      schemaVersion === 3 ||
      schemaVersion === SITE_CONFIG_SCHEMA_VERSION
      ? null
      : { location, value: schemaVersion };
  }

  private createEmptyState(): ProjectStorageState {
    return {
      projects: [],
      leads: [],
      activeProjectId: null,
    };
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asArray(value: unknown): readonly unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private readString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  }

  private readNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private readStringRecord(value: unknown): Readonly<Record<string, string>> {
    const record = this.asRecord(value);

    if (record === null) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(record)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
        .map(([key, fieldValue]) => [key, fieldValue.trim()]),
    );
  }

  private createId(prefix: string): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    this.fallbackIdCounter += 1;

    return `${prefix}-${Date.now().toString(36)}-${this.fallbackIdCounter.toString(36)}`;
  }
}
