import { create } from 'xmlbuilder2';
import type { Chart } from '../../worksheet/chart/chart.ts';
import type { DataSeriesValues } from '../../worksheet/chart/data-series-values.ts';
import type { DataSeries } from '../../worksheet/chart/data-series.ts';

/**
 * Generate unique axis IDs for charts.
 */
let axisIdCounter = 110438656;
function generateAxisId(): string {
    return (axisIdCounter++).toString();
}

/**
 * Write data series values as chart data references.
 */
function writeDataSeriesValues(parent: any, dataValues: DataSeriesValues | null, tagName: string = 'c:val'): void {
    if (!dataValues || !dataValues.getDataSource()) {
        // Write empty values if no data
        const val = parent.ele(tagName);
        const numRef = val.ele('c:numRef');
        numRef.ele('c:f', dataValues?.getDataSource() ?? '');
        const numCache = numRef.ele('c:numCache');
        numCache.ele('c:formatCode', dataValues?.getFormatCode() ?? 'General');
        numCache.ele('c:ptCount', { val: '0' });
        return;
    }

    const val = parent.ele(tagName);
    const dataType = dataValues.getDataType();

    if (dataType === 'String') {
        // String/categories reference
        const strRef = val.ele('c:strRef');
        strRef.ele('c:f', dataValues.getDataSource());
        const strCache = strRef.ele('c:strCache');
        strCache.ele('c:ptCount', { val: dataValues.getPointCount().toString() });
    } else {
        // Number values reference
        const numRef = val.ele('c:numRef');
        numRef.ele('c:f', dataValues.getDataSource());
        const numCache = numRef.ele('c:numCache');
        numCache.ele('c:formatCode', dataValues.getFormatCode() ?? 'General');
        numCache.ele('c:ptCount', { val: dataValues.getPointCount().toString() });
    }
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
    if (plotType === 'bar') {
        const direction = dataSeries.getDirection() ?? 'col';
        chartElement.ele('c:barDir', { val: direction });
        chartElement.ele('c:grouping', { val: dataSeries.getGrouping() ?? 'clustered' });
    } else if (plotType === 'line') {
        chartElement.ele('c:grouping', { val: dataSeries.getGrouping() ?? 'standard' });
        if (dataSeries.getSmoothLine()) {
            chartElement.ele('c:smooth');
        }
    } else if (plotType === 'pie') {
        // Pie charts don't need axes
    }

    chartElement.ele('c:varyColors', { val: '0' });

    // Write the data series
    const series = chartElement.ele('c:ser');
    series.ele('c:idx', { val: seriesIndex.toString() });
    series.ele('c:order', { val: dataSeries.getPlotOrder().toString() });

    // Write series label (legend entry)
    if (dataSeries.getPlotLabel()) {
        writeDataSeriesValues(series, dataSeries.getPlotLabel(), 'c:tx');
    }

    // Write category axis data
    writeDataSeriesValues(series, dataSeries.getPlotCategory(), 'c:cat');

    // Write values data
    const plotValues = dataSeries.getPlotValues();
    if (plotValues.length > 0 && plotValues[0]) {
        writeDataSeriesValues(series, plotValues[0], 'c:val');
    }

    // Add axis references (not for pie charts)
    if (plotType !== 'pie' && plotType !== 'doughnut') {
        chartElement.ele('c:axId', { val: catAxId });
        chartElement.ele('c:axId', { val: valAxId });
    }
}

/**
 * Write a minimal valid chart XML part with actual data series.
 *
 * @param chart - The Chart object containing data series
 * @returns XML string for the chart part
 */
export const writeChartXml = (chart: Chart): string => {
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
        r.ele('a:t', titleText);
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
        // Write each data series
        dataSeriesList.forEach((dataSeries, index) => {
            writeDataSeries(plotArea, dataSeries, index, catAxId, valAxId);
        });
    }

    // Add axes (not for pie charts)
    const hasPieChart = dataSeriesList.some((ds) => ds.getPlotType() === 'pie' || ds.getPlotType() === 'doughnut');

    if (!hasPieChart) {
        // Category axis
        {
            const catAx = plotArea.ele('c:catAx');
            catAx.ele('c:axId', { val: catAxId });
            const scaling = catAx.ele('c:scaling');
            scaling.ele('c:orientation', { val: 'minMax' });
            catAx.ele('c:delete', { val: '0' });
            catAx.ele('c:axPos', { val: 'b' });
            catAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
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
            valAx.ele('c:majorGridlines');
            valAx.ele('c:numFmt', { formatCode: 'General', sourceLinked: '1' });
            valAx.ele('c:majorTickMark', { val: 'out' });
            valAx.ele('c:minorTickMark', { val: 'none' });
            valAx.ele('c:tickLblPos', { val: 'nextTo' });
            valAx.ele('c:crossAx', { val: catAxId });
            valAx.ele('c:crosses', { val: 'autoZero' });
            valAx.ele('c:crossBetween', { val: 'between' });
        }
    }

    chartElement.ele('c:plotVisOnly', { val: '1' });
    chartElement.ele('c:dispBlanksAs', { val: 'gap' });
    chartElement.ele('c:showDLblsOverMax', { val: '0' });

    return root.end({ prettyPrint: true });
};
