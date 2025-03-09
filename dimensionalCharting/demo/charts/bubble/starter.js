import { salesData }                  from "../../../data/datasets.js";
import { MultiSelectionController }   from "../../../chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../../chart/controller/hotspotController.js";
import { LegendProjector }            from "../../../chart/projector/legendProjector.js";
import { BubbleChartProjector }       from "../../../chart/projector/bubbleChartProjector.js";
import { createSVG, reduceSum }       from "../../../util/chartUtil.js";

import { ChartController }            from "../../../chart/controller/chartController.js";
import { SimpleAxisProjector }        from "../../../chart/projector/axis/simpleAxisProjector.js";
import { NumericGridLineProjector }   from "../../../chart/projector/axis/numericGridLineProjector.js";
import { DottedLineProjector }        from "../../../chart/projector/axis/dottedLineProjector.js";
import { GridLinesTypes }             from "../../../chart/projector/axis/axisTypes.js";
import { CoordinatesController }      from "../../../chart/controller/coordinatesController.js";

/**
 * @type ViewBoxType
 */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

// Get HTML elements
const chart = document.getElementById("chart");
const legend = document.getElementById("chart-legend");

// Prepare chart controller
const dimension = s => s.region;
// TODO: improve usage with helper functions
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

const chartController = ChartController(dimension, groupByFn);
chartController.setXAxisValueAccessor(p => p.getValue().sales);
chartController.setYAxisValueAccessor(p => p.getValue().profit);
chartController.setSizeValueAccessor( p => p.getValue().unitsSold);

// Prepare selection, hotspot & tickController controller
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();
const coordsController = CoordinatesController(
    chartController.getXAxisValueAccessor(), {min: 0, max: 1_000_000},
    chartController.getYAxisValueAccessor(), {min: 0, max: 100_000}
);

// Prepare svg
const svg = createSVG("bubble-chart", viewBox);

// Build projectors
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
const legendElement = LegendProjector({
    chartController,
    hotspotController,
    selectionController
});

legend.appendChild(legendElement);

// Append projector results to root element
svg.appendChild(chartAxisGroup);
svg.appendChild(yAxisTickMark);
svg.appendChild(xAxisTickMark);
svg.appendChild(chartDottedLine);
svg.appendChild(chartSvg);
chart.appendChild(svg);

// Setup dynamic label updater
const updateLabels = () => {
    const boundingRect = svg.getBoundingClientRect();
    const currentWidth = boundingRect.width;
    axisLabelSizeAdjuster(currentWidth);
    yLabelAdjuster(currentWidth);
    xLabelAdjuster(currentWidth);
};
window.addEventListener("resize", updateLabels);
chartController.onPartitionsChanged(_ => updateLabels());

// Set data
chartController.updateData(salesData);
