# Shared/Utils Parity (PhpSpreadsheet vs TS)

Scope of this note:
- PHP side: `php-src/src/PhpSpreadsheet/Shared/*` (and `php-src/src/PhpSpreadsheet/Shared/Trend/*`).
- TS side: only utilities that currently live in `src/utils/*`, `src/shared/*`, `src/common/*` (plus any “shared-ish” helpers that exist elsewhere but substitute for PHP Shared helpers).

This document is a parity map, not a feature request list: it calls out what exists, what is missing, and why the missing pieces matter (or do not) for current XLSX support vs future XLS support.

## High-level mapping (major helpers)

| PHP (PhpSpreadsheet) | TS (phpspreadsheet-js) | Parity status | Notes |
| --- | --- | --- | --- |
| Coordinate helpers (not in PHP Shared; in `PhpSpreadsheet\Cell\Coordinate`) | `src/utils/coordinate.ts` | Partial | TS implements core A1 conversions and some range helpers; behaviors differ on invalid input. |
| `php-src/src/PhpSpreadsheet/Shared/StringHelper.php` | `src/utils/string-helper.ts` | Partial | TS only covers OOXML control-character escaping + a simplified `formatNumber`. Many PHP StringHelper responsibilities are absent. |
| `php-src/src/PhpSpreadsheet/Shared/PasswordHasher.php` | `src/shared/password-hasher.ts` | Mostly equivalent | Core algorithm and hashing loop match conceptually; TS depends on Node crypto availability for optional algorithms. |
| `php-src/src/PhpSpreadsheet/Shared/Date.php` + `php-src/src/PhpSpreadsheet/Shared/TimeZone.php` | No dedicated module; logic scattered | Missing as a shared utility | TS has multiple partial Excel-date conversions, but no central “Excel date system” utility (1900/1904, leap-year bug, timezone handling, format detection). |
| PHP HashTable equivalents (used throughout writers) | `src/common/hash-table.ts` | Present (basic) | TS implements a de-duping HashTable keyed by `getHashCode()`. |

## Detailed comparisons

### Coordinate / Addressing

PHP reference:
- Coordinate helpers are primarily in `php-src/src/PhpSpreadsheet/Cell/Coordinate.php` (not under `Shared/`, but they serve the “shared utilities” role across the library).

TS implementation:
- `src/utils/coordinate.ts`

What TS currently covers:
- Column <-> index conversion (`columnIndexFromString`, `stringFromColumnIndex`).
- A1 parsing helpers (`indexesFromString`, `coordinateFromString`, `stringFromCoordinate`).
- Range-ish helpers (`coordinateIsRange`, `splitRange`, `rangeBoundaries`).
- Union/intersection resolution: `resolveUnionAndIntersection` (expands ranges to concrete cell refs and intersects sets).

Parity gaps / behavior differences:
- Error handling: `Coordinate.indexesFromString()` returns `[1, 1]` on invalid input in `src/utils/coordinate.ts`, whereas PHP generally throws for invalid coordinates (or otherwise signals invalid input). This matters because it can silently “default to A1” and produce incorrect output without an obvious error.
- Intersection/union semantics: TS expands ranges into explicit cell references for intersection, which can be extremely expensive on large ranges (e.g., `A1:XFD1048576`). PHP’s logic is designed for Excel semantics and avoids fully enumerating massive ranges.

XLSX impact:
- XLSX writer usages (examples): `src/io/xlsx/worksheet.ts` uses `Coordinate.resolveUnionAndIntersection()` for conditional formatting `sqref`.
- For typical ranges, current TS coverage is sufficient, but the “expand everything” approach can become a performance trap in real spreadsheets.

### StringHelper

PHP reference:
- `php-src/src/PhpSpreadsheet/Shared/StringHelper.php`

TS implementation:
- `src/utils/string-helper.ts`
- Used directly by the XLSX shared strings writer: `src/io/xlsx/string-table.ts` calls `controlCharacterPHP2OOXML()`.

What PHP StringHelper provides (broadly):
- OOXML control character escape/unescape (`controlCharacterPHP2OOXML`, `controlCharacterOOXML2PHP`).
- UTF-8 sanitization checks (`sanitizeUTF8`, `isUTF8`).
- Encoding conversion helpers (`convertEncoding`) and helpers for BIFF8/XLS string packing (`UTF8toBIFF8UnicodeShort/Long`).
- Locale-aware separators and currency configuration (`getDecimalSeparator`, `getThousandsSeparator`, `getCurrencyCode`, `setLocale`).
- Case conversion, substring, character counting (incl. DBCS width), SYLK conversion.

What TS currently provides:
- `controlCharacterPHP2OOXML(textValue: string): string` in `src/utils/string-helper.ts`.
- `containsControlCharacters(textValue: string): boolean`.
- A simplified `formatNumber(numericValue)` which returns `'0'` for null/NaN.

Parity gaps:
- Missing OOXML unescape (`controlCharacterOOXML2PHP`) equivalent.
- Missing UTF-8 sanitization / validation equivalent (`sanitizeUTF8`, `isUTF8`).
- Missing locale-aware separators (decimal/thousands/currency) and locale management.
- Missing BIFF8/XLS encoding and binary string packing helpers.
- Missing SYLK conversion and most general-purpose string helpers.

XLSX impact:
- The most critical piece for XLSX writing is control character escaping, because shared strings (`xl/sharedStrings.xml`) must be valid XML and must follow Excel’s `_xHHHH_` control escape convention. TS does implement this via `src/utils/string-helper.ts` and uses it in `src/io/xlsx/string-table.ts`.
- XLSX reading: TS currently decodes basic XML entities in `src/io/xlsx-reader.ts` (`decodeXmlEntities`), but does not appear to perform OOXML control-character *unescaping* back to raw control characters.

XLS impact (future):
- XLS requires substantial encoding + BIFF string packing support from `StringHelper` (e.g., `UTF8toBIFF8UnicodeShort/Long`) and code page handling; TS does not have these.

### PasswordHasher

PHP reference:
- `php-src/src/PhpSpreadsheet/Shared/PasswordHasher.php`

TS implementation:
- `src/shared/password-hasher.ts`

Parity status:
- The overall structure matches:
  - A “default” legacy Excel hash (`defaultHashPassword`) returning an uppercase hex verifier.
  - An ISO/OOXML hashing path (`hashPassword`) taking `algorithm`, `salt` (base64), and `spinCount`.

Notable differences / risks:
- Algorithm availability: TS uses Node’s `crypto.createHash` in `src/shared/password-hasher.ts`. Some algorithms (e.g. `md2`, `whirlpool`) may not be enabled in a given Node/OpenSSL build; PHP’s `hash()` availability differs by environment too, but the failure modes are not identical.
- Input encoding: PHP explicitly converts password to `UCS-2LE` via mbstring (`mb_convert_encoding`) in `php-src/src/PhpSpreadsheet/Shared/PasswordHasher.php`; TS uses `Buffer.from(password, 'utf16le')` which is the intended equivalent.

XLSX impact:
- Relevant for worksheet/workbook protection and write-protection metadata. If the core writer emits these features, this helper is needed; if protection is not yet implemented, it’s still good parity coverage.

### Date / TimeZone

PHP reference:
- `php-src/src/PhpSpreadsheet/Shared/Date.php`
- `php-src/src/PhpSpreadsheet/Shared/TimeZone.php`

TS equivalents (scattered, not a single shared helper):
- Excel date conversion used for AutoFilter date grouping in `src/worksheet/auto-filter.ts` (see `#excelDateToJsDate` / `#dateToExcelValue`).
- Basic date formatting for number formats in `src/style/number-formatter.ts` (uses a fixed JS Date epoch of `1899-12-30`).
- Calculation functions use a different serial conversion approach in `src/calculation/functions/datetime.ts` (uses a fixed offset constant `EXCEL_EPOCH_OFFSET = 25569`).

Parity gaps (structural):
- No dedicated `Shared/Date` equivalent in TS under `src/utils/*`/`src/shared/*`.
- No concept of Excel calendar selection (1900 vs 1904) like `Date::setExcelCalendar()` / `Date::getExcelCalendar()` in `php-src/src/PhpSpreadsheet/Shared/Date.php`.
- Inconsistent 1900 leap-year bug handling across TS code paths:
  - `src/worksheet/auto-filter.ts` explicitly adjusts serials around 60 (the Excel 1900 leap-year bug).
  - `src/style/number-formatter.ts` does not apply the “>=60 subtract 1” correction.
  - `src/calculation/functions/datetime.ts` uses a Unix-epoch offset approach and doesn’t reflect the same correction.
- No TS equivalent of `Date::isDateTimeFormatCode()` (PHP implements robust format-code detection for date/time formats in `php-src/src/PhpSpreadsheet/Shared/Date.php`).
- No TS equivalent of `Shared\TimeZone::getTimeZoneAdjustment()` (and no centralized timezone policy).

XLSX impact:
- XLSX files store dates as numbers plus a number format that indicates date/time display. Without consistent date-serial conversion and format detection, TS risks:
  - Writing date serial values that don’t match Excel expectations in edge cases.
  - Formatting/AutoFilter behavior inconsistencies (AutoFilter grouping vs displayed formatting).
  - Differences between calculation results (DATE/TODAY/NOW) and writer formatting.

XLS impact (future):
- XLS date systems (1900 vs 1904) and BIFF date handling depend heavily on a correct `Shared\Date` implementation.

### HashTable / caching infrastructure

PHP reference:
- PhpSpreadsheet uses hash-based collections across styles/writer parts (not strictly under `Shared/`, but it is a “shared infrastructure” concept).

TS implementation:
- `src/common/hash-table.ts`
- Used by the XLSX writer to dedupe styles and related structures: `src/io/xlsx-writer.ts`.

Parity status:
- Present and functional for the current TS architecture.
- TS’s `HashTable<T>` expects `getHashCode(): string` and stores items in insertion order, keyed by a `Map`.

Gaps:
- PHP has more nuanced collections and sometimes stable index semantics across serialization/deserialization; TS currently implements only the minimum needed for writing.

## Major PHP Shared features that are missing in TS

The following PHP `Shared/*` modules have no clear equivalent under `src/utils/*`, `src/shared/*`, or `src/common/*`.

### OLE container support (critical for XLS)

PHP reference:
- `php-src/src/PhpSpreadsheet/Shared/OLE.php`
- `php-src/src/PhpSpreadsheet/Shared/OLERead.php`
- `php-src/src/PhpSpreadsheet/Shared/OLE/*`

TS status:
- No OLE reader/writer under `src/utils/*`, `src/shared/*`, or `src/common/*`.

Why it matters:
- XLS (BIFF) is a Compound File Binary (OLE) container; without OLE support, TS cannot implement a real XLS reader/writer.
- XLSX does not require OLE.

### XLS shared helpers (mostly XLS-only)

PHP reference:
- `php-src/src/PhpSpreadsheet/Shared/Xls.php` (pixel/row/col sizing, anchor conversion for drawings)
- `php-src/src/PhpSpreadsheet/Shared/CodePage.php` (code page mapping)
- `php-src/src/PhpSpreadsheet/Shared/Font.php` (autosize + font metrics + charset mapping)
- `php-src/src/PhpSpreadsheet/Shared/Escher.php` and subtypes (BIFF drawing records)

TS status:
- No equivalents in `src/utils/*` / `src/shared/*` / `src/common/*`.
- Some *XLSX-only* drawing-related conversions exist inline (see `XlsxReader.#EMU_PER_PIXEL` and EMU->px conversions in `src/io/xlsx-reader.ts`).

Why it matters:
- For XLS: Code pages, BIFF font records, Escher drawing records, and anchor calculations are essential.
- For XLSX (current focus):
  - Many of these are not required, because XLSX uses XML + DrawingML rather than BIFF + Escher.
  - However, “pixel/EMU conversions” are still relevant; TS currently duplicates minimal constants (`9525 EMU per pixel`) rather than providing a central shared helper like `php-src/src/PhpSpreadsheet/Shared/Drawing.php`.

### Trend / regression helpers (trendlines)

PHP reference:
- `php-src/src/PhpSpreadsheet/Shared/Trend/Trend.php`
- `php-src/src/PhpSpreadsheet/Shared/Trend/*BestFit.php`

TS status:
- No trend/regression helpers found under `src/utils/*`, `src/shared/*`, or `src/common/*`.

Why it matters:
- These are used for best-fit calculations and can support chart trendlines or statistical calculations.
- Current XLSX writer support for charts appears to focus on emitting chart XML (`src/io/xlsx-writer.ts` and `src/io/xlsx/charts.ts`) rather than computing trendlines. If trendlines are not implemented in TS charts yet, missing Trend is not blocking basic XLSX read/write.
- For future: implementing parity for chart trendlines or statistical best-fit functions would require bringing this feature set over.

### File/temp helpers and XMLWriter wrapper

PHP reference:
- `php-src/src/PhpSpreadsheet/Shared/File.php` (temp dir selection, zip member checks, `realpath` normalization)
- `php-src/src/PhpSpreadsheet/Shared/XMLWriter.php` (memory/disk-backed writer wrapper)

TS status:
- TS uses Node primitives directly:
  - ZIP writing: `archiver` in `src/io/xlsx-writer.ts`.
  - ZIP reading: `unzipper` in `src/io/xlsx-reader.ts`.
  - XML building: `xmlbuilder2` in `src/io/xlsx/*`.
- No equivalent shared abstraction for temporary storage selection, “zip:// member exists” checks, or a streaming XML writer wrapper.

Why it matters:
- For current XLSX, TS does not need a `Shared\XMLWriter` clone because it already uses `xmlbuilder2` to produce XML strings.
- For large files, PHP’s disk-backed `XMLWriter` reduces memory pressure; TS currently tends to build whole XML strings in memory.

## What’s missing that matters for XLSX now vs XLS later

### Matters for current XLSX support

Highest impact gaps:
- Centralized Excel date serial handling: missing `Shared\Date` equivalent leads to inconsistent leap-year bug handling and epoch assumptions across `src/worksheet/auto-filter.ts`, `src/style/number-formatter.ts`, and `src/calculation/functions/datetime.ts`.
- StringHelper completeness for OOXML round-trip: writing escapes exists (`src/utils/string-helper.ts`), but reading back (unescape) is not clearly implemented.
- Centralized drawing unit conversions: PHP’s `php-src/src/PhpSpreadsheet/Shared/Drawing.php` is a single place for EMU/pixel/points/angle conversions; TS duplicates the EMU constant in `src/io/xlsx-reader.ts`.

Lower impact (for XLSX only):
- `Shared\File` and `Shared\XMLWriter` abstractions; TS has working ZIP + XML generation, though it may be less memory-efficient.

### Mostly future XLS (BIFF) support

Blocking gaps for XLS:
- OLE container (`php-src/src/PhpSpreadsheet/Shared/OLE*.php`) has no TS equivalent.
- BIFF string encoding helpers (`StringHelper` BIFF8 methods) + CodePage mapping (`php-src/src/PhpSpreadsheet/Shared/CodePage.php`).
- BIFF drawing infrastructure (Escher) and Xls anchor/sizing helpers (`php-src/src/PhpSpreadsheet/Shared/Escher*`, `php-src/src/PhpSpreadsheet/Shared/Xls.php`).

Optional / later:
- Trendline regression (`php-src/src/PhpSpreadsheet/Shared/Trend/*`) unless chart trendlines/statistical parity becomes a goal.

## Quick inventory (PHP Shared files vs TS equivalents)

PHP `Shared/*` (not exhaustive) with TS status:
- `php-src/src/PhpSpreadsheet/Shared/StringHelper.php` -> partial: `src/utils/string-helper.ts`.
- `php-src/src/PhpSpreadsheet/Shared/PasswordHasher.php` -> present: `src/shared/password-hasher.ts`.
- `php-src/src/PhpSpreadsheet/Shared/Date.php` -> missing shared module; partial scattered implementations: `src/worksheet/auto-filter.ts`, `src/style/number-formatter.ts`, `src/calculation/functions/datetime.ts`.
- `php-src/src/PhpSpreadsheet/Shared/TimeZone.php` -> missing.
- `php-src/src/PhpSpreadsheet/Shared/Drawing.php` -> no shared module; partial constant usage: `src/io/xlsx-reader.ts`.
- `php-src/src/PhpSpreadsheet/Shared/File.php` -> no shared module.
- `php-src/src/PhpSpreadsheet/Shared/XMLWriter.php` -> no shared module; replaced by `xmlbuilder2` usage in `src/io/xlsx/*`.
- `php-src/src/PhpSpreadsheet/Shared/Xls.php` -> missing.
- `php-src/src/PhpSpreadsheet/Shared/OLE.php`, `php-src/src/PhpSpreadsheet/Shared/OLERead.php`, `php-src/src/PhpSpreadsheet/Shared/OLE/*` -> missing.
- `php-src/src/PhpSpreadsheet/Shared/CodePage.php` -> missing.
- `php-src/src/PhpSpreadsheet/Shared/Font.php` -> missing as shared; TS has style font objects elsewhere, but not PHP’s autosize/metrics helpers.
- `php-src/src/PhpSpreadsheet/Shared/Escher.php` + `php-src/src/PhpSpreadsheet/Shared/Escher/*` -> missing.
- `php-src/src/PhpSpreadsheet/Shared/Trend/*` -> missing.
