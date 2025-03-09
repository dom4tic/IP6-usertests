import { salesData }                  from "../../../data/datasets.js";
import { MultiSelectionController }   from "../../../chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../../chart/controller/hotspotController.js";
import { createSVG, reduceSum }       from "../../../util/chartUtil.js";

import { ChartController }            from "../../../chart/controller/chartController.js";
import { SimpleAxisProjector }        from "../../../chart/projector/axis/simpleAxisProjector.js";
import { NumericGridLineProjector }   from "../../../chart/projector/axis/numericGridLineProjector.js";
import { DottedLineProjector }        from "../../../chart/projector/axis/dottedLineProjector.js";
import {AxisTypes, GridLinesTypes} from "../../../chart/projector/axis/axisTypes.js";
import { CoordinatesController }      from "../../../chart/controller/coordinatesController.js";
import { CategoricTickMarkProjector } from "../../../chart/projector/axis/categoricTickMarkProjector.js";
import {SmoothLineChartProjector} from "../../../chart/projector/smoothLineChartProjector.js";

/**
 * @type ViewBoxType
 */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

// Get HTML elements
const chart = document.getElementById("chart");

// Prepare chart controller
const months = {
    0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun",
    6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec"
};

const dimension = s => months[new Date(s.date).getMonth()];
const groupByFn = reduceSum(s => s.sales);

const chartController = ChartController(dimension, groupByFn);
chartController.setSort((a, b) => a - b);
chartController.setXAxisValueAccessor(p => p.getKey());
chartController.setYAxisValueAccessor(p => p.getValue());

// Prepare selection, hotspot & tickController controller
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();
const coordsController = CoordinatesController(
    chartController.getXAxisValueAccessor(), undefined,
    chartController.getYAxisValueAccessor(), {min: 0, max: 1_000_000}
);

// Prepare svg
const svg = createSVG("line-chart", viewBox);

// Build projectors
const [chartAxisGroup, axisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true);
const [yAxisTickMark, yLabelAdjuster]  = NumericGridLineProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.height,
    type:                  GridLinesTypes.HORIZONTAL
});
const [xAxisTickMark, xLabelAdjuster]  = CategoricTickMarkProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.X_AXIS
});

const [chartDottedLine] = DottedLineProjector(chartController, coordsController, selectionController, hotspotController, viewBox.width);

const chartSvg = SmoothLineChartProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewBox:               viewBox,
    svgId:                 svg.id
});

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

