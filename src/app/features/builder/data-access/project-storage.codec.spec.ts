import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SITE_CONFIG } from './default-site.config';
import { ProjectStorageCodec } from './project-storage.codec';

describe('ProjectStorageCodec', () => {
  let codec: ProjectStorageCodec;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    codec = TestBed.inject(ProjectStorageCodec);
  });

  it('returns an empty state for invalid JSON', () => {
    expect(codec.decode('{')).toEqual({
      projects: [],
      leads: [],
      activeProjectId: null,
    });
  });

  it('drops a project whose draft cannot be normalized', () => {
    const result = codec.decode(
      JSON.stringify({
        projects: [{ id: 'broken', draft: { schemaVersion: 999 } }],
        leads: [],
        activeProjectId: 'broken',
      }),
    );

    expect(result.projects).toEqual([]);
    expect(result.activeProjectId).toBeNull();
  });

  it('returns an empty state when normalization rejects valid JSON data', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Page fixture is missing.');
    }

    const serialized = JSON.stringify({
      projects: [
        {
          id: 'broken-map',
          draft: {
            ...DEFAULT_SITE_CONFIG,
            pages: [
              {
                ...page,
                blocks: [
                  ...page.blocks,
                  {
                    id: 'footer',
                    anchor: 'footer',
                    type: 'siteFooter',
                    map: {
                      address: '\ud800',
                      embedUrl: 'https://maps.example.com',
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
      leads: [],
      activeProjectId: 'broken-map',
    });

    expect(codec.decode(serialized)).toEqual({
      projects: [],
      leads: [],
      activeProjectId: null,
    });
  });
});
