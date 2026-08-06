export type SiteConfigV4ValidationErrorCode =
  | 'json-envelope-too-large'
  | 'invalid-json'
  | 'json-depth-exceeded'
  | 'unsupported-schema'
  | 'invalid-site-config'
  | 'canonical-document-too-large';

export type SiteConfigV4ValidationResult =
  | {
      readonly ok: true;
      readonly value: Readonly<Record<string, unknown>>;
      readonly canonicalJson: string;
      readonly canonicalBytes: number;
    }
  | { readonly ok: false; readonly code: SiteConfigV4ValidationErrorCode };
