import { ironmanData } from "../../../data/datasets.js";
import { MultiSelectionController }   from "../../../chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../../chart/controller/hotspotController.js";
import { createSVG, reduceCount } from "../../../util/chartUtil.js";

import { ChartController }            from "../../../chart/controller/chartController.js";
import { SimpleAxisProjector }        from "../../../chart/projector/axis/simpleAxisProjector.js";
import { DottedLineProjector }        from "../../../chart/projector/axis/dottedLineProjector.js";
import { AxisTypes } from "../../../chart/projector/axis/axisTypes.js";
import { CoordinatesController }      from "../../../chart/controller/coordinatesController.js";
import {ScatterChartProjector} from "../../../chart/projector/scatterChartProjector.js";
import {NumericTickMarkProjector} from "../../../chart/projector/axis/numericTickMarkProjector.js";

/**
 * @type ViewBoxType
 */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

// Get HTML elements
const chart = document.getElementById("chart");

// Prepare chart controller
const dimension = a => a.age;
const groupByFn = reduceCount;

const chartController = ChartController(dimension, groupByFn);
chartController.setXAxisValueAccessor(p => p.getKey());
chartController.setYAxisValueAccessor(p => p.getValue());

// Prepare selection, hotspot & tickController controller
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();
const coordsController = CoordinatesController(
    chartController.getXAxisValueAccessor(), {min: 0, max: 50},
    chartController.getYAxisValueAccessor(), {min: 0, max: 10}
);

// Prepare svg
const svg = createSVG("scatter-chart", viewBox);

// Build projectors
const [chartAxisGroup, axisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true);
const [yAxisTickMark, yLabelAdjuster]  = NumericTickMarkProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.height,
    type:                  AxisTypes.Y_AXIS
});
const [xAxisTickMark, xLabelAdjuster]  = NumericTickMarkProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.X_AXIS
});

const [chartDottedLine] = DottedLineProjector(chartController, coordsController, selectionController, hotspotController, viewBox.width);

const chartSvg = ScatterChartProjector({
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
chartController.updateData(ironmanData);

