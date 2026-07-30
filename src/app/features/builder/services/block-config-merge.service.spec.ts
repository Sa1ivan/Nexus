import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { LinkConfig } from '../domain/models';
import { BlockConfigMergeService } from './block-config-merge.service';

describe('BlockConfigMergeService', () => {
  let service: BlockConfigMergeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlockConfigMergeService);
  });

  it('removes a customized button appearance when the update is null', () => {
    const link: LinkConfig = {
      id: 'cta',
      label: 'Связаться',
      target: '#contact',
      kind: 'anchor',
      openInNewTab: false,
      appearance: {
        variant: 'filled',
        backgroundColor: '#123456',
        textColor: '#ffffff',
        borderColor: '#123456',
      },
    };

    const updated = service.mergeLink(link, { appearance: null });

    expect(updated.appearance).toBeUndefined();
    expect(updated).not.toBe(link);
  });
});
