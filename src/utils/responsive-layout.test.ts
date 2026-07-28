import { describe, expect, it } from 'vitest';
import { getResponsiveLayout } from './responsive-layout.js';

describe('responsive layout', () => {
  it.each([
    [140, 40, 'wide'],
    [110, 26, 'wide'],
    [100, 30, 'medium'],
    [76, 20, 'medium'],
    [75, 30, 'narrow'],
    [120, 18, 'narrow']
  ] as const)('maps %sx%s to %s', (columns, rows, expected) => {
    expect(getResponsiveLayout(columns, rows)).toBe(expected);
  });
});
