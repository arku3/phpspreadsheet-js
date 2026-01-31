
# Style Parity (PhpSpreadsheet vs TS)

Scope of this comparison
- PHP reference: `php-src/src/PhpSpreadsheet/Style/*` and `php-src/src/PhpSpreadsheet/Style/RgbTint.php`.
- TS target: `src/style/*` including `src/style/conditional-formatting/**`.
- I read the core TS/PHP style model files listed above (Style/Font/Fill/Border/Borders/Alignment/Color/NumberFormat/Protection/RgbTint) plus a subset of conditional formatting + formatting engine files to assess parity.
- I did not inspect every file under `php-src/src/PhpSpreadsheet/Style/NumberFormat/**` (there are many formatters/wizards) nor every TS conditional-formatting wizard file; gaps below reflect what I saw in the inspected files.

## Overview (and why Style parity matters for XLSX)

XLSX serialization relevance
- In XLSX, “style” is not a single XML blob; it is a set of coordinated records across `xl/styles.xml`:
  - `cellXfs` (cell extended formats) reference: `fontId`, `fillId`, `borderId`, `numFmtId`, `xfId`, and flags like `applyFont/applyFill/...`.
  - `fonts`, `fills`, `borders` are de-duplicated collections (hashing/dedup is critical).
  - `numFmts` defines custom number formats; built-in format IDs are standardized but Excel has quirks.
  - Color can be literal ARGB, theme-based with optional tint, or indexed (palette for legacy).
- Conditional formatting (CF) is serialized primarily per worksheet (`xl/worksheets/sheetN.xml`) with rule nodes; it references dxf-like style fragments and rule-specific payloads (data bars, color scales, icon sets).

Why parity matters
- Reader parity: if TS does not represent a style attribute (or cannot round-trip it), reading a file and writing it back can silently drop formatting.
- Writer parity: missing constants/mappings (e.g., alignment normalization, number format IDs, theme/tint behavior) can produce XLSX that opens but looks different in Excel.
- Dedup correctness: PhpSpreadsheet uses hash codes and caching to reduce style explosion when applying styles to ranges. Missing caching can be a performance issue and can also increase file size.

## Major class mapping (PHP -> TS)

| PHP (PhpSpreadsheet) | PHP path | TS equivalent | TS path | Notes |
| --- | --- | --- | --- | --- |
| `Style` | `php-src/src/PhpSpreadsheet/Style/Style.php` | `Style` | `src/style/style.ts` | Same top-level components; TS lacks PHP's `isConditional` construction mode and advanced range border application. |
| `Supervisor` | `php-src/src/PhpSpreadsheet/Style/Supervisor.php` | `Supervisor` | `src/style/supervisor.ts` | TS has a smaller API (no `exportArray()` helper as a general facility; TS uses per-class cloning/export patterns). |
| `Font` | `php-src/src/PhpSpreadsheet/Style/Font.php` | `Font` | `src/style/font.ts` | Core props exist; several PHP-only props omitted (autoColor, chart/underline color, etc.). |
| `Fill` | `php-src/src/PhpSpreadsheet/Style/Fill.php` | `Fill` | `src/style/fill.ts` | Fill type constants align; TS lacks PHP's “colors changed” tracking used in hashing/export. |
| `Border` | `php-src/src/PhpSpreadsheet/Style/Border.php` | `Border` | `src/style/border.ts` | Border style constants align; TS does not model PHP's conditional default `BORDER_OMIT` via construction mode. |
| `Borders` | `php-src/src/PhpSpreadsheet/Style/Borders.php` | `Borders` | `src/style/borders.ts` | Pseudo-borders exist for supervisor; advanced application of `outline/inside/vertical/horizontal` for ranges is not implemented in TS `Style.applyFromArray`. |
| `Alignment` | `php-src/src/PhpSpreadsheet/Style/Alignment.php` | `Alignment` | `src/style/alignment.ts` | Core alignment props exist; PHP has XLSX/HTML mapping tables and some validation/clamping; TS omits most of those. |
| `Color` | `php-src/src/PhpSpreadsheet/Style/Color.php` | `Color` | `src/style/color.ts` | Constants + indexed palette mostly align; theme/hyperlink behavior differs; TS has extra theme resolution helper. |
| `NumberFormat` | `php-src/src/PhpSpreadsheet/Style/NumberFormat.php` | `NumberFormat` | `src/style/number-format.ts` | TS is significantly simplified (built-in formats list + id mapping + sysdate/systime conversion + formatting engine). |
| Number format engine | `php-src/src/PhpSpreadsheet/Style/NumberFormat/Formatter.php` (+ others) | `NumberFormatter` | `src/style/number-formatter.ts` | TS supports a small subset; PHP supports sections/conditions/colors/escaping and much more. |
| `Protection` | `php-src/src/PhpSpreadsheet/Style/Protection.php` | `Protection` | `src/style/protection.ts` | Mostly aligned; TS defaults are non-null strings (PHP uses nullable in conditional mode). |
| `RgbTint` | `php-src/src/PhpSpreadsheet/Style/RgbTint.php` | `RgbTint` | `src/style/rgb-tint.ts` | Algorithm ports closely. |
| `Conditional` | `php-src/src/PhpSpreadsheet/Style/Conditional.php` | `Conditional` | `src/style/conditional.ts` | TS includes more constants (e.g., `aboveAverage`, `top10`), but style fragment handling differs (conditional style nullability). |
| CF: Color scale | `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalColorScale.php` | `ConditionalColorScale` | `src/style/conditional-formatting/conditional-color-scale.ts` | TS has data container only; PHP has evaluation (`getColorForValue`) and range value preparation. |
| CF: Data bar | `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalDataBar.php` | `ConditionalDataBar` | `src/style/conditional-formatting/conditional-data-bar.ts` | TS lacks rule-extension payload (PHP has `ConditionalFormattingRuleExtension`). |
| CF: Icon set | `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalIconSet.php` | `ConditionalIconSet` | `src/style/conditional-formatting/conditional-icon-set.ts` | TS adds auto-generated default thresholds; PHP is mostly a container. |
| CF: Style merge | `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/StyleMerger.php` | `StyleMerger` | `src/style/conditional-formatting/style-merger.ts` | TS appears to assume nullable getters, but TS style classes mostly return non-null primitives (see gaps). |

## Parity notes by area

### Style (range application, dedup, supervisor semantics)

What matches
- Both models have the same top-level sub-components: font/fill/borders/alignment/numberFormat/protection + `quotePrefix` and `checkBox`.
  - PHP: `php-src/src/PhpSpreadsheet/Style/Style.php`
  - TS: `src/style/style.ts`

Gaps / differences
- Range application behavior:
  - PHP `Style::applyFromArray()` has complex range logic: worksheet qualification validation, range normalization, row/column selection modes, and a style-hash caching layer to reduce expensive `getHashCode()` calls when applying to full rows/columns.
    - See: `php-src/src/PhpSpreadsheet/Style/Style.php`
  - TS `Style.applyFromArraySupervisor()` loops every cell in the selection and clones/applies/dedups per-cell.
    - See: `src/style/style.ts`
  - Impact: performance and memory (style explosion), and potential functional differences for row/column range selection.

- Advanced borders (“outline/inside/allBorders” behavior):
  - PHP supports “advanced borders” where `allBorders`, `outline`, and `inside` are expanded and applied correctly across the perimeter/interior of a rectangular range; it also has special handling for up to 3x3 regions to apply inside/outside borders.
    - See: `php-src/src/PhpSpreadsheet/Style/Style.php`
  - TS does not implement this logic in `Style.applyFromArraySupervisor`.
    - See: `src/style/style.ts`
  - Impact: applying border shorthands to ranges will not match PhpSpreadsheet/Excel semantics.

- Conditional-style construction mode:
  - PHP passes `$isConditional` down to components so they can use `null` for “unset” (e.g., conditional styles should not override unspecified attributes).
    - e.g. `new Style(false, true)` in `php-src/src/PhpSpreadsheet/Style/Conditional.php` and per-component conditional defaults.
  - TS `Conditional` currently uses `new Style(false)` (non-conditional).
    - See: `src/style/conditional.ts`
  - Impact: conditional formatting style fragments may behave as “full styles” (overwriting more than intended) when merged/serialized.

### Font

What matches
- Underline constants exist in both:
  - PHP: `php-src/src/PhpSpreadsheet/Style/Font.php`
  - TS: `src/style/font.ts`
- Core attributes exist: `name`, `size`, `bold`, `italic`, `superscript`, `subscript`, `underline`, `strikethrough`, `color`, `scheme`, and chart/theme-oriented fields (`latin`, `eastAsian`, `complexScript`, `cap`, `baseLine`, `strikeType`) are present in TS.

Gaps / differences
- PHP-only fields not represented in TS:
  - `autoColor` (and `getAutoColor()/setAutoColor()`), `colorIndex`, `underlineColor`, `chartColor`.
  - See: `php-src/src/PhpSpreadsheet/Style/Font.php`
- Validation differences:
  - PHP `setScheme()` restricts to `''|'major'|'minor'`; TS `setScheme()` accepts any string.
    - PHP: `php-src/src/PhpSpreadsheet/Style/Font.php`
    - TS: `src/style/font.ts`
  - PHP `cap` can be `null` when invalid; TS stores a non-null string and does not validate against a whitelist.

### Fill

What matches
- Fill type constants align between PHP and TS (solid/gradient/pattern variants).
  - PHP: `php-src/src/PhpSpreadsheet/Style/Fill.php`
  - TS: `src/style/fill.ts`

Gaps / differences
- Change tracking + hashing:
  - PHP has `colorChanged`/`getColorsChanged()` and includes a “colors changed” flag in `getHashCode()` and conditional export of colors only if changed.
    - See: `php-src/src/PhpSpreadsheet/Style/Fill.php`
  - TS does not track “colors changed”; hash is based on fillType/rotation and colors (except for fillType `none`).
    - See: `src/style/fill.ts`
  - Impact: style dedup may behave differently, and exported style fragments may include colors where PHP would omit them.

### Border / Borders

What matches
- Border style constants and diagonal direction constants align.
  - PHP: `php-src/src/PhpSpreadsheet/Style/Border.php`, `php-src/src/PhpSpreadsheet/Style/Borders.php`
  - TS: `src/style/border.ts`, `src/style/borders.ts`

Gaps / differences
- Conditional default behavior:
  - PHP can construct conditional borders so that default style is `BORDER_OMIT` (special sentinel for conditional formatting).
    - See: `php-src/src/PhpSpreadsheet/Style/Border.php` (`$isConditional` handling)
  - TS defines `BORDER_OMIT` but does not have a conditional-constructor mode to default to it.
    - See: `src/style/border.ts`

- Pseudo-borders vs actual application:
  - Both models expose pseudo-borders for supervisor (`allBorders`, `outline`, `inside`, `vertical`, `horizontal`) on `Borders`.
  - Only PHP actually expands these shorthands during `Style::applyFromArray(..., $advancedBorders=true)`.
    - PHP: `php-src/src/PhpSpreadsheet/Style/Style.php`
    - TS: `src/style/style.ts`

### Alignment

What matches
- Horizontal/vertical constants and basic properties exist: `horizontal`, `vertical`, `textRotation`, `wrapText`, `shrinkToFit`, `indent`, `readOrder`, `justifyLastLine`.
  - PHP: `php-src/src/PhpSpreadsheet/Style/Alignment.php`
  - TS: `src/style/alignment.ts`

Gaps / differences
- Mapping tables:
  - PHP defines mapping constants for XLSX and HTML output (`HORIZONTAL_ALIGNMENT_FOR_XLSX`, `VERTICAL_ALIGNMENT_FOR_XLSX`, plus HTML equivalents).
    - See: `php-src/src/PhpSpreadsheet/Style/Alignment.php`
  - TS does not provide equivalent mapping tables.
  - Impact: any HTML export or XLSX mapping normalization logic that relies on these constants is not available in TS.

- Validation/clamping differences:
  - PHP clamps `readOrder` to 0..2; TS stores whatever number is provided.
  - PHP suppresses `indent` unless alignment supports it; TS does not enforce that rule.
  - `justifyLastLine` is nullable in PHP (esp. in conditional mode); TS stores a non-null boolean default.

### Color (ARGB/theme/indexed, hyperlink theme)

What matches
- Color constants and indexed palette map are broadly the same.
  - PHP: `php-src/src/PhpSpreadsheet/Style/Color.php`
  - TS: `src/style/color.ts`
- Both implement `indexedColor()` with optional palette override.

Gaps / differences
- Validation + error handling:
  - PHP `validateColor()` can return an empty string and `setARGB()` can effectively no-op on invalid inputs (depending on args).
  - TS `validateColor()` falls back to black on invalid inputs.
  - Impact: invalid colors are handled differently, which can change output rather than preserving previous value.

- `hasChanged` semantics:
  - PHP toggles `hasChanged` when setting ARGB/theme and uses it via Fill's `getColorsChanged()`.
  - TS has a `#hasChanged` field and `setHasChanged()`, but `setARGB()`/`setTheme()` do not automatically set it.
    - See: `src/style/color.ts`
  - Impact: “changed” tracking semantics differ, which can affect hashing/dedup and conditional export decisions.

- Hyperlink theme behavior differs:
  - PHP `setHyperlinkTheme()` consults workbook theme colors and uses `Theme::HYPERLINK_THEME`.
    - See: `php-src/src/PhpSpreadsheet/Style/Color.php`
  - TS `setHyperlinkTheme()` sets a hard-coded ARGB (`FF0563C1`) and theme index `10`.
    - See: `src/style/color.ts`, `src/style/theme.ts`
  - Impact: theme-aware hyperlink coloring may not match the workbook theme.

### NumberFormat + number formatting engine

What matches
- A shared subset of predefined format strings exist as constants (General, common number/date/time patterns, some currency/accounting strings).
  - PHP: `php-src/src/PhpSpreadsheet/Style/NumberFormat.php`
  - TS: `src/style/number-format.ts`

Major gaps
- Built-in format ID mapping:
  - PHP maintains a large built-in formats table, supports lookup by index and reverse lookup by format string (`builtInFormatCode`, `builtInFormatCodeIndex`), and has special-case behavior for Excel vs ECMA built-in IDs.
    - See: `php-src/src/PhpSpreadsheet/Style/NumberFormat.php`
  - TS stores `builtInFormatCode` but does not implement the built-in formats table nor the lookup/index conversion.
    - See: `src/style/number-format.ts`
  - Impact: XLSX writer needs correct `numFmtId` handling to round-trip built-in vs custom formats.

- System date/time formats:
  - PHP can replace `[$-x-sysdate]`/`[$-F800]` and related “system format” tokens via `convertSystemFormats`.
    - See: `php-src/src/PhpSpreadsheet/Style/NumberFormat.php`
  - TS has no equivalent conversion.

- Formatting engine parity:
  - PHP implements a fairly complete Excel-like formatting engine supporting:
    - sections separated by `;` (positive/negative/zero/text),
    - conditional sections (`[>0]` etc.),
    - color sections (`[Red]` or palette-index colors),
    - escaping/quoted literals, and many date/time/number edge cases.
    - See: `php-src/src/PhpSpreadsheet/Style/NumberFormat/Formatter.php` (and related formatters).
  - TS `NumberFormatter` is intentionally “basic” and supports a small set of heuristics:
    - a short map of “built-in” format strings,
    - simplistic detection of date/time/percent/currency/thousands,
    - no section/condition/color parsing.
    - See: `src/style/number-formatter.ts`
  - Impact: formatting displayed values (and any writer decisions based on format type) will diverge for many real-world formats.

Additional TS-specific difference
- TS `NumberFormat.getHashCode()` returns only the format code string (not an md5 of formatCode + builtInFormatCode, and it ignores conditional/built-in behavior).
  - TS: `src/style/number-format.ts`
  - PHP: `php-src/src/PhpSpreadsheet/Style/NumberFormat.php`

### Protection

What matches
- Protection constants and fields (`locked`, `hidden`) align.
  - PHP: `php-src/src/PhpSpreadsheet/Style/Protection.php`
  - TS: `src/style/protection.ts`

Difference
- Conditional-mode nullability:
  - PHP uses `null` for unset in conditional styles.
  - TS stores non-null strings by default.

### RgbTint

What matches
- The tint algorithm is closely ported.
  - PHP: `php-src/src/PhpSpreadsheet/Style/RgbTint.php`
  - TS: `src/style/rgb-tint.ts`

## Conditional formatting: parity and TS-only behavior

What matches (data model)
- Core conditional rule container exists with many matching constants and fields (`type`, `operator`, `conditions`, `stopIfTrue`, `priority`).
  - PHP: `php-src/src/PhpSpreadsheet/Style/Conditional.php`
  - TS: `src/style/conditional.ts`

Key gaps / differences
- Conditional styles should be partial:
  - PHP creates conditional styles as `new Style(false, true)` so subcomponents use `null` defaults.
  - TS `Conditional` uses `new Style(false)` and the style classes generally return non-null primitives.
  - Combined with `src/style/conditional-formatting/style-merger.ts`, which checks `!== null`, TS will often treat default values as “set” and overwrite base style when merging.
    - TS: `src/style/conditional.ts`, `src/style/conditional-formatting/style-merger.ts`
    - PHP: `php-src/src/PhpSpreadsheet/Style/Conditional.php`, `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/StyleMerger.php`

- Color scale evaluation not implemented:
  - PHP implements value range extraction and interpolated colors via `getColorForValue()`.
    - See: `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalColorScale.php`
  - TS `ConditionalColorScale` is currently a data container with a TODO.
    - See: `src/style/conditional-formatting/conditional-color-scale.ts`

- Data bar rule extensions missing:
  - PHP `ConditionalDataBar` can hold a `ConditionalFormattingRuleExtension`.
    - See: `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/ConditionalDataBar.php`
  - TS explicitly notes missing support.
    - See: `src/style/conditional-formatting/conditional-data-bar.ts`

- Wizard parity gaps:
  - PHP CF wizards include `Wizard::newRule(...)` and `Wizard::fromConditional(...)` plus robust cell reference adjustment logic in `WizardAbstract`.
    - See: `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard.php`, `php-src/src/PhpSpreadsheet/Style/ConditionalFormatting/Wizard/WizardAbstract.php`
  - TS has wizard class shells and constants, but cell reference adjustments are stubbed (`cellConditionCheck()` returns the input unchanged).
    - See: `src/style/conditional-formatting/wizard.ts`, `src/style/conditional-formatting/wizard/wizard-abstract.ts`
  - Impact: generated CF formulas/conditions may not correctly adjust relative cell references when applied across ranges.

Notable TS-only behavior
- Icon set defaults auto-population:
  - TS auto-generates default cfvo thresholds based on the icon set type prefix (3/4/5) if none were provided.
    - See: `src/style/conditional-formatting/conditional-icon-set.ts`
  - PHP does not auto-populate thresholds at the object-model level (it is typically driven by read/write behavior).

## Gaps summary (prioritized by XLSX round-trip risk)

High impact
1) Number formats are not parity-complete.
   - Built-in format ID mapping, system date/time formats, and full Excel formatting semantics are missing in TS.
   - Files: `php-src/src/PhpSpreadsheet/Style/NumberFormat.php`, `php-src/src/PhpSpreadsheet/Style/NumberFormat/Formatter.php`, `src/style/number-format.ts`, `src/style/number-formatter.ts`.
2) Conditional formatting style fragments are not modeled as “partial styles” in TS.
   - Default values are non-null, and TS `StyleMerger` checks suggest nullable expectations.
   - Files: `php-src/src/PhpSpreadsheet/Style/Conditional.php`, `src/style/conditional.ts`, `src/style/conditional-formatting/style-merger.ts`.
3) Range style application differs (advanced borders + row/column selection + caching).
   - Files: `php-src/src/PhpSpreadsheet/Style/Style.php`, `src/style/style.ts`.

Medium impact
4) Theme and hyperlink color behavior differs (theme-aware in PHP vs hardcoded in TS).
   - Files: `php-src/src/PhpSpreadsheet/Style/Color.php`, `src/style/color.ts`, `src/style/theme.ts`.
5) Alignment validation and mapping tables are missing in TS.
   - Files: `php-src/src/PhpSpreadsheet/Style/Alignment.php`, `src/style/alignment.ts`.

Lower impact / completeness
6) Font/Fill/Color extra properties missing in TS (autoColor, chart colors, “colors changed” tracking).
   - Files: `php-src/src/PhpSpreadsheet/Style/Font.php`, `php-src/src/PhpSpreadsheet/Style/Fill.php`, `src/style/font.ts`, `src/style/fill.ts`.

## Next steps (prioritized)

1) Decide and document TS conditional style semantics.
   - Either implement an explicit “conditional style” mode (like PHP’s `$isConditional`) or adjust `src/style/conditional-formatting/style-merger.ts` to match TS’s non-null default model.
   - Affects: `src/style/conditional.ts`, `src/style/style.ts`, subcomponents.

2) Implement number format built-in tables + `numFmtId` mapping parity.
   - Port `builtInFormatCode(...)`, `builtInFormatCodeIndex(...)`, and Excel-vs-ECMA quirks.
   - Likely needed for correct XLSX write/read round-tripping.
   - PHP reference: `php-src/src/PhpSpreadsheet/Style/NumberFormat.php`.

3) Expand TS number formatting engine or explicitly scope it.
   - If TS aims to match PhpSpreadsheet display formatting, port section parsing/conditions/colors.
   - If not, document limitations and ensure XLSX writer still preserves raw format codes.
   - References: `php-src/src/PhpSpreadsheet/Style/NumberFormat/Formatter.php`, `src/style/number-formatter.ts`.

4) Add advanced border application for range styling.
   - Implement the `allBorders/outline/inside` expansion logic in TS supervisor apply.
   - PHP reference: `php-src/src/PhpSpreadsheet/Style/Style.php`.

5) Align theme color behaviors (hyperlink theme, tint/resolve semantics) with PHP.
   - Ensure hyperlink theme uses workbook theme when present.
   - References: `php-src/src/PhpSpreadsheet/Style/Color.php`, `src/style/color.ts`, `src/style/theme.ts`.
