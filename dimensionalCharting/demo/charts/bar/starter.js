import { salesData }                  from "../../../data/datasets.js";
import { MultiSelectionController }   from "../../../chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../../chart/controller/hotspotController.js";
import {createSVG, reduceCount, reduceSum} from "../../../util/chartUtil.js";
import { ChartController }            from "../../../chart/controller/chartController.js";
import { BarChartProjector }          from "../../../chart/projector/barchartProjector.js";
import {CoordinatesController} from "../../../chart/controller/coordinatesController.js";
import {SimpleAxisProjector} from "../../../chart/projector/axis/simpleAxisProjector.js";
import {NumericGridLineProjector} from "../../../chart/projector/axis/numericGridLineProjector.js";
import {AxisTypes, GridLinesTypes} from "../../../chart/projector/axis/axisTypes.js";
import {CategoricTickMarkProjector} from "../../../chart/projector/axis/categoricTickMarkProjector.js";

/**
 * @type ViewBoxType
 */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

// Get HTML elements
const chart = document.getElementById("chart");

// Prepare chart controller
const dimension = s => s.category;

const chartController = ChartController(dimension, reduceCount);
chartController.setXAxisValueAccessor(p => p.getKey());
chartController.setYAxisValueAccessor(p => p.getValue());

// Prepare coordinates controller
const coordsController = CoordinatesController();
coordsController.setupY(chartController.getYAxisValueAccessor(), {min: 0, max: 40});
coordsController.setupX(chartController.getXAxisValueAccessor(), undefined);

// Prepare selection & hotspot controller
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();

// Prepare svg
const svg = createSVG("bar-chart", viewBox);

// Build projectors
const chartSvg = BarChartProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewBox:               viewBox
});
const [chartAxisGroup, axisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true, "Categories", "Number of Purchases");
const [chartYAxisTickMark, yLabelAdjuster]    = NumericGridLineProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.height,
    type:                  GridLinesTypes.HORIZONTAL
});
const [chartXAxisTickMark, xLabelAdjuster]    = CategoricTickMarkProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.X_AXIS
});

// Append projector results to root element
svg.appendChild(chartAxisGroup);
svg.appendChild(chartYAxisTickMark);
svg.appendChild(chartXAxisTickMark);
svg.appendChild(chartSvg);
chart.appendChild(svg);

// Setup dynamic label updater
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
