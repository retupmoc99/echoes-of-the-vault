import { useEffect, useState } from 'react';

/**
 * Wide-screen scaling.
 *
 * The game is laid out for a phone (a column up to 480px wide). On wider
 * screens, such as a foldable's inner screen held upright, the whole game is
 * scaled up with CSS `zoom` so it fills the width instead of sitting in a
 * narrow strip. The scale is limited by the height too, so a screen never
 * has less room than DESIGN_HEIGHT, and sideways screens barely scale.
 *
 * Phone-sized screens (narrower than MIN_WIDTH) always get 1.
 */
const MIN_WIDTH = 520;
const DESIGN_WIDTH = 440;
const DESIGN_HEIGHT = 720;
const MAX_SCALE = 1.75;

export function scaleFor(width: number, height: number): number {
  if (width < MIN_WIDTH) return 1;
  const raw = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT, MAX_SCALE);
  // Whole steps of 0.05 keep text crisp and stop tiny resizes from jittering.
  return Math.max(1, Math.floor(raw * 20) / 20);
}

let current = 1;

/** The scale in use now. Divide screen coordinates by it to get layout pixels. */
export function uiScale(): number {
  return current;
}

/** Tracks the screen size and keeps the --ui-scale CSS variable up to date. */
export function useUiScale(): number {
  const measure = () => scaleFor(window.innerWidth, window.innerHeight);
  const [scale, setScale] = useState(measure);
  useEffect(() => {
    const update = () => setScale(measure());
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);
  // Set during render (it is idempotent) so the first paint is already right.
  current = scale;
  document.documentElement.style.setProperty('--ui-scale', String(scale));
  return scale;
}

/**
 * An element's box in layout pixels, for positioning things inside the scaled
 * layer. getBoundingClientRect() reports screen pixels, which are larger by
 * the scale.
 */
export function layoutRect(el: Element): DOMRect {
  const r = el.getBoundingClientRect();
  const s = current;
  return new DOMRect(r.x / s, r.y / s, r.width / s, r.height / s);
}
