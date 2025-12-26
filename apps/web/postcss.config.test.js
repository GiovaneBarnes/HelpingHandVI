import { describe, it, expect } from 'vitest';
import postcssConfig from './postcss.config.js';

describe('postcss.config.js', () => {
  it('exports a valid PostCSS configuration', () => {
    expect(postcssConfig).toBeDefined();
    expect(typeof postcssConfig).toBe('object');
  });

  it('includes tailwindcss plugin', () => {
    expect(postcssConfig.plugins).toBeDefined();
    expect(postcssConfig.plugins).toHaveProperty('tailwindcss');
    expect(postcssConfig.plugins.tailwindcss).toEqual({});
  });

  it('includes autoprefixer plugin', () => {
    expect(postcssConfig.plugins).toHaveProperty('autoprefixer');
    expect(postcssConfig.plugins.autoprefixer).toEqual({});
  });
});