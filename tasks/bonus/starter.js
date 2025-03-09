import { salesData }                  from "../../dimensionalCharting/data/datasets.js";
import { MultiSelectionController }   from "../../dimensionalCharting/chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../dimensionalCharting/chart/controller/hotspotController.js";
import { LegendProjector }            from "../../dimensionalCharting/chart/projector/legendProjector.js";
import { BubbleChartProjector }       from "../../dimensionalCharting/chart/projector/bubbleChartProjector.js";
import { createSVG, reduceSum }       from "../../dimensionalCharting/util/chartUtil.js";

import { ChartController }            from "../../dimensionalCharting/chart/controller/chartController.js";
import { SimpleAxisProjector }        from "../../dimensionalCharting/chart/projector/axis/simpleAxisProjector.js";
import { NumericGridLineProjector }   from "../../dimensionalCharting/chart/projector/axis/numericGridLineProjector.js";
import { DottedLineProjector }        from "../../dimensionalCharting/chart/projector/axis/dottedLineProjector.js";
import { GridLinesTypes }             from "../../dimensionalCharting/chart/projector/axis/axisTypes.js";
import { CoordinatesController }      from "../../dimensionalCharting/chart/controller/coordinatesController.js";

/**
 * Bonus
 *
 * For the bonus task, we've already provided a complete solution.
 * As a motivated person checking out the bonus challenge, you deserve it!
 * This bonus serves as a showcase for the multi-dimensional bubble chart. Enjoy exploring it!
 */

/** @type ViewBoxType */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

const chart = document.getElementById("chart");

const dimension = s => s.region;

/**
 * As you can see, a more complex groupBy function is possible.
 * Here, the groupByFn aggregates multiple metrics (sales, profit, and units sold) at once.
 * It takes an accumulator (acc) and the current data item (curr), initializing missing values to 0,
 * then returns a new accumulator with summed values for sales, profit, and unitsSold.
 *
 * This is necessary since the bubble chart has more than two dimensions, so `getKey()` and simple `getValue()` alone
 * wouldn't provide enough informations.
 */
const groupByFn = (acc, curr) => {
    const sales     = acc.sales     === undefined ? 0 : acc.sales;
    const profit    = acc.profit    === undefined ? 0 : acc.profit;
    const unitsSold = acc.unitsSold === undefined ? 0 : acc.unitsSold;

    return {
        sales:     curr.sales     + sales,
        profit:    curr.profit    + profit,
        unitsSold: curr.unitsSold + unitsSold
    }
};

/**
 * Here we access the different properties in the value object.
 */
const chartController = ChartController(dimension, groupByFn);
chartController.setXAxisValueAccessor(p => p.getValue().sales);
chartController.setYAxisValueAccessor(p => p.getValue().profit);
chartController.setSizeValueAccessor( p => p.getValue().unitsSold);

const selectionController = MultiSelectionController();
const hotspotController = HotspotController();
const coordsController = CoordinatesController(
    chartController.getXAxisValueAccessor(), {min: 0, max: 1_000_000},
    chartController.getYAxisValueAccessor(), {min: 0, max: 100_000}
);

/**
 * Rendering the chart
 */
const svg = createSVG("bubble-chart", viewBox);

const [chartAxisGroup, axisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true);
const [yAxisTickMark, yLabelAdjuster] = NumericGridLineProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.height,
    type:                  GridLinesTypes.HORIZONTAL
});
const [xAxisTickMark, xLabelAdjuster] = NumericGridLineProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.height,
    type:                  GridLinesTypes.VERTICAL
});

const [chartDottedLine] = DottedLineProjector(chartController, coordsController, selectionController, hotspotController, viewBox.width);

const chartSvg = BubbleChartProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewBox:               viewBox,
    svgId:                 svg.id
});

svg.appendChild(chartAxisGroup);
svg.appendChild(yAxisTickMark);
svg.appendChild(xAxisTickMark);
svg.appendChild(chartDottedLine);
svg.appendChild(chartSvg);
chart.appendChild(svg);

const updateLabels = () => {
    const boundingRect = svg.getBoundingClientRect();
    const currentWidth = boundingRect.width;
    axisLabelSizeAdjuster(currentWidth);
    yLabelAdjuster(currentWidth);
    xLabelAdjuster(currentWidth);
};

window.addEventListener("resize", updateLabels);
chartController.onPartitionsChanged(_ => updateLabels());

/**
 * Update data
 */
chartController.updateData(salesData);
