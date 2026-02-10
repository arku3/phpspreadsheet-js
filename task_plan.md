# Task Plan for phpspreadsheet-js

## Current Focus
- Phase 19: Chart Support - COMPLETE <!-- id: 71 -->
  - [x] **Write actual chart data series**
  - [x] **Support multiple chart types** (bar, line, pie, scatter, doughnut, bubble, radar, stock, surface, bar3D, line3D, area3D, pie3D, surface3D)
  - [x] **Link chart data to worksheet cells**
  - [x] **Chart rendering from real data**
  - [x] **Data labels (c:dLbls) read/write**
  - [x] **Chart title font styling read/write**
  - [x] **Axis titles + gridlines read/write**
  - [x] **Axis title fonts + gridline styling (color/width) read/write**
  - [x] **Data labels styling (font, number format, fill/border colors) read/write**
  - [x] **Plot area layout (manual layout) read/write**
  - [x] **Chart area + plot area styling (fill, border, gradient)**
  - [x] **3D chart variants (bar3D/line3D/area3D/pie3D/surface3D)**
  - [x] **Combo charts (bar+line, area+line)**
  - **Current Status:** Chart series, styling, legend, data labels with styling, axis titles/gridlines with fonts/styles, title fonts, plot area layout, chart/plot area styling, 3D chart types, and combo charts implemented
  - **Tests:** 446+ tests passing including chart round-trip, type-specific, data-label, axis, styling, layout, chart area style, 3D chart, and combo chart tests

## Phase History

### Phase 1: Core Infrastructure (COMPLETE)
Spreadsheet and Worksheet classes with cell storage and A1 coordinate system.

### Phase 2: Cell Management (COMPLETE)
Cell value types, coordinate utilities, iteration, and metadata support.

### Phase 3: Basic Styling (COMPLETE)
Font, fill, border, and alignment styling for cells.

### Phase 4: Number Formatting (COMPLETE)
NumberFormat class with format code parsing and categories.

### Phase 5: Worksheet Operations (COMPLETE)
Highest row/column detection, array conversion, and row/column manipulation.

### Phase 6: Advanced Styling (COMPLETE)
Rich text, conditional formatting foundation, and ARGB color management.

### Phase 7: Formula Foundation (COMPLETE)
Formula tokenizer, parser, and cell reference resolution (A1, R1C1, cross-sheet).

### Phase 8: XLSX Writer Foundation (COMPLETE)
ZIP archive, content types, relationships, workbook and worksheet generation.

### Phase 9: XLSX Advanced Features (COMPLETE)
Styles.xml, merge cells, dimensions, sheet views, and panes.

### Phase 10: Calculation Engine Core (COMPLETE)
Calculation engine with operators and Math/Trig functions (SUM, AVERAGE, etc.).

### Phase 11: Function Categories (COMPLETE)
Statistical, Date/Time, Financial, and Logical functions (100+ total).

### Phase 12: Lookup & Reference (COMPLETE)
VLOOKUP, HLOOKUP, INDEX, MATCH, OFFSET, INDIRECT, and cross-sheet references.

### Phase 13: Engineering & Text Functions (COMPLETE)
Engineering functions (COMPLEX, CONVERT) and comprehensive text functions.

### Phase 14: Advanced Worksheet Features (COMPLETE)
Hyperlinks, data validation, comments, and page setup (margins, orientation).

### Phase 15: I/O Extension & Graphics (COMPLETE)
Writer/Reader parity review, XLSX Reader with full feature support, drawings, images, and embedded charts.

### Phase 15b: Data Validation Infrastructure (COMPLETE)
DataValidation class with comprehensive rules and XLSX read/write support.

### Phase 15c: XLSX-only Port Focus (COMPLETE)
DefinedNames, Tables with filtering, AutoFilter, worksheet views, panes, selections, visibility, and page setup.

### Phase 16: Performance & Scalability (COMPLETE)
Pluggable Cell Caching with MemoryCache and QuickLRUCache implementations.

### Phase 17: I/O Abstractions (COMPLETE)
In-memory I/O with Blob/ArrayBuffer/Uint8Array support for Reader and Writer.

### Phase 18: Formula Calculation Engine (COMPLETE)
Formula parser, tokenizer, 100+ functions, and Cell.getCalculatedValue().

### Phase 19: Chart Support (COMPLETE - 60-70% PHP Parity)
15 chart types (2D/3D), combo charts, data series, titles, legends, data labels, axis styling, plot area layout, and 3D view settings.

**Known Limitations vs PHP:**
- Missing classes: Title, Legend, PlotArea, Axis, TrendLine, ChartColor (8 total)
- DataSeries uses single values vs PHP arrays (architectural mismatch)
- Missing: trend lines, date axis, axis scaling, effects (shadow/glow), per-data-point colors
- Limited: legend styling, axis customization, color types (only srgbClr)

**Estimated parity effort:** 3-4 weeks for full feature completeness

## Upcoming Priorities

### Phase 20: Chart Parity & Advanced Features
- [ ] **Chart PHP Parity (CRITICAL)** - Close 30-40% gap vs PhpSpreadsheet
  - [ ] Missing classes: Title, Legend, PlotArea, Axis, GridLines, Properties, ChartColor, TrendLine
  - [ ] Fix DataSeries architecture (arrays vs single values)
  - [ ] Add trend lines, date axis, axis scaling
  - [ ] Add effects (shadow/glow/soft edges), per-data-point colors
  - [ ] Add cell-referenced titles, legend styling
  - [ ] Support schemeClr/sysClr color types
- [ ] Conditional formatting enhancements
- [ ] Pivot table support (Phase 21)
- [ ] Advanced chart features (error bars)
- [ ] Sparklines

### Phase 22: Documentation & Polish
- [ ] Complete API documentation
- [ ] Migration guide from PhpSpreadsheet
- [ ] Advanced usage examples
- [ ] Performance benchmarks

## Design Principles
- Use native private members (`#`) for internal state
- Strictly avoid `enum`; use `const` objects with `as const`
- Maintain strict PHP parity for public APIs
- Comprehensive test coverage for all features

## Current Statistics
- **Total Tests:** 446+ passing
- **Chart Types:** 15 supported (2D and 3D)
- **Functions:** 100+ implemented
- **Test Coverage:** Comprehensive across all modules
