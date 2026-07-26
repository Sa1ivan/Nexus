import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SITE_CONFIG } from './default-site.config';
import {
  ProjectTransferService,
  type ProjectTransferDecodeFailureReason,
} from './project-transfer.service';

describe('ProjectTransferService', () => {
  let service: ProjectTransferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectTransferService);
  });

  it('round-trips a project export', () => {
    const serialized = service.serialize(DEFAULT_SITE_CONFIG, '2026-07-25T00:00:00.000Z');

    expect(serialized).toContain('\n  "format": "nexus-project"');
    expect(service.deserialize(serialized)).toEqual({
      ok: true,
      value: DEFAULT_SITE_CONFIG,
    });
  });

  it.each([
    ['invalid JSON', '{', 'invalid-json'],
    ['wrong format', JSON.stringify({ format: 'other' }), 'invalid-format'],
    [
      'future format',
      JSON.stringify({ format: 'nexus-project', formatVersion: 2 }),
      'unsupported-format',
    ],
  ] satisfies readonly [string, string, ProjectTransferDecodeFailureReason][])(
    'rejects %s',
    (_label, serialized, reason) => {
      expect(service.deserialize(serialized)).toEqual({ ok: false, reason });
    },
  );

  it('rejects an oversized serialized project before parsing it', () => {
    expect(service.deserialize('x'.repeat(5_000_001))).toEqual({
      ok: false,
      reason: 'file-too-large',
    });
  });

  it('rejects unsupported and invalid site config without returning partial data', () => {
    const unsupportedSchema = JSON.stringify({
      format: 'nexus-project',
      formatVersion: 1,
      siteConfig: { ...DEFAULT_SITE_CONFIG, schemaVersion: 999 },
    });
    const invalidSiteConfig = JSON.stringify({
      format: 'nexus-project',
      formatVersion: 1,
      siteConfig: { schemaVersion: DEFAULT_SITE_CONFIG.schemaVersion, pages: [] },
    });

    expect(service.deserialize(unsupportedSchema)).toEqual({
      ok: false,
      reason: 'unsupported-site-schema',
    });
    expect(service.deserialize(invalidSiteConfig)).toEqual({
      ok: false,
      reason: 'invalid-site-config',
    });
  });

  it('creates a lowercase project download with a versioned extension', async () => {
    const download = service.createDownload({
      ...DEFAULT_SITE_CONFIG,
      name: 'My Demo Site 2026',
    });

    expect(download.fileName).toBe('my-demo-site-2026.nexus.json');
    expect(download.blob.type).toBe('application/json');
    expect(service.deserialize(await readBlobAsText(download.blob))).toMatchObject({
      ok: true,
      value: { name: 'My Demo Site 2026' },
    });
  });

  it('reads a valid project file', async () => {
    const serialized = service.serialize(DEFAULT_SITE_CONFIG, '2026-07-25T00:00:00.000Z');
    const file = new File([serialized], 'project.nexus.json', {
      type: 'application/json',
    });

    await expect(service.readFile(file)).resolves.toEqual({
      ok: true,
      value: DEFAULT_SITE_CONFIG,
    });
  });

  it('rejects a file larger than 5 MB before reading it', async () => {
    const file = new File([new Uint8Array(5_000_001)], 'large.nexus.json');
    const readFile = vi.spyOn(FileReader.prototype, 'readAsText');

    await expect(service.readFile(file)).resolves.toEqual({
      ok: false,
      reason: 'file-too-large',
    });
    expect(readFile).not.toHaveBeenCalled();
  });
});

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Blob did not contain text.'));
    reader.onerror = () => reject(reader.error ?? new Error('Blob could not be read.'));
    reader.readAsText(blob);
  });
}
