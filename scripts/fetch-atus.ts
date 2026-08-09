/**
 * Fetch the pinned ATUS files into `data/raw/` and refuse anything that is not byte-identical to the
 * ticket-02 provenance record.
 *
 * BLS re-releases files without a per-file revision log, so "it downloaded fine" is not evidence
 * that the bytes are the ones the analysis was validated against. A hash mismatch is a hard stop:
 * it means the source moved and the provenance record needs a new pass, not that the script needs a
 * retry.
 *
 *   npm run data:fetch
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { BASE_URL, BLS_HEADERS, PINNED, type PinnedFile } from './atus/manifest.ts';
import { RAW_DIR } from './atus/dat.ts';

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function acquire(file: PinnedFile): Promise<Uint8Array> {
  const zipPath = join(RAW_DIR, `${file.stem}.zip`);
  if (existsSync(zipPath)) {
    const cached = readFileSync(zipPath);
    if (sha256(cached) === file.sha256) return cached;
    console.log(`  ${file.stem}.zip on disk does not match the pinned hash — re-fetching`);
  }
  const res = await fetch(`${BASE_URL}${file.stem}.zip`, { headers: BLS_HEADERS });
  if (!res.ok) throw new Error(`${file.stem}.zip: HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  writeFileSync(zipPath, bytes);
  return bytes;
}

async function main(): Promise<void> {
  mkdirSync(RAW_DIR, { recursive: true });
  for (const file of PINNED) {
    const bytes = await acquire(file);
    const digest = sha256(bytes);
    if (bytes.byteLength !== file.bytes || digest !== file.sha256) {
      throw new Error(
        `${file.stem}.zip does not match the pinned provenance record.\n` +
          `  expected ${file.bytes} bytes, sha256 ${file.sha256}\n` +
          `  got      ${bytes.byteLength} bytes, sha256 ${digest}\n` +
          `BLS has re-released this file. Re-run the ticket-02 source pass before trusting it.`,
      );
    }
    for (const [name, content] of Object.entries(unzipSync(bytes))) {
      if (name.endsWith('.dat') || name.endsWith('_info.txt')) {
        writeFileSync(join(RAW_DIR, name), content);
      }
    }
    console.log(`  ok  ${file.stem}.zip  ${file.bytes.toLocaleString()} bytes  sha256 verified`);
  }
  console.log(`\n${PINNED.length} files verified against the ticket-02 record → ${RAW_DIR}`);
}

await main();
