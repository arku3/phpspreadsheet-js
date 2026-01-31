# XLSX IO Parity (PhpSpreadsheet vs TS)

This document compares XLSX read/write support between PhpSpreadsheet (PHP) and this repository's TypeScript implementation.

Scope
- PHP baseline:
  - Reader entrypoint: `php-src/src/PhpSpreadsheet/Reader/Xlsx.php`
  - Writer entrypoint: `php-src/src/PhpSpreadsheet/Writer/Xlsx.php`
  - Writer parts: `php-src/src/PhpSpreadsheet/Writer/Xlsx/*`
- TS implementation:
  - Reader entrypoint: `src/io/xlsx-reader.ts`
  - Writer entrypoint: `src/io/xlsx-writer.ts`
  - Writer/reader parts: `src/io/xlsx/*`

Runtime note
- This project is Node/Bun-only. The XLSX reader/writer use Node APIs and Node-oriented libraries:
  - Reader: `unzipper` + `node:fs/promises` (`src/io/xlsx-reader.ts`)
  - Writer: `archiver` + `node:stream` + `node:fs` (`src/io/xlsx-writer.ts`)

For full file mapping tables, see `review/php-ts-parity/modules/reader-map.md` and `review/php-ts-parity/modules/writer-map.md`.

## High-level architecture mapping

### Reader

PHP
- `php-src/src/PhpSpreadsheet/Reader/Xlsx.php` is a full-featured reader: styles, shared strings, themes, worksheet features (tables, drawings, charts), and many edge cases.

TS
- `src/io/xlsx-reader.ts` is a single-file reader which:
  - opens the zip (`unzipper.Open.buffer`), and reads parts via regex-based parsing
  - parses styles via `src/io/xlsx/styles-reader.ts`
  - builds `Spreadsheet`/`Worksheet`/`Cell` structures in `src/core/*`

### Writer

PHP
- `php-src/src/PhpSpreadsheet/Writer/Xlsx.php` orchestrates a large set of writer parts (`php-src/src/PhpSpreadsheet/Writer/Xlsx/*`).

TS
- `src/io/xlsx-writer.ts` orchestrates a smaller set of writer parts under `src/io/xlsx/*`.
- Some PHP writer-part responsibilities are implemented directly inside `src/io/xlsx-writer.ts` (index allocation, rel id maps, media aggregation).

## Implemented parts (TS)

TS writer currently emits the following core package parts:
- `[Content_Types].xml`: `src/io/xlsx/content-types.ts`
- Root rels: `_rels/.rels` and workbook rels: `xl/_rels/workbook.xml.rels`: `src/io/xlsx/rels.ts`
- Workbook: `xl/workbook.xml`: `src/io/xlsx/workbook.ts`
- Worksheets: `xl/worksheets/sheetN.xml`: `src/io/xlsx/worksheet.ts`
- Styles: `xl/styles.xml`: `src/io/xlsx/styles.ts` (style dictionaries built in `src/io/xlsx-writer.ts`)
- Shared strings: `xl/sharedStrings.xml`: `src/io/xlsx/string-table.ts`
- Theme: `xl/theme/theme1.xml`: `src/io/xlsx/theme.ts`
- Doc props: `docProps/app.xml`, `docProps/core.xml`, `docProps/custom.xml`: `src/io/xlsx/doc-props.ts`

TS reader currently consumes the following major parts:
- Workbook rels + workbook + worksheets: `src/io/xlsx-reader.ts`
- Shared strings: `src/io/xlsx-reader.ts`
- Styles: `src/io/xlsx/styles-reader.ts` (invoked by `src/io/xlsx-reader.ts`)

## Feature matrix (Reader/Writer)

Legend
- Supported: implemented end-to-end with reasonable parity for typical cases
- Partial: implemented but missing important options/edge cases or incomplete model
- Missing: not implemented

| Feature | PHP Reader | TS Reader | PHP Writer | TS Writer |
|---|---|---|---|---|
| Workbook + sheet list | Supported (`php-src/src/PhpSpreadsheet/Reader/Xlsx.php`) | Supported (`src/io/xlsx-reader.ts`) | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/Workbook.php`) | Supported (`src/io/xlsx/workbook.ts`) |
| Cell values (numbers/strings/bools) | Supported | Supported (regex parsing; sharedStrings) (`src/io/xlsx-reader.ts`) | Supported | Supported (`src/io/xlsx/worksheet.ts`) |
| Formulas (stored) | Supported | Supported (stores `=<f>`; no calc) (`src/io/xlsx-reader.ts`) | Supported | Supported (`src/io/xlsx/worksheet.ts`) |
| Styles (fonts/fills/borders/numFmts) | Supported | Supported/Partial (`src/io/xlsx/styles-reader.ts`) | Supported | Supported/Partial (`src/io/xlsx/styles.ts`) |
| Conditional formatting (CF) | Supported | Partial (reads some; storage model differs) (`src/io/xlsx-reader.ts`, `src/style/conditional-formatting/*`) | Supported | Partial (writes key rule types; not full parity) (`src/io/xlsx/worksheet.ts`) |
| Hyperlinks | Supported | Supported (`src/io/xlsx-reader.ts`) | Supported | Supported (`src/io/xlsx/worksheet.ts`, `src/io/xlsx/rels.ts`) |
| Data validation | Supported | Supported (`src/io/xlsx-reader.ts`) | Supported | Supported (`src/io/xlsx/worksheet.ts`) |
| Merge cells | Supported | Supported (`src/io/xlsx-reader.ts`) | Supported | Supported (`src/io/xlsx/worksheet.ts`) |
| Comments (classic notes) | Supported | Supported/Partial (comment text supported; VML geometry minimal) (`src/io/xlsx-reader.ts`) | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/Comments.php`) | Supported/Partial (`src/io/xlsx/comments.ts`, `src/io/xlsx/vml-drawing.ts`, `src/io/xlsx/worksheet.ts`) |
| Drawings/images (DrawingML) | Supported | Supported/Partial (basic anchors + image bytes) (`src/io/xlsx-reader.ts`) | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/Drawing.php`) | Supported/Partial (`src/io/xlsx/drawingml.ts`) |
| Charts (embedded) | Supported | Partial (discovery + minimal title/series parsing, gated by `includeCharts`) (`src/io/xlsx-reader.ts`) | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/Chart.php`) | Partial (writes minimal chart scaffold, gated by `includeCharts`) (`src/io/xlsx/charts.ts`, `src/io/xlsx/drawingml.ts`) |
| Tables | Supported (`php-src/src/PhpSpreadsheet/Reader/Xlsx.php`) | Partial/Missing (table model exists but no full IO) (`src/worksheet/table.ts`) | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/Table.php`) | Missing (no table part writer; content types may mention tables) |
| Defined names | Supported | Partial/Missing (core model exists; XLSX IO not complete) (`src/core/defined-name.ts`) | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/DefinedNames.php`) | Missing in workbook output (`src/io/xlsx/workbook.ts`) |
| Doc props (core/app/custom) | Supported | Partial (reads limited set) (`src/io/xlsx-reader.ts`) | Supported | Supported (`src/io/xlsx/doc-props.ts`) |
| Macros/VBA/Ribbon | Supported (where present) | Missing | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsVBA.php`, `php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsRibbon.php`) | Missing |
| Rich data / feature property bag | Supported (`php-src/src/PhpSpreadsheet/Writer/Xlsx/Metadata.php`, `php-src/src/PhpSpreadsheet/Writer/Xlsx/FeaturePropertyBag.php`) | Missing | Supported | Missing |

## Notable parity gaps (TS vs PHP)

### Workbook-defined names

PHP
- Writes defined names into workbook via `php-src/src/PhpSpreadsheet/Writer/Xlsx/DefinedNames.php`.

TS
- Workbook writer (`src/io/xlsx/workbook.ts`) currently writes sheets + calcPr, but does not emit `<definedNames>`.
- TS has a core model (`src/core/defined-name.ts`), so this is primarily an IO gap.

### Tables

PHP
- Table model + full XLSX table part handling:
  - `php-src/src/PhpSpreadsheet/Worksheet/Table.php`
  - `php-src/src/PhpSpreadsheet/Writer/Xlsx/Table.php`

TS
- Table model exists: `src/worksheet/table.ts`.
- TS writer does not currently write `xl/tables/tableN.xml` (no table writer part under `src/io/xlsx/`).
- TS reader does not currently load tables into the table model (no obvious table parsing in `src/io/xlsx-reader.ts`).

### Charts

PHP
- Full chart object graph and serialization:
  - Core chart API: `php-src/src/PhpSpreadsheet/Chart/*`
  - XLSX writer: `php-src/src/PhpSpreadsheet/Writer/Xlsx/Chart.php`

TS
- Reader: chart discovery and minimal parsing behind an opt-in flag (`src/io/xlsx-reader.ts`).
- Writer: emits a minimal chart scaffold (`src/io/xlsx/charts.ts`) and wiring via `src/io/xlsx/drawingml.ts`.
- Model is intentionally minimal (`src/worksheet/chart/chart.ts`). See `review/php-ts-parity/details/chart.md` for a detailed roadmap.

### Macro/VBA/Ribbon/Rich data

PHP
- Macro and ribbon relationships/parts:
  - `php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsVBA.php`
  - `php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsRibbon.php`
- Metadata / rich data / feature bag:
  - `php-src/src/PhpSpreadsheet/Writer/Xlsx/Metadata.php`
  - `php-src/src/PhpSpreadsheet/Writer/Xlsx/FeaturePropertyBag.php`
  - `php-src/src/PhpSpreadsheet/Writer/Xlsx/RichDataDrawing.php`

TS
- Missing across both read and write.

## Verification workflow (recommended)

The repo includes PHP-side verification scripts under `verify-php/`.

Generate XLSX with TS writer
- Basic: `bun run verify-php/demo-write.ts` -> produces `demo.xlsx` (see `verify-php/demo-write.ts`).
- Comments: `bun run verify-php/comments-demo-write.ts` -> produces `verify-php/comments-demo.xlsx` (see `verify-php/comments-demo-write.ts`).
- Style/CF/theme parity: `bun run verify-php/gen-parity.ts` -> produces `full-parity-test.xlsx` (see `verify-php/gen-parity.ts`).

Load with PhpSpreadsheet (PHP)
- Basic load: `php verify-php/verify-xlsx.php` (loads `demo.xlsx`) (`verify-php/verify-xlsx.php`).
- “Full parity” spot checks (theme fill/font + CF + border): `php verify-php/verify-parity-full.php` (`verify-php/verify-parity-full.php`).
- Autofilter check: `php verify-php/verify-autofilter.php` (`verify-php/verify-autofilter.php`).
- Comments check: `php verify-php/verify-comments.php verify-php/comments-demo.xlsx` (`verify-php/verify-comments.php`).

When investigating a mismatch
- Diff the unzipped package structure and key parts (workbook.xml, worksheet xml, styles.xml, sharedStrings.xml, rels, drawings, comments/VML, charts).
- Keep “feature flags” consistent:
  - charts are gated by `XlsxWriter.setIncludeCharts(true)` (`src/io/xlsx-writer.ts`) and `XlsxReader.setIncludeCharts(true)` (`src/io/xlsx-reader.ts`).
