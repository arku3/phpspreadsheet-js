# PHP vs TS Parity Report (File Map)

Generated: 2026-01-31T10:49:33.130Z

This is a file-by-file *mapping* report. It pairs PHP PhpSpreadsheet files under `php-src/src/PhpSpreadsheet/` with likely TypeScript counterparts under `src/` based on path/name heuristics and a small special-case table.

It does not prove behavioral parity; it is meant to be the starting point for deeper audits and to surface missing/ambiguous mappings.

## Totals

- PHP files: 526
- TS files: 108
- PHP files with no TS match (by heuristic): 267
- PHP files with multiple TS matches (ambiguous): 11
- TS files with no PHP match (by heuristic): 33

## Modules

- _root: ./modules/_root-map.md (matched: 6, missing: 7, ambiguous: 0)
- Calculation: ./modules/calculation-map.md (matched: 181, missing: 25, ambiguous: 0)
- Cell: ./modules/cell-map.md (matched: 7, missing: 10, ambiguous: 0)
- Chart: ./modules/chart-map.md (matched: 1, missing: 17, ambiguous: 0)
- Collection: ./modules/collection-map.md (matched: 1, missing: 3, ambiguous: 0)
- Document: ./modules/document-map.md (matched: 2, missing: 0, ambiguous: 0)
- Helper: ./modules/helper-map.md (matched: 1, missing: 7, ambiguous: 0)
- Reader: ./modules/reader-map.md (matched: 17, missing: 52, ambiguous: 2)
- RichText: ./modules/richtext-map.md (matched: 4, missing: 0, ambiguous: 0)
- Shared: ./modules/shared-map.md (matched: 2, missing: 30, ambiguous: 0)
- Style: ./modules/style-map.md (matched: 13, missing: 41, ambiguous: 0)
- Worksheet: ./modules/worksheet-map.md (matched: 11, missing: 23, ambiguous: 0)
- Writer: ./modules/writer-map.md (matched: 2, missing: 52, ambiguous: 9)

## Lists

- PHP-only: ./lists/php-only.md
- TS-only: ./lists/ts-only.md
- Ambiguous: ./lists/ambiguous.md
- TS -> PHP coverage: ./lists/ts-to-php.md
