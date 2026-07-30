import type { SiteConfig } from '../domain/models';

export type SiteConfigDecodeResult =
  | { readonly ok: true; readonly value: SiteConfig }
  | {
      readonly ok: false;
      readonly reason: 'invalid-json' | 'invalid-shape' | 'unsupported-schema';
    };
