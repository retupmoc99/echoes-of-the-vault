/**
 * Optional art. Code-drawn visuals are the default; real images replace them
 * only when they exist.
 *
 * - `npm run art` writes the list of available images (assets.generated.ts),
 *   so the game never requests files that aren't there.
 * - A content entry's `image` field can point at a specific file instead
 *   (path relative to public/assets/).
 * - If an image fails to load anyway, <ArtImg> falls back to the drawn version.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AVAILABLE_ART } from '../data/assets.generated';

export type ArtFolder = 'cards' | 'enemies' | 'relics' | 'backgrounds' | 'ui';

const available = new Set(AVAILABLE_ART);
const BASE = `${import.meta.env.BASE_URL}assets/`;

export function artUrl(folder: ArtFolder, id: string, explicit?: string): string | undefined {
  if (explicit) return BASE + explicit;
  return available.has(`${folder}/${id}`) ? `${BASE}${folder}/${id}.webp` : undefined;
}

interface ArtImgProps {
  src: string | undefined;
  className?: string;
  size?: number;
  /** Shown when there is no image, or it fails to load. */
  fallback: ReactNode;
}

export function ArtImg({ src, className, size, fallback }: ArtImgProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return <img className={className} src={src} width={size} height={size} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

/**
 * Sets the screen's background art: the first key with art wins; otherwise
 * the CSS gradient shows.
 *
 * The image is drawn by a fixed layer on <body> (see `.has-screen-art` in
 * styles.css), not by the screen itself. That way it fills wide screens
 * beyond the 480px game column, and doesn't jump when combat shakes.
 */
export function useScreenBackground(...keys: string[]): void {
  const url = keys.map((k) => artUrl('backgrounds', k)).find(Boolean);
  useEffect(() => {
    if (!url) return;
    const body = document.body;
    body.style.setProperty('--screen-art', `url("${url}")`);
    body.classList.add('has-screen-art');
    return () => {
      body.classList.remove('has-screen-art');
      body.style.removeProperty('--screen-art');
    };
  }, [url]);
}
