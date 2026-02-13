import { create } from 'xmlbuilder2';
import type { Worksheet } from '../../core/worksheet.ts';
import { Font } from '../../style/font.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import type { Chart, ChartGradientStop, ChartLayout, GridlineStyle } from '../../worksheet/chart/chart.ts';
import { DataLabels } from '../../worksheet/chart/data-labels.ts';
import type { DataSeriesValues } from '../../worksheet/chart/data-series-values.ts';
import type { DataSeries, LineStyle } from '../../worksheet/chart/data-series.ts';
import type { Axis } from '../../worksheet/chart/index.ts';
import { TrendLine, TRENDLINE_MOVING_AVERAGE, TRENDLINE_POLYNOMIAL } from '../../worksheet/chart/trend-line.ts';

/**
 * Parse a cell range reference like 'Sheet1!$A$1:$A$5' or 'A1:A5'.
 * Returns an array of cell coordinates (e.g., ['A1', 'A2', 'A3', 'A4', 'A5']).
 */
function parseCellRangeReference(reference: string): string[] {
    if (!reference) {
        return [];
    }

    // Remove sheet name if present (e.g., 'Sheet1!$A$1:$A$5' -> '$A$1:$A$5')
    const rangePart = reference.includes('!') ? reference.split('!')[1] : reference;
    if (!rangePart) {
        return [];
    }

    // Remove $ signs (e.g., '$A$1:$A$5' -> 'A1:A5')
    const cleanRange = rangePart.replace(/\$/g, '');

    // Check if it's a single cell or a range
    if (!cleanRange.includes(':')) {
        return [cleanRange];
    }

    // Split into start and end
    const [start, end] = cleanRange.split(':');
    if (!start || !end) {
        return [cleanRange];
    }

    // Get boundaries
    const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(`${start}:${end}`);

    // Generate all cell references in the range
    const cells: string[] = [];
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            cells.push(Coordinate.stringFromColumnIndex(col) + row);
        }
    }

    return cells;
}

/**
 * Extract values from worksheet cells given a cell range reference.
 * Returns an array of values as strings.
 */
function extractCellValues(worksheet: Worksheet | null | undefined, reference: string): string[] {
    if (!worksheet || !reference) {
        return [];
    }

    const cells = parseCellRangeReference(reference);
    const values: string[] = [];

    for (const cell of cells) {
        try {
            const cellObj = worksheet.getCellCollection().get(cell);
            if (cellObj && cellObj.getValue() !== null) {
                const value = cellObj.getValue();
                // Convert value to string
                if (value !== null && value !== undefined) {
                    values.push(String(value));
                } else {
                    values.push('');
                }
            } else {
                values.push('');
            }
        } catch {
            // Cell doesn't exist or other error
            values.push('');
        }
    }

    return values;
}

/**
 * Generate unique axis IDs for charts.
 */
let axisIdCounter = 110438656;
function generateAxisId(): string {
    return (axisIdCounter++).toString();
}

/**
 * Write data series values as chart data references with cached values.
 */
function writeDataSeriesValues(
    parent: any,
    dataValues: DataSeriesValues | null,
    tagName: string = 'c:val',
    worksheet: Worksheet | null = null,
): void {
    if (!dataValues || !dataValues.getDataSource()) {
        // Write empty values if no data
        const val = parent.ele(tagName);
        const numRef = val.ele('c:numRef');
        numRef.ele('c:f').txt(dataValues?.getDataSource() ?? '');
        const numCache = numRef.ele('c:numCache');
        numCache.ele('c:formatCode').txt(dataValues?.getFormatCode() ?? 'General');
        numCache.ele('c:ptCount', { val: '0' });
        return;
    }

    const val = parent.ele(tagName);
    const dataType = dataValues.getDataType();
    const dataSource = dataValues.getDataSource();
    const formatCode = dataValues.getFormatCode() ?? 'General';

    // Extract actual cell values from the worksheet
    const cellValues = worksheet ? extractCellValues(worksheet, dataSource!) : [];
    const pointCount = Math.max(dataValues.getPointCount(), cellValues.length);

    if (dataType === 'String') {
        // String/categories reference
        const strRef = val.ele('c:strRef');
        strRef.ele('c:f').txt(dataSource);
        const strCache = strRef.ele('c:strCache');
        strCache.ele('c:ptCount', { val: pointCount.toString() });

        // Write cached string values
        for (let i = 0; i < cellValues.length; i++) {
            const pt = strCache.ele('c:pt', { idx: i.toString() });
            pt.ele('c:v').txt(cellValues[i]);
        }
    } else {
        // Number values reference
        const numRef = val.ele('c:numRef');
        numRef.ele('c:f').txt(dataSource);
        const numCache = numRef.ele('c:numCache');
        numCache.ele('c:formatCode').txt(formatCode);
        numCache.ele('c:ptCount', { val: pointCount.toString() });

        // Write cached numeric values
        for (let i = 0; i < cellValues.length; i++) {
            const pt = numCache.ele('c:pt', { idx: i.toString() });
            pt.ele('c:v').txt(cellValues[i]);
        }
    }
}

/**
 * Convert points to EMUs (English Metric Units).
 * 1 point = 12700 EMUs
 */
/**
 * Write shape properties (<c:spPr>) with fill color and line styling.
 */
const DASH_LINE_STYLES = new Set<LineStyle>([
    'solid',
    'dot',
    'dash',
    'lgDash',
    'dashDot',
    'lgDashDot',
    'lgDashDotDot',
    'sysDash',
    'sysDot',
    'sysDashDot',
    'sysDashDotDot',
]);

const SMOOTH_LINE_STYLES = new Set<LineStyle>(['smooth', 'cubic', 'cubicSpline']);
const STRAIGHT_LINE_STYLES = new Set<LineStyle>(['line', 'straight']);
const PERCENTAGE_MULTIPLIER = 100000;
const ANGLE_MULTIPLIER = 60000;

const formatColor = (argb: string): string => argb.substring(2);

function writeShapeProperties(
    parent: any,
    fillColor: string | null,
    borderColor: string | null,
    lineWidth: number | null,
    plotType: string,
    lineStyle: LineStyle | null,
): void {
    const spPr = parent.ele('c:spPr');

    // Write fill color if set
    if (fillColor) {
        const solidFill = spPr.ele('a:solidFill');
        solidFill.ele('a:srgbClr', { val: fillColor });
    }

    // Write line/border properties
    // For line charts, the line color is the main visual element
    // For bar charts, it's the border
    const lineColorToUse = borderColor ?? (plotType === 'line' || plotType === 'line3D' ? fillColor : null);

    const lineDash =
        (plotType === 'line' || plotType === 'line3D' || plotType === 'scatter') &&
        lineStyle &&
        DASH_LINE_STYLES.has(lineStyle)
            ? lineStyle
            : null;

    if (lineColorToUse || lineWidth || lineDash) {
        const lineAttrs: Record<string, string> = {};
        if (lineWidth && lineWidth > 0) {
            lineAttrs.w = lineWidth.toString();
        }
        const ln = spPr.ele('a:ln', lineAttrs);

        if (lineColorToUse) {
            const solidFill = ln.ele('a:solidFill');
            solidFill.ele('a:srgbClr', { val: lineColorToUse });
        }

        if (lineDash) {
            ln.ele('a:prstDash', { val: lineDash });
        }
    }
}

/**
 * Write data labels to chart XML.
 */
function writeDataLabels(parent: any, dataLabels: DataLabels | null): void {
    if (!dataLabels || !dataLabels.hasAnyLabel()) {
        return;
    }

    const dLbls = parent.ele('c:dLbls');

    // Write boolean flags
    const showVal = dataLabels.getShowValue();
    if (showVal !== null) {
        dLbls.ele('c:showVal', { val: showVal ? '1' : '0' });
    }

    const showCatName = dataLabels.getShowCategoryName();
    if (showCatName !== null) {
        dLbls.ele('c:showCatName', { val: showCatName ? '1' : '0' });
    }

    const showSerName = dataLabels.getShowSeriesName();
    if (showSerName !== null) {
        dLbls.ele('c:showSerName', { val: showSerName ? '1' : '0' });
    }

    const showPercent = dataLabels.getShowPercent();
    if (showPercent !== null) {
        dLbls.ele('c:showPercent', { val: showPercent ? '1' : '0' });
    }

    const showLegendKey = dataLabels.getShowLegendKey();
    if (showLegendKey !== null) {
        dLbls.ele('c:showLegendKey', { val: showLegendKey ? '1' : '0' });
    }

    const showBubbleSize = dataLabels.getShowBubbleSize();
    if (showBubbleSize !== null) {
        dLbls.ele('c:showBubbleSize', { val: showBubbleSize ? '1' : '0' });
    }

    // Write position if set
    const position = dataLabels.getPosition();
    if (position !== null) {
        dLbls.ele('c:dLblPos', { val: position });
    }

    // Write number format
    const numFmt = dataLabels.getNumberFormat();
    if (numFmt !== null) {
        const numFmtLinked = dataLabels.getNumberFormatLinked();
        dLbls.ele('c:numFmt', {
            formatCode: numFmt,
            sourceLinked: numFmtLinked !== null ? (numFmtLinked ? '1' : '0') : '0',
        });
    }

    // Write font styling (txPr)
    const font = dataLabels.getFont();
    if (font) {
        const txPr = dLbls.ele('c:txPr');
        txPr.ele('a:bodyPr');
        txPr.ele('a:lstStyle');
        const p = txPr.ele('a:p');
        const r = p.ele('a:r');
        const rPr = r.ele('a:rPr');

        const fontName = font.getName();
        if (fontName) {
            rPr.ele('a:rFont', { val: fontName });
        }
        const fontSize = font.getSize();
        if (fontSize) {
            rPr.ele('a:sz', { val: String(fontSize * 100) });
        }
        if (font.getBold()) {
            rPr.ele('a:b');
        }
        if (font.getItalic()) {
            rPr.ele('a:i');
        }
        const fontColor = font.getColor().getARGB();
        if (fontColor) {
            const solidFill = rPr.ele('a:solidFill');
            solidFill.ele('a:srgbClr', { val: fontColor.substring(2) });
        }
    }

    // Write border and fill styling (spPr)
    const fillColor = dataLabels.getFillColor();
    const borderColor = dataLabels.getBorderColor();
    if (fillColor || borderColor) {
        const spPr = dLbls.ele('c:spPr');
        if (fillColor) {
            const fillArgb = fillColor.getARGB();
            if (fillArgb) {
                const solidFill = spPr.ele('a:solidFill');
                solidFill.ele('a:srgbClr', { val: fillArgb.substring(2) });
            }
        }
        if (borderColor) {
            const borderArgb = borderColor.getARGB();
            if (borderArgb) {
                const ln = spPr.ele('a:ln');
                ln.ele('a:solidFill').ele('a:srgbClr', { val: borderArgb.substring(2) });
            }
        }
    }
}

/**
 * Write an axis title element with optional font styling.
 */
function writeAxisTitle(parent: any, titleText: string, font: Font | null = null): void {
    const title = parent.ele('c:title');
    const tx = title.ele('c:tx');
    const rich = tx.ele('c:rich');
    rich.ele('a:bodyPr');
    rich.ele('a:lstStyle');
    const p = rich.ele('a:p');
    const r = p.ele('a:r');

    // Write font properties if provided
    if (font) {
        const rPr = r.ele('a:rPr');
        const fontName = font.getName();
        if (fontName) {
            rPr.ele('a:rFont', { val: fontName });
        }
        const fontSize = font.getSize();
        if (fontSize) {
            rPr.ele('a:sz', { val: String(fontSize * 100) }); // Font size in hundredths of a point
        }
        if (font.getBold()) {
            rPr.ele('a:b');
        }
        if (font.getItalic()) {
            rPr.ele('a:i');
        }
        const fontColor = font.getColor().getARGB();
        if (fontColor) {
            rPr.ele('a:solidFill').ele('a:srgbClr', { val: fontColor });
        }
    }

    r.ele('a:t').txt(titleText);
    title.ele('c:layout');
    title.ele('c:overlay', { val: '0' });
}

/**
 * Write gridlines with optional styling.
 */
function writeGridlines(parent: any, major: boolean, style: GridlineStyle | null): void {
    const gridlines = parent.ele(major ? 'c:majorGridlines' : 'c:minorGridlines');
    if (style && (style.color || style.width)) {
        const spPr = gridlines.ele('c:spPr');
        if (style.color) {
            const ln = spPr.ele('a:ln');
            if (style.width !== null && style.width !== undefined) {
                ln.att('w', String(style.width * 12700)); // Width in EMUs
            }
            ln.ele('a:solidFill').ele('a:srgbClr', { val: style.color });
        }
    }
}

/**
 * Write axis scaling properties.
 */
function writeAxisScaling(parent: any, axis: Axis | null): void {
    const scaling = parent.ele('c:scaling');

    if (axis) {
        const orientation = axis.getOrientation();
        if (orientation) {
            scaling.ele('c:orientation', { val: orientation });
        }

        const logBase = axis.getLogBase();
        if (logBase !== null && logBase > 0) {
            scaling.ele('c:logBase', { val: String(logBase) });
        }

        const min = axis.getMin();
        if (min !== null) {
            scaling.ele('c:min', { val: String(min) });
        }

        const max = axis.getMax();
        if (max !== null) {
            scaling.ele('c:max', { val: String(max) });
        }
    } else {
        scaling.ele('c:orientation', { val: 'minMax' });
    }
}

/**
 * Write chart area shape properties (<c:spPr>).
 */
function writeChartAreaProperties(parent: any, chart: Chart): void {
    const noFill = chart.getChartAreaNoFill();
    const fillColor = chart.getChartAreaFillColor();
    const borderStyle = chart.getChartAreaBorderStyle();
    const noBorder = chart.getChartAreaNoBorder();

    if (!noFill && !fillColor && !borderStyle && !noBorder) {
        return;
    }

    const spPr = parent.ele('c:spPr');

    if (noFill) {
        spPr.ele('a:noFill');
    } else if (fillColor) {
        const fillArgb = fillColor.getARGB();
        if (fillArgb) {
            spPr.ele('a:solidFill').ele('a:srgbClr', { val: formatColor(fillArgb) });
        }
    }

    if (!noBorder && borderStyle) {
        const borderColor = borderStyle.color;
        const borderWidth = borderStyle.width;
        if (borderColor || borderWidth) {
            const lineAttrs: Record<string, string> = {};
            if (borderWidth !== null && borderWidth !== undefined && borderWidth > 0) {
                lineAttrs.w = String(borderWidth * 12700);
            }
            const ln = spPr.ele('a:ln', lineAttrs);
            if (borderColor) {
                const borderArgb = borderColor.getARGB();
                if (borderArgb) {
                    ln.ele('a:solidFill').ele('a:srgbClr', { val: formatColor(borderArgb) });
                }
            }
        }
    }
}

const writeGradientStops = (gradFill: any, stops: ChartGradientStop[]): void => {
    const gsLst = gradFill.ele('a:gsLst');
    stops.forEach((stop) => {
        const pos = Math.round(stop.position * PERCENTAGE_MULTIPLIER);
        const gs = gsLst.ele('a:gs', { pos: String(pos) });
        const argb = stop.color.getARGB();
        if (argb) {
            gs.ele('a:srgbClr', { val: formatColor(argb) });
        }
    });
};

/**
 * Write plot area shape properties (<c:spPr>).
 */
function writePlotAreaProperties(parent: any, chart: Chart): void {
    const noFill = chart.getPlotAreaNoFill();
    const gradientStops = chart.getPlotAreaGradientStops();
    const gradientAngle = chart.getPlotAreaGradientAngle();

    if (!noFill && gradientStops.length === 0 && gradientAngle === null) {
        return;
    }

    const spPr = parent.ele('c:spPr');

    if (noFill) {
        spPr.ele('a:noFill');
    }

    if (gradientStops.length > 0) {
        const gradFill = spPr.ele('a:gradFill');
        writeGradientStops(gradFill, gradientStops);
        if (gradientAngle !== null) {
            gradFill.ele('a:lin', { ang: String(Math.round(gradientAngle * ANGLE_MULTIPLIER)) });
        }
    }
}

/**
 * Write plot area layout configuration.
 */
function writePlotAreaLayout(parent: any, layout: ChartLayout | null): void {
    if (!layout) {
        parent.ele('c:layout');
        return;
    }

    const layoutElement = parent.ele('c:layout');
    const manualLayout = layoutElement.ele('c:manualLayout');

    if (layout.layoutTarget) {
        manualLayout.ele('c:layoutTarget', { val: layout.layoutTarget });
    }
    if (layout.xMode) {
        manualLayout.ele('c:xMode', { val: layout.xMode });
    }
    if (layout.yMode) {
        manualLayout.ele('c:yMode', { val: layout.yMode });
    }
    if (layout.x !== null && layout.x !== undefined) {
        manualLayout.ele('c:x', { val: String(layout.x) });
    }
    if (layout.y !== null && layout.y !== undefined) {
        manualLayout.ele('c:y', { val: String(layout.y) });
    }
    if (layout.w !== null && layout.w !== undefined) {
        manualLayout.ele('c:w', { val: String(layout.w) });
    }
    if (layout.h !== null && layout.h !== undefined) {
        manualLayout.ele('c:h', { val: String(layout.h) });
    }
}

/**
 * Get chart type element name from plot type.
 */
function getChartTypeElement(plotType: string): string {
    switch (plotType) {
        case 'bar':
            return 'c:barChart';
        case 'bar3D':
            return 'c:bar3DChart';
        case 'line':
            return 'c:lineChart';
        case 'line3D':
            return 'c:line3DChart';
        case 'pie':
            return 'c:pieChart';
        case 'pie3D':
            return 'c:pie3DChart';
        case 'doughnut':
            return 'c:doughnutChart';
        case 'area':
            return 'c:areaChart';
        case 'area3D':
            return 'c:area3DChart';
        case 'scatter':
            return 'c:scatterChart';
        case 'bubble':
            return 'c:bubbleChart';
        case 'radar':
            return 'c:radarChart';
        case 'stock':
            return 'c:stockChart';
        case 'surface':
            return 'c:surfaceChart';
        case 'surface3D':
            return 'c:surface3DChart';
        default:
            return 'c:barChart';
    }
}

/**
 * Check if a plot type is a pie/doughnut chart (cannot be combined in combo charts).
 */
function isPieChartType(plotType: string): boolean {
    return plotType === 'pie' || plotType === 'pie3D' || plotType === 'doughnut';
}

/**
 * Group data series by their plot type.
 */
function groupSeriesByPlotType(dataSeriesList: DataSeries[]): Map<string, DataSeries[]> {
    const groups = new Map<string, DataSeries[]>();

    for (const series of dataSeriesList) {
        const plotType = series.getPlotType();
        if (!groups.has(plotType)) {
            groups.set(plotType, []);
        }
        groups.get(plotType)!.push(series);
    }

    return groups;
}

/**
 * Write a trend line element (<c:trendline>) to chart XML.
 */
function writeTrendLine(parent: any, trendLine: TrendLine, plotType: string): void {
    const trendlineEl = parent.ele('c:trendline');

    // Write name if set
    const name = trendLine.getName();
    if (name) {
        trendlineEl.ele('c:name').txt(name);
    }

    // Write shape properties with line styling
    const lineColor = trendLine.getLineColor();
    const lineWidth = trendLine.getLineWidth();
    const lineStyle = trendLine.getLineStyle();

    if (lineColor || lineWidth !== null || lineStyle) {
        const spPr = trendlineEl.ele('c:spPr');
        const lineAttrs: Record<string, string> = {};
        if (lineWidth !== null && lineWidth > 0) {
            lineAttrs.w = String(lineWidth);
        }
        const ln = spPr.ele('a:ln', lineAttrs);

        if (lineColor && lineColor.isUsable()) {
            const colorValue = lineColor.getValue();
            const colorType = lineColor.getType();
            if (colorValue) {
                if (colorType === 'srgbClr' || colorType === '') {
                    ln.ele('a:solidFill').ele('a:srgbClr', { val: colorValue });
                }
            }
        }

        if (lineStyle) {
            ln.ele('a:prstDash', { val: lineStyle });
        }
    }

    // Write trend line type
    const trendLineType = trendLine.getTrendLineType();
    trendlineEl.ele('c:trendlineType', { val: trendLineType });

    // Write backward value if not 0
    const backward = trendLine.getBackward();
    if (backward !== 0.0) {
        trendlineEl.ele('c:backward', { val: String(backward) });
    }

    // Write forward value if not 0
    const forward = trendLine.getForward();
    if (forward !== 0.0) {
        trendlineEl.ele('c:forward', { val: String(forward) });
    }

    // Write intercept value if not 0
    const intercept = trendLine.getIntercept();
    if (intercept !== 0.0) {
        trendlineEl.ele('c:intercept', { val: String(intercept) });
    }

    // Write order for polynomial trend lines
    if (trendLineType === TRENDLINE_POLYNOMIAL) {
        const order = trendLine.getOrder();
        trendlineEl.ele('c:order', { val: String(order) });
    }

    // Write period for moving average trend lines
    if (trendLineType === TRENDLINE_MOVING_AVERAGE) {
        const period = trendLine.getPeriod();
        trendlineEl.ele('c:period', { val: String(period) });
    }

    // Write display R-squared value
    const dispRSqr = trendLine.getDisplayRSquared();
    trendlineEl.ele('c:dispRSqr', { val: dispRSqr ? '1' : '0' });

    // Write display equation value
    const dispEq = trendLine.getDisplayEquation();
    trendlineEl.ele('c:dispEq', { val: dispEq ? '1' : '0' });

    // Write trend line label for scatter and line charts
    if (plotType === 'scatter' || plotType === 'line') {
        const trendlineLbl = trendlineEl.ele('c:trendlineLbl');
        trendlineLbl.ele('c:layout');
        trendlineLbl.ele('c:numFmt', { formatCode: 'General', sourceLinked: '0' });
    }
}

/**
 * Write all trend lines for a data series values object.
 */
function writeTrendLines(parent: any, plotValues: DataSeriesValues | null, plotType: string): void {
    if (!plotValues) {
        return;
    }

    const trendLines = plotValues.getTrendLines();
    for (const trendLine of trendLines) {
        writeTrendLine(parent, trendLine, plotType);
    }
}

/**
 * Write a single data series element (<c:ser>) to chart XML.
 * This writes only the series content, not the chart type wrapper.
 */
function writeDataSeriesElement(
    parent: any,
    dataSeries: DataSeries,
    seriesIndex: number,
    worksheet: Worksheet | null = null,
): void {
    const plotType = dataSeries.getPlotType();
    const lineStyle = dataSeries.getLineStyle();

    // Write the data series
    const series = parent.ele('c:ser');
    series.ele('c:idx', { val: seriesIndex.toString() });
    series.ele('c:order', { val: dataSeries.getPlotOrder().toString() });

    // Write shape properties (fill color, border/line styling)
    const fillColor = dataSeries.getFillColor();
    const borderColor = dataSeries.getBorderColor();
    const lineWidth = dataSeries.getLineWidth();
    writeShapeProperties(series, fillColor, borderColor, lineWidth, plotType, lineStyle);

    if (plotType === 'line' || plotType === 'line3D' || plotType === 'scatter') {
        const markerSymbol = dataSeries.getMarkerSymbol();
        if (markerSymbol !== null) {
            const marker = series.ele('c:marker');
            marker.ele('c:symbol', { val: markerSymbol });
            if (markerSymbol !== 'none') {
                marker.ele('c:size', { val: dataSeries.getMarkerSize().toString() });
            }
        }
    }

    if (plotType === 'scatter') {
        const smoothScatter = dataSeries.getSmoothLine() || (lineStyle !== null && SMOOTH_LINE_STYLES.has(lineStyle));
        if (smoothScatter) {
            series.ele('c:smooth', { val: '1' });
        }
    }

    // Write series label (legend entry)
    const plotLabels = dataSeries.getPlotLabels();
    if (plotLabels.length > 0 && plotLabels[0]) {
        writeDataSeriesValues(series, plotLabels[0], 'c:tx', worksheet);
    }

    // Write category axis data
    const categoryTag = plotType === 'scatter' ? 'c:xVal' : 'c:cat';
    const plotCategories = dataSeries.getPlotCategories();
    if (plotCategories.length > 0 && plotCategories[0]) {
        writeDataSeriesValues(series, plotCategories[0], categoryTag, worksheet);
    }

    // Write values data
    const plotValues = dataSeries.getPlotValues();
    if (plotValues.length > 0 && plotValues[0]) {
        const valueTag = plotType === 'scatter' ? 'c:yVal' : 'c:val';
        writeDataSeriesValues(series, plotValues[0], valueTag, worksheet);

        // Write trend lines for this series
        writeTrendLines(series, plotValues[0], plotType);
    }
}

/**
 * Write a chart type block with all series of that type.
 * This creates the chart type element (e.g., <c:barChart>) containing all series.
 */
function writeChartTypeBlock(
    parent: any,
    plotType: string,
    seriesList: DataSeries[],
    startSeriesIndex: number,
    catAxId: string,
    valAxId: string,
    serAxId: string | null,
    worksheet: Worksheet | null = null,
): number {
    const chartType = getChartTypeElement(plotType);
    const chartElement = parent.ele(chartType);

    // Get representative series for type-specific attributes
    const firstSeries = seriesList[0];
    const lineStyle = firstSeries?.getLineStyle() ?? null;

    // Write chart type specific attributes
    if (plotType === 'bar' || plotType === 'bar3D') {
        const direction = firstSeries?.getDirection() ?? 'col';
        chartElement.ele('c:barDir', { val: direction });
        const grouping = firstSeries?.getGrouping() ?? 'clustered';
        chartElement.ele('c:grouping', { val: grouping });
        chartElement.ele('c:gapWidth', { val: '150' });
        if (grouping === 'stacked' || grouping === 'percentStacked') {
            chartElement.ele('c:overlap', { val: '100' });
        }
    } else if (plotType === 'line' || plotType === 'line3D') {
        chartElement.ele('c:grouping', { val: firstSeries?.getGrouping() ?? 'standard' });
        let smoothValue: boolean | null = null;
        if (plotType === 'line') {
            if (firstSeries?.getSmoothLine()) {
                smoothValue = true;
            } else if (lineStyle && SMOOTH_LINE_STYLES.has(lineStyle)) {
                smoothValue = true;
            } else if (lineStyle && STRAIGHT_LINE_STYLES.has(lineStyle)) {
                smoothValue = false;
            }
        }
        if (smoothValue !== null) {
            chartElement.ele('c:smooth', { val: smoothValue ? '1' : '0' });
        }
    } else if (plotType === 'scatter') {
        const markerSymbol = firstSeries?.getMarkerSymbol();
        const smoothScatter = firstSeries?.getSmoothLine() || (lineStyle !== null && SMOOTH_LINE_STYLES.has(lineStyle));
        if (smoothScatter) {
            chartElement.ele('c:scatterStyle', {
                val: markerSymbol && markerSymbol !== 'none' ? 'smoothMarker' : 'smooth',
            });
        } else if (markerSymbol && markerSymbol !== 'none') {
            chartElement.ele('c:scatterStyle', { val: 'lineMarker' });
        } else {
            chartElement.ele('c:scatterStyle', { val: 'line' });
        }
    } else if (plotType === 'pie' || plotType === 'pie3D') {
        chartElement.ele('c:firstSliceAng', { val: '0' });
    } else if (plotType === 'doughnut') {
        chartElement.ele('c:firstSliceAng', { val: '0' });
        chartElement.ele('c:holeSize', { val: '50' });
    } else if (plotType === 'area' || plotType === 'area3D') {
        chartElement.ele('c:grouping', { val: firstSeries?.getGrouping() ?? 'standard' });
    } else if (plotType === 'bubble') {
        chartElement.ele('c:bubbleScale', { val: '100' });
        chartElement.ele('c:showNegBubbles', { val: '0' });
    } else if (plotType === 'radar') {
        chartElement.ele('c:radarStyle', { val: 'marker' });
    } else if (plotType === 'surface' || plotType === 'surface3D') {
        chartElement.ele('c:wireframe', { val: '0' });
    }

    // varyColors: 1 for pie/doughnut or if multiple series, 0 otherwise
    const varyColors = isPieChartType(plotType) || seriesList.length > 1 ? '1' : '0';
    chartElement.ele('c:varyColors', { val: varyColors });

    // Write all series for this chart type
    let seriesIndex = startSeriesIndex;
    for (const dataSeries of seriesList) {
        writeDataSeriesElement(chartElement, dataSeries, seriesIndex, worksheet);
        seriesIndex++;
    }

    // Write data labels if configured for any series in this group
    // Note: For combo charts, data labels are typically configured per chart type block
    for (const dataSeries of seriesList) {
        const dataLabels = dataSeries.getDataLabels();
        if (dataLabels && dataLabels.hasAnyLabel()) {
            writeDataLabels(chartElement, dataLabels);
            break; // Only write once per chart type block
        }
    }

    // Add axis references for non-pie charts
    if (!isPieChartType(plotType)) {
        chartElement.ele('c:axId', { val: catAxId });
        chartElement.ele('c:axId', { val: valAxId });
        if ((plotType === 'surface' || plotType === 'surface3D') && serAxId) {
            chartElement.ele('c:axId', { val: serAxId });
        }
    }

    return seriesIndex;
}

/**
 * Write a minimal valid chart XML part with actual data series.
 *
 * @param chart - The Chart object containing data series
 * @param worksheet - The worksheet containing the chart data (optional, defaults to chart's worksheet)
 * @returns XML string for the chart part
 */
export const writeChartXml = (chart: Chart, worksheet?: Worksheet): string => {
    // Get worksheet from chart if not provided
    const chartWorksheet = worksheet ?? chart.getWorksheet();

    const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('c:chartSpace', {
        'xmlns:c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
        'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    });

    // Match common defaults used by typical writers.
    root.ele('c:date1904', { val: '0' });
    root.ele('c:lang', { val: 'en-US' });
    root.ele('c:roundedCorners', { val: '0' });

    const chartElement = root.ele('c:chart');

    // Chart title (if set)
    const titleText = chart.getTitleText();
    if (titleText) {
        const title = chartElement.ele('c:title');
        const tx = title.ele('c:tx');
        const rich = tx.ele('c:rich');
        rich.ele('a:bodyPr');
        rich.ele('a:lstStyle');
        const p = rich.ele('a:p');
        const r = p.ele('a:r');

        // Write font properties if provided
        const titleFont = chart.getTitleFont();
        if (titleFont) {
            const rPr = r.ele('a:rPr');
            const fontName = titleFont.getName();
            if (fontName) {
                rPr.ele('a:rFont', { val: fontName });
            }
            const fontSize = titleFont.getSize();
            if (fontSize) {
                rPr.ele('a:sz', { val: String(fontSize * 100) });
            }
            if (titleFont.getBold()) {
                rPr.ele('a:b');
            }
            if (titleFont.getItalic()) {
                rPr.ele('a:i');
            }
            const fontColor = titleFont.getColor().getARGB();
            if (fontColor) {
                const solidFill = rPr.ele('a:solidFill');
                solidFill.ele('a:srgbClr', { val: fontColor.substring(2) });
            }
        }

        r.ele('a:t').txt(titleText);
        title.ele('c:layout');
        title.ele('c:overlay', { val: '0' });
    }

    // Chart area styling
    writeChartAreaProperties(chartElement, chart);

    // Get data series from the chart
    const dataSeriesList = chart.getPlotArea();

    // View 3D settings (surface charts need defaults)
    const surface2D = dataSeriesList.some((ds) => ds.getPlotType() === 'surface');
    const view3D = chartElement.ele('c:view3D');
    const writeView3D = (tag: string, value: number | null, fallback: number | null): void => {
        const finalValue = value ?? fallback;
        if (finalValue === null) {
            return;
        }
        view3D.ele(tag, { val: String(finalValue) });
    };
    writeView3D('c:rotX', chart.getRotX(), surface2D ? 90 : null);
    writeView3D('c:rotY', chart.getRotY(), surface2D ? 0 : null);
    writeView3D('c:rAngAx', chart.getRAngAx(), surface2D ? 0 : null);
    writeView3D('c:perspective', chart.getPerspective(), surface2D ? 0 : null);

    // Plot area with data series
    const plotArea = chartElement.ele('c:plotArea');
    writePlotAreaLayout(plotArea, chart.getPlotAreaLayout());
    writePlotAreaProperties(plotArea, chart);

    // Generate axis IDs
    const catAxId = generateAxisId();
    const valAxId = generateAxisId();
    const serAxId =
        chart.getSerAxisId() ??
        (dataSeriesList.some((ds) => ds.getPlotType() === 'surface' || ds.getPlotType() === 'surface3D')
            ? generateAxisId()
            : null);

    if (dataSeriesList.length === 0) {
        // Fallback: write minimal scaffold if no data series
        const barChart = plotArea.ele('c:barChart');
        barChart.ele('c:barDir', { val: 'col' });
        barChart.ele('c:grouping', { val: 'clustered' });
        barChart.ele('c:varyColors', { val: '0' });
        barChart.ele('c:axId', { val: catAxId });
        barChart.ele('c:axId', { val: valAxId });
    } else {
        // Group series by plotType for combo chart support
        const seriesGroups = groupSeriesByPlotType(dataSeriesList);

        // Check if we have pie/doughnut charts (they can't be combined)
        const hasPieChart = Array.from(seriesGroups.keys()).some(isPieChartType);

        if (hasPieChart) {
            // For pie charts, only write the pie chart type (can't be combined)
            // Priority: doughnut > pie3D > pie
            let pieType: string | null = null;
            if (seriesGroups.has('doughnut')) {
                pieType = 'doughnut';
            } else if (seriesGroups.has('pie3D')) {
                pieType = 'pie3D';
            } else if (seriesGroups.has('pie')) {
                pieType = 'pie';
            }

            if (pieType) {
                const pieSeriesList = seriesGroups.get(pieType)!;
                writeChartTypeBlock(plotArea, pieType, pieSeriesList, 0, catAxId, valAxId, serAxId, chartWorksheet);
            }
        } else {
            // Write each chart type group (combo charts)
            let seriesIndex = 0;
            for (const [plotType, seriesList] of seriesGroups) {
                seriesIndex = writeChartTypeBlock(
                    plotArea,
                    plotType,
                    seriesList,
                    seriesIndex,
                    catAxId,
                    valAxId,
                    serAxId,
                    chartWorksheet,
                );
            }
        }
    }

    // Add axes (not for pie charts)
    const hasPieChart = dataSeriesList.some(
        (ds) => ds.getPlotType() === 'pie' || ds.getPlotType() === 'pie3D' || ds.getPlotType() === 'doughnut',
    );
    const primaryPlotType = dataSeriesList[0]?.getPlotType() ?? 'bar';
    const useScatterAxes = primaryPlotType === 'scatter' || primaryPlotType === 'bubble';

    if (!hasPieChart) {
        if (useScatterAxes) {
            // X value axis
            {
                const xValAx = plotArea.ele('c:valAx');
                xValAx.ele('c:axId', { val: catAxId });
                writeAxisScaling(xValAx, chart.getXAxis());
                xValAx.ele('c:delete', { val: '0' });
                xValAx.ele('c:axPos', { val: 'b' });
                xValAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
                const xAxisTitle = chart.getXAxisTitle();
                const xAxisTitleFont = chart.getXAxisTitleFont();
                if (xAxisTitle) {
                    writeAxisTitle(xValAx, xAxisTitle, xAxisTitleFont);
                }
                const xMajorGrid = chart.getXAxisMajorGridlines();
                if (xMajorGrid === true || xMajorGrid === null) {
                    writeGridlines(xValAx, true, chart.getXAxisMajorGridlineStyle());
                }
                if (chart.getXAxisMinorGridlines() === true) {
                    writeGridlines(xValAx, false, chart.getXAxisMinorGridlineStyle());
                }
                xValAx.ele('c:majorTickMark', { val: 'out' });
                xValAx.ele('c:minorTickMark', { val: 'none' });
                xValAx.ele('c:tickLblPos', { val: 'nextTo' });
                xValAx.ele('c:crossAx', { val: valAxId });
                xValAx.ele('c:crosses', { val: 'autoZero' });
                xValAx.ele('c:crossBetween', { val: 'between' });
            }

            // Y value axis
            {
                const valAx = plotArea.ele('c:valAx');
                valAx.ele('c:axId', { val: valAxId });
                writeAxisScaling(valAx, chart.getYAxis());
                valAx.ele('c:delete', { val: '0' });
                valAx.ele('c:axPos', { val: 'l' });
                const yAxisTitle = chart.getYAxisTitle();
                const yAxisTitleFont = chart.getYAxisTitleFont();
                if (yAxisTitle) {
                    writeAxisTitle(valAx, yAxisTitle, yAxisTitleFont);
                }
                const yMajorGridlines = chart.getYAxisMajorGridlines();
                if (yMajorGridlines === null || yMajorGridlines === true) {
                    writeGridlines(valAx, true, chart.getYAxisMajorGridlineStyle());
                }
                if (chart.getYAxisMinorGridlines() === true) {
                    writeGridlines(valAx, false, chart.getYAxisMinorGridlineStyle());
                }
                valAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
                valAx.ele('c:majorTickMark', { val: 'out' });
                valAx.ele('c:minorTickMark', { val: 'none' });
                valAx.ele('c:tickLblPos', { val: 'nextTo' });
                valAx.ele('c:crossAx', { val: catAxId });
                valAx.ele('c:crosses', { val: 'autoZero' });
                valAx.ele('c:crossBetween', { val: 'between' });
            }
        } else {
            // Category axis
            {
                const catAx = plotArea.ele('c:catAx');
                catAx.ele('c:axId', { val: catAxId });
                writeAxisScaling(catAx, chart.getXAxis());
                catAx.ele('c:delete', { val: '0' });
                catAx.ele('c:axPos', { val: 'b' });
                catAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
                const xAxisTitle = chart.getXAxisTitle();
                const xAxisTitleFont = chart.getXAxisTitleFont();
                if (xAxisTitle) {
                    writeAxisTitle(catAx, xAxisTitle, xAxisTitleFont);
                }
                if (chart.getXAxisMajorGridlines() === true) {
                    writeGridlines(catAx, true, chart.getXAxisMajorGridlineStyle());
                }
                if (chart.getXAxisMinorGridlines() === true) {
                    writeGridlines(catAx, false, chart.getXAxisMinorGridlineStyle());
                }
                catAx.ele('c:majorTickMark', { val: 'out' });
                catAx.ele('c:minorTickMark', { val: 'none' });
                catAx.ele('c:tickLblPos', { val: 'nextTo' });
                catAx.ele('c:crossAx', { val: valAxId });
                catAx.ele('c:crosses', { val: 'autoZero' });
                catAx.ele('c:auto', { val: '1' });
                catAx.ele('c:lblAlgn', { val: 'ctr' });
                catAx.ele('c:lblOffset', { val: '100' });
            }

            // Value axis
            {
                const valAx = plotArea.ele('c:valAx');
                valAx.ele('c:axId', { val: valAxId });
                writeAxisScaling(valAx, chart.getYAxis());
                valAx.ele('c:delete', { val: '0' });
                valAx.ele('c:axPos', { val: 'l' });
                const yAxisTitle = chart.getYAxisTitle();
                const yAxisTitleFont = chart.getYAxisTitleFont();
                if (yAxisTitle) {
                    writeAxisTitle(valAx, yAxisTitle, yAxisTitleFont);
                }
                const yMajorGridlines = chart.getYAxisMajorGridlines();
                if (yMajorGridlines === null || yMajorGridlines === true) {
                    writeGridlines(valAx, true, chart.getYAxisMajorGridlineStyle());
                }
                if (chart.getYAxisMinorGridlines() === true) {
                    writeGridlines(valAx, false, chart.getYAxisMinorGridlineStyle());
                }
                valAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
                valAx.ele('c:majorTickMark', { val: 'out' });
                valAx.ele('c:minorTickMark', { val: 'none' });
                valAx.ele('c:tickLblPos', { val: 'nextTo' });
                valAx.ele('c:crossAx', { val: catAxId });
                valAx.ele('c:crosses', { val: 'autoZero' });
                valAx.ele('c:crossBetween', { val: 'between' });
            }

            if (serAxId) {
                const serAx = plotArea.ele('c:serAx');
                serAx.ele('c:axId', { val: serAxId });
                const scaling = serAx.ele('c:scaling');
                scaling.ele('c:orientation', { val: 'minMax' });
                serAx.ele('c:delete', { val: '0' });
                serAx.ele('c:axPos', { val: 'b' });
                serAx.ele('c:majorTickMark', { val: 'out' });
                serAx.ele('c:minorTickMark', { val: 'none' });
                serAx.ele('c:tickLblPos', { val: 'nextTo' });
                serAx.ele('c:crossAx', { val: valAxId });
                serAx.ele('c:crosses', { val: 'autoZero' });
            }
        }
    }

    // Write legend if position is not 'none'
    const legendPosition = chart.getLegendPosition();
    if (legendPosition && legendPosition !== 'none') {
        const legend = chartElement.ele('c:legend');

        const legendTitle = chart.getLegendTitle();
        if (legendTitle) {
            const tx = legend.ele('c:tx');
            const rich = tx.ele('c:rich');
            rich.ele('a:bodyPr');
            rich.ele('a:lstStyle');
            const p = rich.ele('a:p');
            const r = p.ele('a:r');
            r.ele('a:t').txt(legendTitle);
        }

        // Map position to chart legend position values
        const positionMap: Record<string, string> = {
            top: 't',
            bottom: 'b',
            left: 'l',
            right: 'r',
        };
        legend.ele('c:legendPos', { val: positionMap[legendPosition] ?? 'r' });

        // Write layout element
        legend.ele('c:layout');

        // Write overlay
        const overlay = chart.getLegendOverlay() ? '1' : '0';
        legend.ele('c:overlay', { val: overlay });
    }

    chartElement.ele('c:plotVisOnly', { val: '1' });
    chartElement.ele('c:dispBlanksAs', { val: 'gap' });
    chartElement.ele('c:showDLblsOverMax', { val: '0' });

    return root.end({ prettyPrint: true });
};
