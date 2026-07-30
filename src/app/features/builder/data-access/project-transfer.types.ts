import type { SiteConfig } from '../domain/models';

export interface NexusProjectExport {
  readonly format: 'nexus-project';
  readonly formatVersion: 1;
  readonly exportedAt: string;
  readonly siteConfig: SiteConfig;
}

export type ProjectTransferDecodeFailureReason =
  | 'file-too-large'
  | 'file-read-error'
  | 'invalid-json'
  | 'invalid-format'
  | 'unsupported-format'
  | 'invalid-site-config'
  | 'unsupported-site-schema';

export type ProjectTransferDecodeResult =
  | { readonly ok: true; readonly value: SiteConfig }
  | {
      readonly ok: false;
      readonly reason: ProjectTransferDecodeFailureReason;
    };
