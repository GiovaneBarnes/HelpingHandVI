import { describe, it, expect } from 'vitest';
import tailwindConfig from './tailwind.config.js';

describe('tailwind.config.js', () => {
  it('exports a valid Tailwind configuration', () => {
    expect(tailwindConfig).toBeDefined();
    expect(typeof tailwindConfig).toBe('object');
  });

  it('includes content paths', () => {
    expect(tailwindConfig.content).toBeDefined();
    expect(Array.isArray(tailwindConfig.content)).toBe(true);
    expect(tailwindConfig.content).toContain('./index.html');
    expect(tailwindConfig.content).toContain('./src/**/*.{js,ts,jsx,tsx}');
  });

  it('includes theme configuration', () => {
    expect(tailwindConfig.theme).toBeDefined();
    expect(tailwindConfig.theme).toHaveProperty('extend');
    expect(tailwindConfig.theme.extend).toEqual({});
  });

  it('includes plugins array', () => {
    expect(tailwindConfig.plugins).toBeDefined();
    expect(Array.isArray(tailwindConfig.plugins)).toBe(true);
    expect(tailwindConfig.plugins).toEqual([]);
  });
});