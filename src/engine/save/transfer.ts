/**
 * Save codes: the whole save as one copy-pasteable string, for backups and
 * moving between devices.
 *
 *   EOTV1.<checksum>.<base64 of UTF-8 JSON>
 *
 * The checksum catches truncated or mangled pastes. Importing goes through
 * the same migrations as loading, so an old backup still restores into a
 * newer version of the game.
 */
import { MIGRATIONS, SAVE_VERSION, type SaveData } from './save';

const PREFIX = 'EOTV1';

/** FNV-1a: tiny, dependency-free, good enough to detect damaged text. */
function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function exportSave(save: SaveData): string {
  const json = JSON.stringify(save);
  return `${PREFIX}.${checksum(json)}.${toBase64(json)}`;
}

export type ImportResult = { ok: true; save: SaveData; migratedFrom?: number } | { ok: false; error: string };

export function importSave(code: string): ImportResult {
  // People paste with line breaks or spaces; ignore all whitespace.
  const parts = code.replace(/\s+/g, '').split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return { ok: false, error: 'That is not a save code.' };

  let json: string;
  try {
    json = fromBase64(parts[2]);
  } catch {
    return { ok: false, error: 'The code is damaged. Copy it again, all of it.' };
  }
  if (checksum(json) !== parts[1]) return { ok: false, error: 'The code is incomplete or altered. Copy it again, all of it.' };

  let data: { version?: unknown };
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'The code is damaged.' };
  }
  const version = typeof data.version === 'number' ? data.version : NaN;
  if (!Number.isInteger(version) || version < 1) return { ok: false, error: 'That save has no version.' };
  if (version > SAVE_VERSION) return { ok: false, error: 'That save is from a newer version of the game. Update first.' };

  let migrated: unknown = data;
  for (let v = version; v < SAVE_VERSION; v++) migrated = MIGRATIONS[v](migrated);
  const save = migrated as SaveData;
  if (!save.meta || !save.outpost || !Array.isArray(save.echoes)) return { ok: false, error: 'That save is missing pieces.' };
  return { ok: true, save, migratedFrom: version < SAVE_VERSION ? version : undefined };
}
