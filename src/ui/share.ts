/**
 * Daily Descent sharing: a short text result, sent through the phone's own
 * share sheet, or copied when there isn't one. Nothing leaves the phone
 * unless the player taps Share.
 */
import { CONTENT } from '../data';
import type { DailyResult } from '../engine';

export function dailyShareText(r: DailyResult): string {
  const omen = CONTENT.omens?.[r.omenId]?.name ?? 'No Omen';
  const warden = CONTENT.classes[r.classId]?.name ?? 'Warden';
  const outcome = r.result === 'victory' ? 'Escaped' : `Fell at depth ${r.depth}`;
  const path = '◆'.repeat(Math.min(r.depth, r.rows)) + '◇'.repeat(Math.max(0, r.rows - r.depth));
  return [`Echoes of the Vault · Daily ${r.day}`, `Omen: ${omen} · ${warden}`, `${outcome} · depth ${r.depth}/${r.rows} · ${r.turns} turns`, path].join('\n');
}

/** Share or copy. Resolves to what happened, so the button can say so. */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = `${location.origin}${location.pathname}`;
  try {
    if (navigator.share) {
      await navigator.share({ text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    // The player closed the share sheet, or the clipboard was refused.
    return 'failed';
  }
}
