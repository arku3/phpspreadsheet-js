# PHP vs TS Parity Review (Detailed)

This directory contains a generated file map plus human-written deeper comparisons.

## Generated Maps
- `review/php-ts-parity/README.md`: index + counts + links.
- `review/php-ts-parity/modules/*.md`: per-PHP-module mapping table (PHP file -> TS file(s) if found).
- `review/php-ts-parity/lists/php-only.md`: PHP files with no TS match (heuristic).
- `review/php-ts-parity/lists/ts-only.md`: TS files with no PHP match (heuristic).
- `review/php-ts-parity/lists/ambiguous.md`: PHP files that mapped to multiple TS files.
- `review/php-ts-parity/lists/ts-to-php.md`: for each TS file, which PHP files mapped to it.

## Deep-Dive Notes
These are written reports comparing public APIs, major behaviors, and I/O coverage.
- `review/php-ts-parity/details/core.md`
- `review/php-ts-parity/details/style.md`
- `review/php-ts-parity/details/worksheet.md`
- `review/php-ts-parity/details/io-xlsx.md`
- `review/php-ts-parity/details/calculation.md`
- `review/php-ts-parity/details/chart.md`
- `review/php-ts-parity/details/shared-utils.md`

## Reading Guide
- Start with `review/php-ts-parity/README.md` to see scope.
- Use `review/php-ts-parity/modules/*.md` when you need a “where is this implemented?” lookup.
- Use the deep-dive notes for actionable parity gaps and next implementation targets.
