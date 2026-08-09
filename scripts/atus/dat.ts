/**
 * Reading ATUS `.dat` files. They are comma-separated with a header row despite the extension,
 * 7-bit ASCII, CRLF (the last line of some files is bare LF). No quoting is used anywhere in the
 * files this project reads; quotes are stripped defensively.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RAW_DIR = join(process.cwd(), 'data', 'raw');
export const EXTRACT_DIR = join(process.cwd(), 'data', 'extract');

export interface Table {
  readonly columns: readonly string[];
  /** `rows[i][j]` is the value of `columns[j]` in row `i`. */
  readonly rows: readonly string[][];
  index(column: string): number;
}

function clean(s: string): string {
  const t = s.trim();
  return t.length > 1 && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t;
}

export function readDat(fileStem: string): Table {
  const text = readFileSync(join(RAW_DIR, `${fileStem}.dat`), 'latin1');
  const lines = text.split('\n');
  const columns = clean(lines[0]).split(',').map(clean);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].endsWith('\r') ? lines[i].slice(0, -1) : lines[i];
    if (line.length === 0) continue;
    rows.push(line.split(','));
  }
  const lookup = new Map(columns.map((c, i) => [c, i]));
  return {
    columns,
    rows,
    index(column: string): number {
      const i = lookup.get(column);
      if (i === undefined) throw new Error(`${fileStem}: no column ${column} (have ${columns.length})`);
      return i;
    },
  };
}

/** `HH:MM:SS` wall clock → minutes since midnight. */
export function clockToMinutes(hhmmss: string): number {
  const h = Number(hhmmss.slice(0, 2));
  const m = Number(hhmmss.slice(3, 5));
  if (!Number.isInteger(h) || !Number.isInteger(m)) throw new Error(`bad clock time ${hhmmss}`);
  return h * 60 + m;
}

/**
 * Minutes since the 4:00 a.m. diary-day origin (S2). The ATUS day runs 4 a.m. → 4 a.m., so this is
 * the file's native axis: episode 1 of every diary day starts at 0 and the day closes at 1440.
 */
export function minutesSince4am(hhmmss: string): number {
  return (clockToMinutes(hhmmss) - 240 + 1440) % 1440;
}
