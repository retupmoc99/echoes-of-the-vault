import { describe, expect, it } from 'vitest';
import { scaleFor } from './uiScale';

describe('scaleFor', () => {
  it('leaves phone-sized screens alone, upright or sideways', () => {
    expect(scaleFor(320, 640)).toBe(1);
    expect(scaleFor(390, 844)).toBe(1);
    expect(scaleFor(844, 390)).toBe(1);
  });
  it('scales wide upright screens, limited by height', () => {
    expect(scaleFor(600, 900)).toBe(1.25);
    expect(scaleFor(720, 960)).toBe(1.3);
    expect(scaleFor(900, 1100)).toBe(1.5);
  });
  it('barely scales wide sideways screens and never goes past the cap', () => {
    expect(scaleFor(960, 600)).toBe(1);
    expect(scaleFor(2000, 3000)).toBe(1.75);
  });
});
