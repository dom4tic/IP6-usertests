import { salesData } from "../../data/datasets.js";
import { DimensionalChartController } from "../../chart/dimensionalChartController.js";
import {createSVG, identity, reduceCount, reduceSum} from "../../util/chartUtil.js";
import {ChartController} from "../../chart/controller/chartController.js";
import {MultiSelectionController} from "../../chart/controller/multiSelectionController.js";
import {HotspotController} from "../../chart/controller/hotspotController.js";
import {PieChartProjector} from "../../chart/projector/pieChartProjector.js";
import {LegendProjector} from "../../chart/projector/legendProjector.js";
import {BarChartProjector} from "../../chart/projector/barChartProjector.js";
import {SimpleAxisProjector} from "../../chart/projector/axis/simpleAxisProjector.js";
import {NumericGridLineProjector} from "../../chart/projector/axis/numericGridLineProjector.js";
import {AxisTypes, GridLinesTypes} from "../../chart/projector/axis/axisTypes.js";
import {CategoricTickMarkProjector} from "../../chart/projector/axis/categoricTickMarkProjector.js";
import {CoordinatesController} from "../../chart/controller/coordinatesController.js";
import {SmoothLineChartProjector} from "../../chart/projector/smoothLineChartProjector.js";
import {TableProjector} from "../../chart/projector/tableProjector.js";
import { NumericTickMarkProjector } from "../../chart/projector/axis/numericTickMarkProjector.js";

const chartController = ChartController(a => a.category, reduceCount);
chartController.setSizeValueAccessor(p => p.getValue());
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();

const twoChartController = ChartController(a => a.region, reduceCount);
twoChartController.setXAxisValueAccessor(p => p.getKey());
twoChartController.setYAxisValueAccessor(p => p.getValue());
const twoSelectionController = MultiSelectionController();
const twoHotspotController = HotspotController();
const twoCoordsController = CoordinatesController();
twoCoordsController.setupX(twoChartController.getXAxisValueAccessor(), undefined);
twoCoordsController.setupY(twoChartController.getYAxisValueAccessor(), {min: 0, max: 120});

const months = {
    0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun",
    6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec"
};


const threeChartController = ChartController(a => months[new Date(a.date).getMonth()], reduceSum(s => s.sales));
threeChartController.setXAxisValueAccessor(p => p.getKey());
threeChartController.setYAxisValueAccessor(p => p.getValue());
const threeSelectionController = MultiSelectionController();
const threeHotspotController = HotspotController();
const threeCoordsController = CoordinatesController();
threeCoordsController.setupX(threeChartController.getXAxisValueAccessor(), undefined);
threeCoordsController.setupY(threeChartController.getYAxisValueAccessor(), {min: 0, max: 1_000_000});

const tableChartController = ChartController(a => [...Object.values(a)], identity);
const tableSelectionController = MultiSelectionController();
const tableHotspotController = HotspotController();

const charts = [
    {chartController: chartController,        selectionController: selectionController},
    {chartController: twoChartController,     selectionController: twoSelectionController},
    {chartController: threeChartController,   selectionController: threeSelectionController},
    {chartController: tableChartController,   selectionController: tableSelectionController},
];

const dimChartController = DimensionalChartController(salesData, charts);

/**
 * @type ViewBoxType
 */
const viewBox = {x: 0, y: 0, width: 120, height: 120};

const chartRoot  = document.getElementById("chart");
const legendRoot = document.getElementById("chart-legend");
const chartSvg   = createSVG("pie-chart", viewBox);

const pieChart = PieChartProjector({chartController, selectionController, hotspotController, viewBox});
chartSvg.appendChild(pieChart);
chartRoot.appendChild(chartSvg);
const pieLegend = LegendProjector({chartController, hotspotController, selectionController});
legendRoot.appendChild(pieLegend);

const chartTwoRoot  = document.getElementById("chartTwo");
const chartTwoSvg   = createSVG("bar-chart", viewBox);

const barChart = BarChartProjector({
    chartController: twoChartController,
    coordinatesController: twoCoordsController,
    selectionController: twoSelectionController,
    hotspotController: twoHotspotController,
    viewBox: viewBox
});
const [barChartAxisGroup, barAxisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true, "Regions", "Number of sales");
const [barChartYAxisTickMark, barYLabelAdjuster]    = NumericGridLineProjector({
    chartController:       twoChartController,
    coordinatesController: twoCoordsController,
    selectionController:   twoSelectionController,
    hotspotController:     twoHotspotController,
    viewboxLength:         viewBox.height,
    type:                  GridLinesTypes.HORIZONTAL
});
const [barChartXAxisTickMark, barXLabelAdjuster]    = CategoricTickMarkProjector({
    chartController:       twoChartController,
    coordinatesController: twoCoordsController,
    selectionController:   twoSelectionController,
    hotspotController:     twoHotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.X_AXIS
});

chartTwoSvg.appendChild(barChartAxisGroup);
chartTwoSvg.appendChild(barChartYAxisTickMark);
chartTwoSvg.appendChild(barChartXAxisTickMark);
chartTwoSvg.appendChild(barChart);
chartTwoRoot.appendChild(chartTwoSvg);

const chartThreeRoot = document.getElementById("chartThree");
const chartThreeSvg  = createSVG("line-chart", viewBox);

const lineChart = SmoothLineChartProjector({
    chartController:       threeChartController,
    coordinatesController: threeCoordsController,
    selectionController:   threeSelectionController,
    hotspotController:     threeHotspotController,
    viewBox:               viewBox,
    svgId:                 chartThreeSvg.id
});
const [lineChartAxisGroup, lineAxisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true);
const [lineChartYAxisTickMark, lineYLabelAdjuster]    = NumericTickMarkProjector({
    chartController:       threeChartController,
    coordinatesController: threeCoordsController,
    selectionController:   threeSelectionController,
    hotspotController:     threeHotspotController,
    viewboxLength:         viewBox.height,
    type:                  AxisTypes.Y_AXIS
});
const [lineChartXAxisTickMark, lineXLabelAdjuster]    = CategoricTickMarkProjector({
    chartController:       threeChartController,
    coordinatesController: threeCoordsController,
    selectionController:   threeSelectionController,
    hotspotController:     threeHotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.X_AXIS
});

chartThreeSvg.appendChild(lineChartAxisGroup);
chartThreeSvg.appendChild(lineChartYAxisTickMark);
chartThreeSvg.appendChild(lineChartXAxisTickMark);
chartThreeSvg.appendChild(lineChart);
chartThreeRoot.appendChild(chartThreeSvg);

const tableRoot = document.getElementById("data-table");

const columns = [
    {label: 'Date',         format: a => new Date(a.date).toLocaleDateString("de-CH")},
    {label: 'region',       format: a => a.region},
    {label: 'Category',     format: a => a.category},
    {label: 'Units sold',   format: a => a.unitsSold},
    {label: 'Sales [$]',    format: a => a.sales},
    {label: 'Profit [$]',   format: a => a.profit}
];

const table = TableProjector({
    chartController:     tableChartController,
    selectionController: tableSelectionController,
    hotspotController:   tableHotspotController,
    columns:             columns
});

tableRoot.appendChild(table);

window.addEventListener("resize", () => {
    const twoBoundingRect = chartTwoSvg.getBoundingClientRect();
    const twoCurrentWidth = twoBoundingRect.width;
    barAxisLabelSizeAdjuster(twoCurrentWidth);
    barYLabelAdjuster(twoCurrentWidth);
    barXLabelAdjuster(twoCurrentWidth);

    const threeBoundingRect = chartThreeSvg.getBoundingClientRect();
    const threeCurrentWidth = threeBoundingRect.width;
    lineAxisLabelSizeAdjuster(threeCurrentWidth);
    lineYLabelAdjuster(threeCurrentWidth);
    lineXLabelAdjuster(threeCurrentWidth);
});

twoChartController.onPartitionsChanged(_ => {
    const twoBoundingRect = chartTwoSvg.getBoundingClientRect();
    const twoCurrentWidth = twoBoundingRect.width;
    barAxisLabelSizeAdjuster(twoCurrentWidth);
    barYLabelAdjuster(twoCurrentWidth);
    barXLabelAdjuster(twoCurrentWidth);
});

threeChartController.onPartitionsChanged(_ => {
    const threeBoundingRect = chartThreeSvg.getBoundingClientRect();
    const threeCurrentWidth = threeBoundingRect.width;
    lineAxisLabelSizeAdjuster(threeCurrentWidth);
    lineYLabelAdjuster(threeCurrentWidth);
    lineXLabelAdjuster(threeCurrentWidth);
});
