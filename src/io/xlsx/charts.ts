import { create } from 'xmlbuilder2';
import type { Chart } from '../../worksheet/chart/chart.ts';

/**
 * Write a minimal valid chart XML part.
 *
 * This intentionally emits a simple chart scaffold (no series required) so the
 * relationship chain for embedded charts is correct.
 */
export const writeChartXml = (_chart: Chart): string => {
    const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('c:chartSpace', {
        'xmlns:c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
        'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    });

    // Match common defaults used by typical writers.
    root.ele('c:date1904', { val: '0' });
    root.ele('c:lang', { val: 'en-US' });
    root.ele('c:roundedCorners', { val: '0' });

    const chart = root.ele('c:chart');
    chart.ele('c:autoTitleDeleted', { val: '1' });

    // Minimal plot area with a basic chart type + axes.
    const plotArea = chart.ele('c:plotArea');
    plotArea.ele('c:layout');

    const catAxId = '110438656';
    const valAxId = '110444544';

    // Use a simple bar chart scaffold without any series.
    const barChart = plotArea.ele('c:barChart');
    barChart.ele('c:barDir', { val: 'col' });
    barChart.ele('c:grouping', { val: 'clustered' });
    barChart.ele('c:varyColors', { val: '0' });
    barChart.ele('c:axId', { val: catAxId });
    barChart.ele('c:axId', { val: valAxId });

    // Category axis.
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

    // Value axis.
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

    chart.ele('c:plotVisOnly', { val: '1' });
    chart.ele('c:dispBlanksAs', { val: 'gap' });
    chart.ele('c:showDLblsOverMax', { val: '0' });

    return root.end({ prettyPrint: true });
};
