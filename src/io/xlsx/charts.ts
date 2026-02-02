import { create } from 'xmlbuilder2';
import type { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import type { Chart } from '../../worksheet/chart/chart.ts';
import { DataLabels } from '../../worksheet/chart/data-labels.ts';
import type { DataSeriesValues } from '../../worksheet/chart/data-series-values.ts';
import type { DataSeries, LineStyle } from '../../worksheet/chart/data-series.ts';

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
    const lineColorToUse = borderColor ?? (plotType === 'line' ? fillColor : null);

    const lineDash =
        (plotType === 'line' || plotType === 'scatter') && lineStyle && DASH_LINE_STYLES.has(lineStyle)
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
}

/**
 * Write an axis title element.
 */
function writeAxisTitle(parent: any, titleText: string): void {
    const title = parent.ele('c:title');
    const tx = title.ele('c:tx');
    const rich = tx.ele('c:rich');
    rich.ele('a:bodyPr');
    rich.ele('a:lstStyle');
    const p = rich.ele('a:p');
    const r = p.ele('a:r');
    r.ele('a:t').txt(titleText);
    title.ele('c:layout');
    title.ele('c:overlay', { val: '0' });
}

/**
 * Write a single data series to chart XML.
 */
function writeDataSeries(
    parent: any,
    dataSeries: DataSeries,
    seriesIndex: number,
    catAxId: string,
    valAxId: string,
    worksheet: Worksheet | null = null,
): void {
    const plotType = dataSeries.getPlotType();

    // Determine chart type element
    let chartType: string;
    switch (plotType) {
        case 'bar':
            chartType = 'c:barChart';
            break;
        case 'line':
            chartType = 'c:lineChart';
            break;
        case 'pie':
            chartType = 'c:pieChart';
            break;
        case 'doughnut':
            chartType = 'c:doughnutChart';
            break;
        case 'area':
            chartType = 'c:areaChart';
            break;
        case 'scatter':
            chartType = 'c:scatterChart';
            break;
        default:
            chartType = 'c:barChart'; // Default to bar
    }

    const chartElement = parent.ele(chartType);

    // Write chart type specific attributes
    const lineStyle = dataSeries.getLineStyle();

    if (plotType === 'bar') {
        const direction = dataSeries.getDirection() ?? 'col';
        chartElement.ele('c:barDir', { val: direction });
        const grouping = dataSeries.getGrouping() ?? 'clustered';
        chartElement.ele('c:grouping', { val: grouping });
        chartElement.ele('c:gapWidth', { val: '150' });
        if (grouping === 'stacked' || grouping === 'percentStacked') {
            chartElement.ele('c:overlap', { val: '100' });
        }
    } else if (plotType === 'line') {
        chartElement.ele('c:grouping', { val: dataSeries.getGrouping() ?? 'standard' });
        let smoothValue: boolean | null = null;
        if (dataSeries.getSmoothLine()) {
            smoothValue = true;
        } else if (lineStyle && SMOOTH_LINE_STYLES.has(lineStyle)) {
            smoothValue = true;
        } else if (lineStyle && STRAIGHT_LINE_STYLES.has(lineStyle)) {
            smoothValue = false;
        }
        if (smoothValue !== null) {
            chartElement.ele('c:smooth', { val: smoothValue ? '1' : '0' });
        }
    } else if (plotType === 'scatter') {
        const markerSymbol = dataSeries.getMarkerSymbol();
        const smoothScatter = dataSeries.getSmoothLine() || (lineStyle !== null && SMOOTH_LINE_STYLES.has(lineStyle));
        if (smoothScatter) {
            chartElement.ele('c:scatterStyle', {
                val: markerSymbol && markerSymbol !== 'none' ? 'smoothMarker' : 'smooth',
            });
        } else if (markerSymbol && markerSymbol !== 'none') {
            chartElement.ele('c:scatterStyle', { val: 'lineMarker' });
        } else {
            chartElement.ele('c:scatterStyle', { val: 'line' });
        }
    } else if (plotType === 'pie') {
        chartElement.ele('c:firstSliceAng', { val: '0' });
    } else if (plotType === 'doughnut') {
        chartElement.ele('c:firstSliceAng', { val: '0' });
        chartElement.ele('c:holeSize', { val: '50' });
    }

    const varyColors = plotType === 'pie' || plotType === 'doughnut' ? '1' : '0';
    chartElement.ele('c:varyColors', { val: varyColors });

    // Write the data series
    const series = chartElement.ele('c:ser');
    series.ele('c:idx', { val: seriesIndex.toString() });
    series.ele('c:order', { val: dataSeries.getPlotOrder().toString() });

    // Write shape properties (fill color, border/line styling)
    const fillColor = dataSeries.getFillColor();
    const borderColor = dataSeries.getBorderColor();
    const lineWidth = dataSeries.getLineWidth();
    writeShapeProperties(series, fillColor, borderColor, lineWidth, plotType, lineStyle);

    if (plotType === 'line' || plotType === 'scatter') {
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
    if (dataSeries.getPlotLabel()) {
        writeDataSeriesValues(series, dataSeries.getPlotLabel(), 'c:tx', worksheet);
    }

    // Write category axis data
    const categoryTag = plotType === 'scatter' ? 'c:xVal' : 'c:cat';
    writeDataSeriesValues(series, dataSeries.getPlotCategory(), categoryTag, worksheet);

    // Write values data
    const plotValues = dataSeries.getPlotValues();
    if (plotValues.length > 0 && plotValues[0]) {
        const valueTag = plotType === 'scatter' ? 'c:yVal' : 'c:val';
        writeDataSeriesValues(series, plotValues[0], valueTag, worksheet);
    }

    // Write data labels if configured for this series
    const dataLabels = dataSeries.getDataLabels();
    if (dataLabels && dataLabels.hasAnyLabel()) {
        writeDataLabels(chartElement, dataLabels);
    }

    // Add axis references for non-pie charts
    if (plotType !== 'pie' && plotType !== 'doughnut') {
        chartElement.ele('c:axId', { val: catAxId });
        chartElement.ele('c:axId', { val: valAxId });
    }
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
        r.ele('a:t').txt(titleText);
        title.ele('c:overlay', { val: '0' });
    } else {
        chartElement.ele('c:autoTitleDeleted', { val: '1' });
    }

    // Plot area with data series
    const plotArea = chartElement.ele('c:plotArea');
    plotArea.ele('c:layout');

    // Get data series from the chart
    const dataSeriesList = chart.getPlotArea();

    // Generate axis IDs
    const catAxId = generateAxisId();
    const valAxId = generateAxisId();

    if (dataSeriesList.length === 0) {
        // Fallback: write minimal scaffold if no data series
        const barChart = plotArea.ele('c:barChart');
        barChart.ele('c:barDir', { val: 'col' });
        barChart.ele('c:grouping', { val: 'clustered' });
        barChart.ele('c:varyColors', { val: '0' });
        barChart.ele('c:axId', { val: catAxId });
        barChart.ele('c:axId', { val: valAxId });
    } else {
        // Write each data series with worksheet reference for data resolution
        dataSeriesList.forEach((dataSeries, index) => {
            writeDataSeries(plotArea, dataSeries, index, catAxId, valAxId, chartWorksheet);
        });
    }

    // Add axes (not for pie charts)
    const hasPieChart = dataSeriesList.some((ds) => ds.getPlotType() === 'pie' || ds.getPlotType() === 'doughnut');
    const primaryPlotType = dataSeriesList[0]?.getPlotType() ?? 'bar';
    const useScatterAxes = primaryPlotType === 'scatter';

    if (!hasPieChart) {
        if (useScatterAxes) {
            // X value axis
            {
                const xValAx = plotArea.ele('c:valAx');
                xValAx.ele('c:axId', { val: catAxId });
                const scaling = xValAx.ele('c:scaling');
                scaling.ele('c:orientation', { val: 'minMax' });
                xValAx.ele('c:delete', { val: '0' });
                xValAx.ele('c:axPos', { val: 'b' });
                xValAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
                const xAxisTitle = chart.getXAxisTitle();
                if (xAxisTitle) {
                    writeAxisTitle(xValAx, xAxisTitle);
                }
                if (chart.getXAxisMajorGridlines() === true) {
                    xValAx.ele('c:majorGridlines');
                }
                if (chart.getXAxisMinorGridlines() === true) {
                    xValAx.ele('c:minorGridlines');
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
                const scaling = valAx.ele('c:scaling');
                scaling.ele('c:orientation', { val: 'minMax' });
                valAx.ele('c:delete', { val: '0' });
                valAx.ele('c:axPos', { val: 'l' });
                const yAxisTitle = chart.getYAxisTitle();
                if (yAxisTitle) {
                    writeAxisTitle(valAx, yAxisTitle);
                }
                const yMajorGridlines = chart.getYAxisMajorGridlines();
                if (yMajorGridlines === null || yMajorGridlines === true) {
                    valAx.ele('c:majorGridlines');
                }
                if (chart.getYAxisMinorGridlines() === true) {
                    valAx.ele('c:minorGridlines');
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
                const scaling = catAx.ele('c:scaling');
                scaling.ele('c:orientation', { val: 'minMax' });
                catAx.ele('c:delete', { val: '0' });
                catAx.ele('c:axPos', { val: 'b' });
                catAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
                const xAxisTitle = chart.getXAxisTitle();
                if (xAxisTitle) {
                    writeAxisTitle(catAx, xAxisTitle);
                }
                if (chart.getXAxisMajorGridlines() === true) {
                    catAx.ele('c:majorGridlines');
                }
                if (chart.getXAxisMinorGridlines() === true) {
                    catAx.ele('c:minorGridlines');
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
                const scaling = valAx.ele('c:scaling');
                scaling.ele('c:orientation', { val: 'minMax' });
                valAx.ele('c:delete', { val: '0' });
                valAx.ele('c:axPos', { val: 'l' });
                const yAxisTitle = chart.getYAxisTitle();
                if (yAxisTitle) {
                    writeAxisTitle(valAx, yAxisTitle);
                }
                const yMajorGridlines = chart.getYAxisMajorGridlines();
                if (yMajorGridlines === null || yMajorGridlines === true) {
                    valAx.ele('c:majorGridlines');
                }
                if (chart.getYAxisMinorGridlines() === true) {
                    valAx.ele('c:minorGridlines');
                }
                valAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
                valAx.ele('c:majorTickMark', { val: 'out' });
                valAx.ele('c:minorTickMark', { val: 'none' });
                valAx.ele('c:tickLblPos', { val: 'nextTo' });
                valAx.ele('c:crossAx', { val: catAxId });
                valAx.ele('c:crosses', { val: 'autoZero' });
                valAx.ele('c:crossBetween', { val: 'between' });
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
