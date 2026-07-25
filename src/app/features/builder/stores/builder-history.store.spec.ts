import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../data-access/default-site.config';
import type { SiteConfig } from '../domain/models';
import { BuilderHistoryStore } from './builder-history.store';

describe('BuilderHistoryStore', () => {
  let history: BuilderHistoryStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BuilderHistoryStore] });
    history = TestBed.inject(BuilderHistoryStore);
  });

  it('moves snapshots between undo and redo histories', () => {
    const configA = withName('A');
    const configB = withName('B');
    const configC = withName('C');

    history.record(configA);
    history.record(configB);

    expect(history.undo(configC)).toEqual(configB);
    expect(history.redo(configB)).toEqual(configC);
  });

  it('keeps only the latest 50 undo snapshots', () => {
    for (let index = 0; index < 51; index += 1) {
      history.record(withName(`Snapshot ${index}`));
    }

    expect(history.undoDepth()).toBe(50);
    expect(history.undo(withName('Current'))?.name).toBe('Snapshot 50');
  });
});

function withName(name: string): SiteConfig {
  return { ...DEFAULT_SITE_CONFIG, name };
}
