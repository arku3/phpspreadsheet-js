# PHP vs TypeScript Parity Review

This document tracks the detailed feature-by-feature comparison between the original PHP implementation (`php-src/src/PhpSpreadsheet/`) and the TypeScript port (`src/`).

## 1. Style Module (`src/style/`)

| Feature | PHP Component | TS Status | Gaps / Misalignments |
| :--- | :--- | :--- | :--- |
| **Indexed Colors** | `Color.php` | ✅ Done | Palette (56 colors) and `indexedColor()` factory implemented. |
| **Borders Supervisor** | `Borders.php` | ✅ Done | Pseudo-borders (`allBorders`, `outline`, etc.) implemented for range styling. |
| **Range Border Logic** | `Style.php` | 🟠 Partial | TS lacks the "Region-Based" logic that calculates border placement in a range. |
| **Conditional Formatting**| `Conditional.php` | ❌ Missing | Not yet implemented. |
| **Themes & Tinting** | `Theme.php` | ❌ Missing | No support for Office themes or RGB tinting/shading. |
| **Number Format Masks** | `NumberFormat.php` | 🟠 Partial | Basic masks supported; complex parsing (date/time/currency) partially ported. |

## 2. Core & Worksheet Module (`src/core/`, `src/worksheet/`)

| Feature | PHP Component | TS Status | Gaps / Misalignments |
| :--- | :--- | :--- | :--- |
| **Document Metadata** | `Document\Properties` | ❌ Missing | No Creator, Modified Date, Title, etc. |
| **Workbook Security** | `Document\Security` | ❌ Missing | No workbook protection or password hashing. |
| **Sheet Views / Panes** | `Worksheet\SheetView` | ❌ Missing | No support for freezing panes, splitting, or zoom levels. |
| **AutoFilters** | `Worksheet\AutoFilter`| ❌ Missing | No filtering logic or range definition. |
| **Header / Footer** | `Worksheet\HeaderFooter`| ❌ Missing | No printable header/footer support. |
| **Hyperlinks** | `Cell\Hyperlink` | ❌ Missing | Cells cannot contain links. |
| **Data Validation** | `Cell\DataValidation`| ❌ Missing | No dropdowns or input constraints. |
| **Cell Memory** | `Collection\Cells` | 🟠 Partial | TS uses `Map` (memory-intensive); PHP uses `CacheInterface` (off-heap/disk). |
| **Page Breaks** | `Worksheet\PageBreak` | ❌ Missing | Manual page breaks not supported. |

## 3. Calculation Engine (`src/calculation/`)

| Feature | PHP Component | TS Status | Gaps / Misalignments |
| :--- | :--- | :--- | :--- |
| **Function Library** | `Calculation\Functions`| 🟠 Partial | Subset of Excel functions implemented. |
| **Array Formulas** | `Calculation\Engine` | ❌ Missing | No support for array/spilled formulas. |
| **Localization** | `Calculation\Locale` | ❌ Missing | Engine is English-only. |

## 4. IO Module (`src/io/`)

| Feature | PHP Component | TS Status | Gaps / Misalignments |
| :--- | :--- | :--- | :--- |
| **XLSX Writer** | `Writer\Xlsx` | ✅ Done | Modular writer supports styles, dimensions, and formulas. |
| **XLSX Reader** | `Reader\Xlsx` | ❌ Missing | Not yet implemented. |
| **Drawings (Images)** | `Worksheet\Drawing` | ❌ Missing | No support for images in sheets. |

---

## Progress Log

- [2026-01-29] **Style:** Confirmed functional parity for RichText hashing. Added Indexed Colors (56) to `Color.ts`.
- [2026-01-29] **Style:** Implemented pseudo-borders in `Borders.ts` constructor for Supervisor support.
- [2026-01-29] **Core:** Identified high memory risk in `CellCollection` due to lack of caching.
- [2026-01-29] **Core:** Worksheet identified as missing critical UI controls (Panes, Zoom).
