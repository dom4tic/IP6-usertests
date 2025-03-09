import { salesData }                  from "../../data/datasets.js";
import { MultiSelectionController }   from "../../chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../chart/controller/hotspotController.js";
import { createSVG, reduceSum }       from "../../util/chartUtil.js";
import { ChartController }            from "../../chart/controller/chartController.js";
import { NumericTickMarkProjector }   from "../../chart/projector/axis/numericTickMarkProjector.js";
import { SimpleAxisProjector }        from "../../chart/projector/axis/simpleAxisProjector.js";
import { AxisTypes }                  from "../../chart/projector/axis/axisTypes.js";
import { CoordinatesController }      from "../../chart/controller/coordinatesController.js";

/**
 * @type ViewBoxType
 */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

// Get HTML elements
const chart = document.getElementById("chart");

// Prepare chart controller
const dimension = s => s.region;

const groupByFn = (acc, curr) => {
    const sales     = acc.sales     === undefined ? 0 : acc.sales;
    const profit    = acc.profit    === undefined ? 0 : acc.profit;

    return {
        sales:     curr.sales     + sales,
        profit:    curr.profit    + profit
    }
};

const chartController = ChartController(dimension, groupByFn);
chartController.setXAxisValueAccessor(p => p.getValue().sales);
chartController.setYAxisValueAccessor(p => p.getValue().profit);

// Prepare selection, hotspot & tickController controller
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();
const coordsController = CoordinatesController(
    chartController.getXAxisValueAccessor(), {min: 3, max: 33},
    chartController.getYAxisValueAccessor(), {min: 0, max: 1_000_000}
);

// Prepare svg
const svg = createSVG("numeric-axis", viewBox);

const [chartAxisGroup]     = SimpleAxisProjector(viewBox.width, true, true);
const [chartYAxisTickMark] = NumericTickMarkProjector({
    chartController:       chartController,
    coordinatesController: coordsController,
    selectionController:   selectionController,
    hotspotController:     hotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.Y_AXIS
});
const [chartXAxisTickMark] = NumericTickMarkProjector({
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
chart.appendChild(svg);

// Set data
chartController.updateData(salesData);

// Setup Y Range slider
const yRangeSlider = document.getElementById("yRangeSlider");
yRangeSlider.min  = coordsController.getYRange().min;
yRangeSlider.max  = coordsController.getYRange().max;
yRangeSlider.value = yRangeSlider.max;

yRangeSlider.addEventListener("input", (event) => {
    const max = Number(event.target.value);
    coordsController.setYRange({ min: yRangeSlider.min, max: max });
});
