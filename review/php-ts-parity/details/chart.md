# Chart Parity (PhpSpreadsheet vs TS)

This document compares PhpSpreadsheet chart support (`php-src/src/PhpSpreadsheet/Chart/*`) with the current TypeScript implementation (chart model under `src/worksheet/chart/*` and XLSX chart support under `src/io/xlsx/charts.ts` plus DrawingML integration).

## Current TS chart support level

### Domain model (TS)

Implemented: a minimal embedded-chart model that primarily tracks anchor position, a name, and a lightweight “parsed series formula” view.

- Chart object: `src/worksheet/chart/chart.ts`
- Supported properties / API surface (TS):
  - Name: `Chart.getName()` / `Chart.setName()` (`src/worksheet/chart/chart.ts`)
  - Worksheet ownership: `Chart.getWorksheet()` / `Chart.setWorksheet()` / `Chart.detach()` (`src/worksheet/chart/chart.ts`) and `Worksheet.addChart()` / `Worksheet.removeChart()` / `Worksheet.getChartCollection()` (`src/core/worksheet.ts`)
  - Anchoring for DrawingML:
    - Top-left: `Chart.getTopLeftPosition()` / `Chart.setTopLeftPosition()` (`src/worksheet/chart/chart.ts`)
    - Bottom-right optional: `Chart.getBottomRightPosition()` / `Chart.setBottomRightPosition()` (`src/worksheet/chart/chart.ts`)
    - Offsets are stored but only used for anchors (see DrawingML writer below)
  - Reader bookkeeping: `Chart.getChartXmlPath()` / `Chart.setChartXmlPath()` to remember the XLSX part path (`src/worksheet/chart/chart.ts`)
  - Minimal “chart content” view:
    - Title as plain string: `Chart.getTitleText()` / `Chart.setTitleText()` (`src/worksheet/chart/chart.ts`)
    - Series list as formulas only: `Chart.getSeries()` / `Chart.setSeries()` where each `ChartSeriesModel` has `{ idx?, order?, categoryFormula, valuesFormula }` (`src/worksheet/chart/chart.ts`)

Non-goals / not represented in TS model today:

- No separate classes for Title, Legend, PlotArea, Axis, DataSeries, DataSeriesValues, Layout (only the single `Chart` class exists under `src/worksheet/chart/chart.ts`).
- No formatting/styling model (fonts, fills, borders, data labels, etc.).
- No computed/evaluated series values (only formulas are stored).

### XLSX writer support (TS)

TS can write an embedded chart “relationship chain” so Excel recognizes that a worksheet contains a chart, but the generated chart part is a fixed scaffold.

- Chart part writer: `src/io/xlsx/charts.ts`
  - `writeChartXml(chart)` currently ignores `chart` content and emits a minimal valid `c:chartSpace` containing:
    - `c:chart` with `c:autoTitleDeleted val="1"`
    - `c:plotArea` + `c:layout`
    - A hard-coded `c:barChart` (column, clustered) with no `<c:ser>` entries
    - A category axis and value axis with hard-coded axis ids
- Package wiring in XLSX writer:
  - When `XlsxWriter.setIncludeCharts(true)` is enabled, chart parts are written to `xl/charts/chart{n}.xml` (`src/io/xlsx-writer.ts`).
  - Content types include chart overrides for all allocated charts (`src/io/xlsx/content-types.ts`).
  - Worksheet relationships include a drawing relationship if a sheet has drawings or charts (`src/io/xlsx/rels.ts`).
  - DrawingML part includes chart anchors and a chart relationship from the drawing part to the chart XML (`src/io/xlsx/drawingml.ts`).

Net result: TS can emit an XLSX with a chart object embedded on the sheet, but the chart itself will be an empty bar chart scaffold (no series, no title, no legend).

### XLSX reader support (TS)

TS can discover embedded charts and extract a small amount of information.

- Chart discovery and anchoring: `src/io/xlsx-reader.ts`
  - When `XlsxReader.setIncludeCharts(true)` is enabled, the reader:
    - Parses worksheet drawing parts (`xl/drawings/drawing*.xml`)
    - Detects `<a:graphicData uri=".../chart">` graphic frames
    - Resolves the drawing relationship `r:id` to a `.../charts/chart*.xml` part
    - Creates `new Chart()`, sets `chartXmlPath`, and populates anchor positions from `xdr:oneCellAnchor`/`xdr:twoCellAnchor`/`xdr:absoluteAnchor`
- Minimal chart content extraction: `src/io/xlsx-reader.ts`
  - Title: `#parseChartTitleText` extracts plain text from either `c:tx/c:rich//a:t` or `c:tx/c:strRef/c:strCache//c:v`.
  - Series formulas: `#parseChartSeries` scans all `<c:ser>` and extracts:
    - `c:idx/@val`, `c:order/@val`
    - `c:cat` and `c:val` formulas via `c:(strRef|numRef|multiLvlStrRef|multiLvlNumRef)/c:f`

Important limitation: the reader does not reconstruct the chart type, plot grouping/direction, legend, axes, layout, data label settings, formatting, or cached point values.

### Current test coverage (TS)

- Writer chain smoke test (parts + rels + content types): `tests/io/xlsx/charts-writer.test.ts`
- Reader fixture test (discovers chart, captures `chartXmlPath`, title text, and at least one series formula): `tests/xlsx-reader-charts-fixture.test.ts`
- Worksheet API tests for adding/removing charts and worksheet ownership constraints: `tests/worksheet/charts.test.ts`

## What is missing vs PhpSpreadsheet model/API

PhpSpreadsheet exposes a full chart object graph and includes both a richer chart domain model and deeper XLSX serialization/deserialization behavior.

Below is a structured “gap list” keyed to the PHP classes you called out.

### Chart (PHP) vs Chart (TS)

PHP: `php-src/src/PhpSpreadsheet/Chart/Chart.php`

Implemented in TS (partial parity):

- `name` (TS: `Chart.getName()`/`setName()` in `src/worksheet/chart/chart.ts`)
- Worksheet ownership/backref (TS: `src/worksheet/chart/chart.ts` + `src/core/worksheet.ts`)
- Anchor positioning (TS: `src/worksheet/chart/chart.ts`; written via `src/io/xlsx/drawingml.ts`; read via `src/io/xlsx-reader.ts`)

Missing in TS (major):

- Object graph: PHP `Chart` composes `Title`, `Legend`, `PlotArea`, `Axis` (x/y), and axis labels; TS has only `titleText: string | null` and a series formula list (`src/worksheet/chart/chart.ts` vs `php-src/src/PhpSpreadsheet/Chart/Chart.php`).
- Display/behavior flags: `plotVisibleOnly`, `displayBlanksAs`, `autoTitleDeleted`, `roundedCorners`, `oneCellAnchor`, etc. (PHP: `php-src/src/PhpSpreadsheet/Chart/Chart.php`).
- Visual styling: `noFill`, `noBorder`, border lines (`GridLines`), fill color (`ChartColor`) (PHP: `php-src/src/PhpSpreadsheet/Chart/Chart.php`).
- 3D/view settings: `rotX`, `rotY`, `rAngAx`, `perspective` (PHP: `php-src/src/PhpSpreadsheet/Chart/Chart.php`).
- Data refresh and rendering pipeline:
  - `Chart.refresh()` updates series values from worksheet cell data
  - `Chart.render()` uses configured renderer (`Settings::getChartRenderer()`)
  (PHP: `php-src/src/PhpSpreadsheet/Chart/Chart.php`)
- Deep clone semantics across the full object graph (PHP uses `__clone` to deep clone; TS has no clone behavior and no nested objects to clone) (`php-src/src/PhpSpreadsheet/Chart/Chart.php`).

### Title (PHP) vs TS titleText

PHP: `php-src/src/PhpSpreadsheet/Chart/Title.php`

Missing in TS:

- Caption model supports `string`, `RichText`, or an array of RichText/string fragments; TS stores only `string | null` (`src/worksheet/chart/chart.ts`).
- Title may come from a worksheet cell reference (stored in `Title.cellReference` and resolved via `getCalculatedTitle($spreadsheet)`); TS reader does not persist chart title formula/cell reference, only extracts display text when cached text is present (`php-src/src/PhpSpreadsheet/Chart/Title.php`, `src/io/xlsx-reader.ts`).
- Overlay flag, layout (`Layout`), and per-title font support (`php-src/src/PhpSpreadsheet/Chart/Title.php`).

### Legend (PHP) vs TS

PHP: `php-src/src/PhpSpreadsheet/Chart/Legend.php`

Missing in TS:

- Legend existence/position (right/left/top/bottom/top-right/custom), overlay behavior, layout (`Layout`), border/fill, and legend text formatting (`AxisText`) (`php-src/src/PhpSpreadsheet/Chart/Legend.php`).
- XLSX read/write of `<c:legend>` and its formatting.

### PlotArea (PHP) vs TS

PHP: `php-src/src/PhpSpreadsheet/Chart/PlotArea.php`

Missing in TS:

- Plot area layout and full plot series list (`DataSeries[]`) (PHP); TS has only a flat list of “series formulas” on `Chart` (`php-src/src/PhpSpreadsheet/Chart/PlotArea.php`, `src/worksheet/chart/chart.ts`).
- Plot area fill options (noFill, gradient stops/angle) and certain chart-type-specific options like `gapWidth`, `upBars`, `downBars` (`php-src/src/PhpSpreadsheet/Chart/PlotArea.php`).
- PlotArea refresh semantics (PHP calls through to DataSeries refresh) (`php-src/src/PhpSpreadsheet/Chart/PlotArea.php`).

### Axis (PHP) vs TS

PHP: `php-src/src/PhpSpreadsheet/Chart/Axis.php`

Missing in TS:

- No axis model at all (category/value/date axis type, number formats, gridlines, fills/lines, crossBetween, axis text rotation, scaling min/max, time units, log base, display units title, etc.) (`php-src/src/PhpSpreadsheet/Chart/Axis.php`).
- Writer currently emits axis nodes with hard-coded defaults and hard-coded axis ids, unrelated to any TS state (`src/io/xlsx/charts.ts`).
- Reader does not parse any axis nodes (`src/io/xlsx-reader.ts`).

### DataSeries + DataSeriesValues (PHP) vs TS series formulas

PHP:

- `php-src/src/PhpSpreadsheet/Chart/DataSeries.php`
- `php-src/src/PhpSpreadsheet/Chart/DataSeriesValues.php`

TS today:

- Only a `ChartSeriesModel` with category/value formulas and optional `idx/order` (`src/worksheet/chart/chart.ts`).

Missing in TS:

- Chart type + grouping + direction + style (bar/line/pie/scatter/etc.), smooth line flags, bubble sizes, series labels, plot ordering (`php-src/src/PhpSpreadsheet/Chart/DataSeries.php`).
- Series values model:
  - Data type (String/Number), format code, marker type/size, line width, fill colors (including per-point colors), cached data values and point count
  - Trend lines and label layout
  - `refresh()` that evaluates series formulas against worksheet cells
  (`php-src/src/PhpSpreadsheet/Chart/DataSeriesValues.php`).
- Multi-level categories/values behavior (PHP supports multi-level series; TS only extracts formula text) (`php-src/src/PhpSpreadsheet/Chart/DataSeriesValues.php`, `src/io/xlsx-reader.ts`).

### Layout (PHP) vs TS

PHP: `php-src/src/PhpSpreadsheet/Chart/Layout.php`

Missing in TS:

- Layout properties for positioning/sizing chart elements (x/y/w/h with mode/target), data labels configuration, number format settings, and label styling (fill/border/font/effects) (`php-src/src/PhpSpreadsheet/Chart/Layout.php`).
- Reader/writer coverage for these nodes in chart XML.

### XLSX IO parity summary

TS IO is currently oriented around “embedding plumbing” rather than “semantic chart fidelity.”

- Writer:
  - Yes: produces drawing anchors and relationship chain (`src/io/xlsx/drawingml.ts`, `src/io/xlsx/rels.ts`, `src/io/xlsx-writer.ts`, `src/io/xlsx/content-types.ts`).
  - No: serializes chart semantics (series, type, legend, title, axes, formatting) (`src/io/xlsx/charts.ts` always emits a static scaffold).
- Reader:
  - Yes: discovers embedded charts and anchors; extracts title display text (when present) and cat/val formulas (`src/io/xlsx-reader.ts`).
  - No: parses chart type, plot area details, axis config, legend, formatting, cached series values, etc. (`src/io/xlsx-reader.ts`).

## Suggested incremental roadmap for parity

This roadmap is ordered to keep files valid in Excel early (relationship chain stays correct) while gradually increasing semantic fidelity.

### Phase 0: Make the current minimal writer reflect the minimal model

- Write `<c:title>` when `Chart.getTitleText()` is set (`src/worksheet/chart/chart.ts`) instead of forcing `c:autoTitleDeleted val="1"` (`src/io/xlsx/charts.ts`).
- Emit `<c:ser>` nodes for `ChartSeriesModel[]` (idx/order + cat/val formulas) (`src/worksheet/chart/chart.ts`, parsed by `src/io/xlsx-reader.ts`).
- Keep the “default chart type” (barChart scaffold) but ensure it is stable and deterministic.

Outcome: TS round-trips the already-modeled fields (anchors + title text + series formulas) through XLSX.

### Phase 1: Introduce a PhpSpreadsheet-like chart object graph (model parity)

- Add TS classes mirroring the PHP structure:
  - `Chart` becomes a container for `Title`, `Legend`, `PlotArea`, `Axis` objects (PHP: `php-src/src/PhpSpreadsheet/Chart/Chart.php`).
  - `Title`, `Legend`, `PlotArea`, `Axis`, `DataSeries`, `DataSeriesValues`, `Layout` equivalents (PHP: `php-src/src/PhpSpreadsheet/Chart/{Title,Legend,PlotArea,Axis,DataSeries,DataSeriesValues,Layout}.php`).
- Keep the current “minimal” API as a convenience layer (e.g. `Chart.getTitleText()` becomes a thin wrapper over `Title`), but store the richer objects internally.

Outcome: TS can represent the same information as PhpSpreadsheet, even before full IO parity exists.

### Phase 2: Expand XLSX reader coverage (semantic extraction)

- Parse chart type and plot structure from chart XML (e.g. barChart/lineChart/pieChart/scatterChart nodes) into `DataSeries` / `PlotArea` (PHP reference: `php-src/src/PhpSpreadsheet/Chart/DataSeries.php`).
- Parse legend (`<c:legend>`), axes (`<c:catAx>`, `<c:valAx>`, `<c:dateAx>`), number formats, scaling, gridlines, and axis text into `Axis` (PHP reference: `php-src/src/PhpSpreadsheet/Chart/Axis.php`).
- Capture title text formula references (not just cached text) if present in `<c:strRef><c:f>` (to align with PHP’s `Title.cellReference`) (`php-src/src/PhpSpreadsheet/Chart/Title.php`, `src/io/xlsx-reader.ts`).

Outcome: TS can read real-world chart definitions with far higher fidelity.

### Phase 3: Expand XLSX writer coverage (semantic serialization)

- Serialize chart model objects back to OOXML:
  - Title/legend/plot area/layout nodes
  - Series with correct plot type/grouping/direction/style
  - Axes with ids allocated per chart and correct cross-axis references
  (`src/io/xlsx/charts.ts` becomes a real chart writer; drawing anchor plumbing remains in `src/io/xlsx/drawingml.ts`).

Outcome: TS can generate charts that match PhpSpreadsheet outputs for common cases.

### Phase 4: Data refresh and “calculated values” parity (optional but important)

- Implement “refresh” semantics similar to PHP:
  - Evaluate series formulas against worksheet data and maintain cached point values where needed
  - Handle multi-level series and error-to-zero conversions per PhpSpreadsheet behaviors
  (PHP reference: `php-src/src/PhpSpreadsheet/Chart/DataSeriesValues.php` and `php-src/src/PhpSpreadsheet/Chart/Chart.php#refresh`).

Outcome: TS charts can be kept consistent with worksheet edits without relying on Excel recalculation.

### Phase 5: Rendering parity (out of scope for XLSX parity, but a PHP feature)

- PhpSpreadsheet supports rendering charts to images via renderer backends (PHP reference: `php-src/src/PhpSpreadsheet/Chart/Renderer/*` and `Chart::render()` in `php-src/src/PhpSpreadsheet/Chart/Chart.php`).
- TS currently has no equivalent rendering API.

Outcome: Optional feature area if TS targets “export chart as image,” but not required for XLSX chart round-trip parity.

## Quick parity matrix

| Capability | TS status | Key TS files | PHP reference |
| --- | --- | --- | --- |
| Store chart name | Yes | `src/worksheet/chart/chart.ts` | `php-src/src/PhpSpreadsheet/Chart/Chart.php` |
| Anchor chart on worksheet | Yes | `src/worksheet/chart/chart.ts`, `src/io/xlsx/drawingml.ts` | `php-src/src/PhpSpreadsheet/Chart/Chart.php` |
| Discover embedded charts (XLSX read) | Yes (opt-in) | `src/io/xlsx-reader.ts` | PhpSpreadsheet XLSX reader (outside scope of this doc) |
| Persist chart XML part path | Yes | `src/worksheet/chart/chart.ts`, `src/io/xlsx-reader.ts` | (not a PhpSpreadsheet concept; internal TS convenience) |
| Extract title display text | Partial | `src/io/xlsx-reader.ts` | `php-src/src/PhpSpreadsheet/Chart/Title.php` |
| Extract series formulas | Partial | `src/io/xlsx-reader.ts`, `src/worksheet/chart/chart.ts` | `php-src/src/PhpSpreadsheet/Chart/{DataSeries,DataSeriesValues}.php` |
| Write charts with series + title | No | `src/io/xlsx/charts.ts` | PhpSpreadsheet XLSX writer (outside scope of this doc) |
| Legend / axes / layout support | No | (missing model + IO) | `php-src/src/PhpSpreadsheet/Chart/{Legend,Axis,Layout}.php` |
| Chart rendering | No | (missing) | `php-src/src/PhpSpreadsheet/Chart/Renderer/*` |
