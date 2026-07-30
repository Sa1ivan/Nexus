import { inject, Injectable } from '@angular/core';

import type { SiteConfig } from '../domain/models';
import { SiteConfigCodec } from './site-config.codec';
import type { NexusProjectExport, ProjectTransferDecodeResult } from './project-transfer.types';
export type {
  NexusProjectExport,
  ProjectTransferDecodeFailureReason,
  ProjectTransferDecodeResult,
} from './project-transfer.types';

const PROJECT_EXPORT_FORMAT = 'nexus-project';
const PROJECT_EXPORT_FORMAT_VERSION = 1;
const MAX_PROJECT_FILE_SIZE = 5_000_000;

@Injectable({
  providedIn: 'root',
})
export class ProjectTransferService {
  private readonly siteConfigCodec = inject(SiteConfigCodec);

  serialize(siteConfig: SiteConfig, exportedAt = new Date().toISOString()): string {
    const projectExport: NexusProjectExport = {
      format: PROJECT_EXPORT_FORMAT,
      formatVersion: PROJECT_EXPORT_FORMAT_VERSION,
      exportedAt,
      siteConfig,
    };

    return JSON.stringify(projectExport, null, 2);
  }

  deserialize(serialized: string): ProjectTransferDecodeResult {
    if (serialized.length > MAX_PROJECT_FILE_SIZE) {
      return { ok: false, reason: 'file-too-large' };
    }

    let value: unknown;

    try {
      value = JSON.parse(serialized) as unknown;
    } catch {
      return { ok: false, reason: 'invalid-json' };
    }

    if (!this.isRecord(value) || value['format'] !== PROJECT_EXPORT_FORMAT) {
      return { ok: false, reason: 'invalid-format' };
    }

    if (value['formatVersion'] !== PROJECT_EXPORT_FORMAT_VERSION) {
      return { ok: false, reason: 'unsupported-format' };
    }

    const siteConfig = this.siteConfigCodec.normalize(value['siteConfig']);

    if (!siteConfig.ok) {
      return {
        ok: false,
        reason:
          siteConfig.reason === 'unsupported-schema'
            ? 'unsupported-site-schema'
            : 'invalid-site-config',
      };
    }

    return siteConfig;
  }

  createDownload(siteConfig: SiteConfig): { readonly fileName: string; readonly blob: Blob } {
    const fileName = `${this.createFileSlug(siteConfig.name)}.nexus.json`;

    return {
      fileName,
      blob: new Blob([this.serialize(siteConfig)], { type: 'application/json' }),
    };
  }

  async readFile(file: File): Promise<ProjectTransferDecodeResult> {
    if (file.size > MAX_PROJECT_FILE_SIZE) {
      return { ok: false, reason: 'file-too-large' };
    }

    try {
      return this.deserialize(await this.readFileAsText(file));
    } catch {
      return { ok: false, reason: 'file-read-error' };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('Project file did not contain text.'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('Project file could not be read.'));
      reader.onabort = () => reject(new Error('Project file read was aborted.'));
      reader.readAsText(file);
    });
  }

  private createFileSlug(name: string): string {
    const slug = name
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/gu, '');

    return slug || 'nexus-project';
  }

  private isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
