import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { MediaInputComponent } from './media-input.component';

describe('MediaInputComponent', () => {
  it('rejects an oversized encoded image pasted into the URL field', () => {
    const fixture = TestBed.createComponent(MediaInputComponent);
    const component = fixture.componentInstance;
    const emittedSources: string[] = [];
    const input = document.createElement('input');
    input.value = `DATA:IMAGE/PNG;BASE64,${'A'.repeat(500_001)}`;
    component.srcChange.subscribe((source) => emittedSources.push(source));

    component.updateUrl({ target: input } as unknown as Event);

    expect(emittedSources).toEqual([]);
    expect(component.error()).toContain('слишком большое');
  });

  it('rejects an encoded image that cannot safely fit in local project storage', async () => {
    const fixture = TestBed.createComponent(MediaInputComponent);
    const component = fixture.componentInstance;
    const emittedSources: string[] = [];
    const oversizedDataUrl = `data:image/webp;base64,${'A'.repeat(4_500_000)}`;
    const componentWithResize = component as unknown as {
      resizeImage(file: File): Promise<string>;
    };
    vi.spyOn(componentWithResize, 'resizeImage').mockResolvedValue(oversizedDataUrl);
    component.srcChange.subscribe((source) => emittedSources.push(source));
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['image'], 'large.jpg', { type: 'image/jpeg' })],
    });

    await component.uploadFile({ target: input } as unknown as Event);

    expect(emittedSources).toEqual([]);
    expect(component.error()).toBe(
      'После оптимизации изображение слишком большое для локального проекта. Выберите файл меньшего размера.',
    );
  });
});
