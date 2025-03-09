import { salesData }                from "../../../data/datasets.js";
import { MultiSelectionController } from "../../../chart/controller/multiSelectionController.js";
import { HotspotController }        from "../../../chart/controller/hotspotController.js";
import { LegendProjector }          from "../../../chart/projector/legendProjector.js";
import {createSVG, reduceSum}       from "../../../util/chartUtil.js";
import { ChartController }          from "../../../chart/controller/chartController.js";
import { PieChartProjector }        from "../../../chart/projector/pieChartProjector.js";

/**
 * @type ViewBoxType
 */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

// Get HTML elements
const chart  = document.getElementById("chart");
const legend = document.getElementById("chart-legend");

// Prepare chart controller
const dimension = s => s.category;
const groupBy = reduceSum(s => s.sales);

const chartController = ChartController(dimension, groupBy);
chartController.setSizeValueAccessor( p => p.getValue());

// Prepare selection & hotspot controller
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();

// Prepare svg
const svg = createSVG("pie-chart", viewBox);

// Build projectors
const chartSvg = PieChartProjector({
    chartController,
    selectionController,
    hotspotController,
    viewBox
});
const legendElement = LegendProjector({
    chartController,
    hotspotController,
    selectionController
});

legend.appendChild(legendElement);

// Append projector results to root element
svg.appendChild(chartSvg);
chart.appendChild(svg);

// Set data
chartController.updateData(salesData);
