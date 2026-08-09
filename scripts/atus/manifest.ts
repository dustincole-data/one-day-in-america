/**
 * Pinned ATUS acquisition manifest.
 *
 * URLs, byte sizes and SHA-256s are the ones recorded in the ticket-02 provenance record
 * (`research/02-atus-source/findings.md`). BLS re-releases files without a per-file revision log,
 * so every fetch re-verifies against these hashes and refuses to continue on a mismatch.
 */

/** Years the project uses. 2020 is excluded (S6); 2025 does not carry the headline (S7). */
export const YEARS = [2019, 2023, 2024] as const;
export type Year = (typeof YEARS)[number];

/** Days in the diary-day period for each year — the divisor `D` in the §7.4 participant formula. */
export const DAYS_IN_YEAR: Record<Year, number> = { 2019: 365, 2023: 365, 2024: 366 };

export interface PinnedFile {
  /** Base name of the ZIP, e.g. `atusact-2024`. */
  readonly stem: string;
  readonly bytes: number;
  readonly sha256: string;
}

/**
 * bls.gov answers a bare `curl` with 403. It is bot management keyed on the header set, not an
 * access restriction — a browser-shaped header set (crucially including `Accept-Encoding`) gets 200.
 */
export const BLS_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

export const BASE_URL = 'https://www.bls.gov/tus/datafiles/';

/** Verified 2026-08-09: all nine re-fetched byte-for-byte identical to the ticket-02 record. */
export const PINNED: readonly PinnedFile[] = [
  { stem: 'atusresp-2019', bytes: 743_357, sha256: '821d2cf92596cc632bce8269425d0277f8a1010b357660da7c03b5c5341c4724' },
  { stem: 'atusact-2019', bytes: 3_237_508, sha256: '2d0d90b3ade5e1a1b5ab69ea37135fb0faabb5cfb6c8dc53a1795dfc21fc3682' },
  { stem: 'atussum-2019', bytes: 635_134, sha256: '4c5fd39c706a180e82b4a7fa28c8c3739c4bfd6704fd4759f507bd1de6a01627' },
  { stem: 'atusresp-2023', bytes: 655_043, sha256: '5b24084ffd4c618c14e096429f99f0efa87e1393d7902c6007f96dd8725ba90c' },
  { stem: 'atusact-2023', bytes: 2_655_513, sha256: 'c7f497f8ac91254b9ddf771f8de475dded5bc7ea39806a019e8cdee920989b33' },
  { stem: 'atussum-2023', bytes: 551_957, sha256: '681efef6c96c5d6758c19412c915b70556fdfd07a0fa7abc2f37d8e420ebca1e' },
  { stem: 'atusresp-2024', bytes: 517_204, sha256: '0e9a9b0061ab0aafa763c23d3a64f7487ae17d0a4594e6445c0f79b8ce74e085' },
  { stem: 'atusact-2024', bytes: 2_241_574, sha256: 'b9d4a06482f6ac3a248fee87740537df13b9129ceb799f0d098fb27886153d2a' },
  { stem: 'atussum-2024', bytes: 463_411, sha256: '25e070308c103946b7e1f7368526ca494373e35034f75cbdfa8c21c82cafd4e2' },
];
