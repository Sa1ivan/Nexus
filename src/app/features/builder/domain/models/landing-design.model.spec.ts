import { describe, expect, it } from 'vitest';

import {
  getLandingAccentRgb,
  getLandingAccentValue,
  getLandingFontFamily,
  getReadableTextColor,
  parseLandingRgbColor,
} from './landing-design.model';

describe('landing design tokens', () => {
  it('normalizes an RGB input to a color that can be persisted and used by native color inputs', () => {
    const color = parseLandingRgbColor(' rgb(12, 34, 56) ');

    expect(color).toBe('#0c2238');
    expect(color === null ? null : getLandingAccentValue(color)).toBe('#0c2238');
    expect(color === null ? null : getLandingAccentRgb(color)).toEqual({
      red: 12,
      green: 34,
      blue: 56,
    });
  });

  it.each([
    'rgb(-1, 20, 30)',
    'rgb(0, 20, 256)',
    'rgb(0.5, 20, 30)',
    'rgb(0, 20)',
    '#12345',
    'not-a-color',
  ])('rejects malformed RGB input %s', (value) => {
    expect(parseLandingRgbColor(value)).toBeNull();
  });

  it('exposes additional system font stacks', () => {
    expect(getLandingFontFamily('geometric')).toContain('Avenir Next');
    expect(getLandingFontFamily('humanist')).toContain('Optima');
    expect(getLandingFontFamily('mono')).toContain('SFMono-Regular');
  });

  it.each([
    ['#000', '#ffffff'],
    ['rgb(0, 0, 0)', '#ffffff'],
    ['black', '#ffffff'],
    ['#fff', '#0b1020'],
    ['rgb(255, 255, 255)', '#0b1020'],
    ['white', '#0b1020'],
  ] as const)('keeps readable contrast for persisted CSS color %s', (background, expected) => {
    expect(getReadableTextColor(background)).toBe(expected);
  });
});
