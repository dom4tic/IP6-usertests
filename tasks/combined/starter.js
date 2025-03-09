import { salesData }                  from "../../dimensionalCharting/data/datasets.js";
import { DimensionalChartController } from "../../dimensionalCharting/chart/dimensionalChartController.js";
import {
    createSVG,
    identity,
    reduceCount,
    reduceSum
}                                     from "../../dimensionalCharting/util/chartUtil.js";
import { ChartController }            from "../../dimensionalCharting/chart/controller/chartController.js";
import { MultiSelectionController }   from "../../dimensionalCharting/chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../dimensionalCharting/chart/controller/hotspotController.js";
import { CoordinatesController }      from "../../dimensionalCharting/chart/controller/coordinatesController.js";
import { BarChartProjector }          from "../../dimensionalCharting/chart/projector/barChartProjector.js";
import { SimpleAxisProjector }        from "../../dimensionalCharting/chart/projector/axis/simpleAxisProjector.js";
import { NumericGridLineProjector }   from "../../dimensionalCharting/chart/projector/axis/numericGridLineProjector.js";
import { AxisTypes, GridLinesTypes }  from "../../dimensionalCharting/chart/projector/axis/axisTypes.js";
import { CategoricTickMarkProjector } from "../../dimensionalCharting/chart/projector/axis/categoricTickMarkProjector.js";
import { SmoothLineChartProjector }   from "../../dimensionalCharting/chart/projector/smoothLineChartProjector.js";
import { TableProjector }             from "../../dimensionalCharting/chart/projector/tableProjector.js";
import { NumericTickMarkProjector }   from "../../dimensionalCharting/chart/projector/axis/numericTickMarkProjector.js";
import { DottedLineProjector }        from "../../dimensionalCharting/chart/projector/axis/dottedLineProjector.js";

/**
 * In this file we will create a multi-chart visualization using the dimensional charting library.
 * You will integrate a bar chart, a line chart, and a data table.
 * The final task involves linking these components so that filtering one chart will update the data of the following charts.
 *
 * The three charts:
 * 1. A bar chart that groups data by region and counts how many sales have been made in this region.
 * 2. A line chart that groups data by month (extracted from the date) and sums sales in the according month.
 * 3. A table that displays the complete dataset.
 *
 * You won't need to change anything in the `index.html` file but make sure to review it.
 */

/** As before you can use this viewbox for the following SVGs. */
/** @type ViewBoxType */ const viewBox = {x: 0, y: 0, width: 120, height: 120};

// --------------------------------------------  Task 1  ---------------------------------------------------------------

/**
 * Step 1: Prepare controllers
 *
 * TODO: Create a chart controller for the bar chart by:
 *  - Grouping the data by `region`.
 *  - Aggregating the data using the {@link reduceCount} helper.
 *  - Setting the x value accessor to the group ({@link IPartition}) key
 *    and the y value accessor to the group ({@link IPartition}) value.
 *  - Create the selection & hotspot controller
 */
const barChartController = ChartController(a => a.region, reduceCount);
barChartController.setXAxisValueAccessor(p => p.getKey());
barChartController.setYAxisValueAccessor(p => p.getValue());

const barSelectionController = MultiSelectionController();
const barHotspotController   = HotspotController();

/**
 * Step 2: CoordinatesController
 *
 * This time we also need a {@link CoordinatesController}. This controller is responsible for the positioning
 * of the chart elements, e.g. the data points & the ticks of the axis.
 * 
 * Pass the X & Y value accessor from the chart controller to the CoordinatesController.
 * If an axis is numeric a {@link AxisRangeType} must be provided. A range looks like this: `{ min: 0, max: 120}`. This defines the
 * range of the displayed coordinate system. In case of a categorical axis the range must be `undefined`.
 */

const barCoordsController = CoordinatesController(
    barChartController.getXAxisValueAccessor(), undefined,
    barChartController.getYAxisValueAccessor(), { min: 0, max: 120 }
);

/**
 * Step 3: Render the Bar Chart
 * Use the BarChartProjector and related axis projectors to create the bar chart.
 *
 * TODO:
 *  - Create an SVG container using {@link createSVG} for the bar chart.
 *  - Render the bar chart using {@link BarChartProjector}.
 *  - Render the x-axis and y-axis using {@link SimpleAxisProjector} and {@link NumericGridLineProjector} / {@link CategoricTickMarkProjector}.
 */
const barChartRoot = document.getElementById("barChart");

const barChart = BarChartProjector({
    chartController:       barChartController,
    coordinatesController: barCoordsController,
    selectionController:   barSelectionController,
    hotspotController:     barHotspotController,
    viewBox:               viewBox
});
const [barChartAxisGroup, barAxisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true, "Regions", "Number of sales");
const [barChartYAxisTickMark, barYLabelAdjuster]    = NumericGridLineProjector({
    chartController:       barChartController,
    coordinatesController: barCoordsController,
    selectionController:   barSelectionController,
    hotspotController:     barHotspotController,
    viewboxLength:         viewBox.height,
    type:                  GridLinesTypes.HORIZONTAL
});
const [barChartXAxisTickMark, barXLabelAdjuster]    = CategoricTickMarkProjector({
    chartController:       barChartController,
    coordinatesController: barCoordsController,
    selectionController:   barSelectionController,
    hotspotController:     barHotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.X_AXIS
});

/**
 * TODO: Append all elements to the corresponding HTML element (e.g. element with id "barChart").
 */
const barChartSvg  = createSVG("bar-chart", viewBox);

barChartSvg.appendChild(barChartAxisGroup);
barChartSvg.appendChild(barChartYAxisTickMark);
barChartSvg.appendChild(barChartXAxisTickMark);
barChartSvg.appendChild(barChart);
barChartRoot.appendChild(barChartSvg);

/**
 * To support the dynamic labels we need to add the function {@link resizeBarLabels} and call it
 * on `window resize` and when the partitions change `onPartitionsChanged`.
 * This way the the label size gets updated when the window is resized.
 *
 * TODO:
 *  - Call the resizeBarLabels function on the two defined events.
 */
const resizeBarLabels = () => {
    const barBoundingRect = barChartSvg.getBoundingClientRect();
    const barCurrentWidth = barBoundingRect.width;
    barAxisLabelSizeAdjuster(barCurrentWidth);
    barYLabelAdjuster(barCurrentWidth);
    barXLabelAdjuster(barCurrentWidth);
};

barChartController.onPartitionsChanged(_ => {
    resizeBarLabels();
});

window.addEventListener("resize", () => {
    resizeBarLabels();
});

/**
 * Step 4: Update data
 * TODO: update the data of the chart controller, use `salesData`.
 */

barChartController.updateData(salesData);


// --------------------------------------------  Task 2  ---------------------------------------------------------------

/**
 * Step 1: Prepare Controllers
 * TODO: Create the line chart controller by:
 *  - Grouping the data by month (you can use the provided `months` mapping).
 *  - Aggregating the data using the {@link reduceSum} helper to sum the sales.
 *  - Setting the x value accessor to the group key and the y value accessor to the summed sales (value).
 *  - Create the Selection, Hotspot and CoordinatesController {@link CoordinatesController}.
 *    For the CoordinatesController {@link CoordinatesController} you have to define a suitable range for each axis or no range in case of non-numeric.
 */

/** Hint: `new Date('2024-01-02T00:00:00.000').getMonth()` returns the index of a month */
const months = {
    0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr",  4: "May",  5: "Jun",
    6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec"
};

const lineChartController = ChartController(a => months[new Date(a.date).getMonth()], reduceSum(s => s.sales));
lineChartController.setXAxisValueAccessor(p => p.getKey());
lineChartController.setYAxisValueAccessor(p => p.getValue());
const lineSelectionController = MultiSelectionController();
const lineHotspotController = HotspotController();

const lineCoordsController = CoordinatesController();
lineCoordsController.setupX(lineChartController.getXAxisValueAccessor(), undefined);
lineCoordsController.setupY(lineChartController.getYAxisValueAccessor(), {min: 0, max: 1_000_000});

/**
 * Step 2: Render the Line Chart
 * Use the SmoothLineChartProjector and axis projectors to create the line chart.
 *
 * TODO:
 *  - Create an SVG container for the line chart.
 *  - Render the line chart using {@link SmoothLineChartProjector}.
 *  - Render the axes using {@link SimpleAxisProjector} and appropriate numeric/categoric tick mark projectors.
 *  - Append the elements to the corresponding HTML element (e.g. element with id "lineChart").
 */
const lineChartSvg  = createSVG("line-chart", viewBox);

const lineChart = SmoothLineChartProjector({
    chartController:       lineChartController,
    coordinatesController: lineCoordsController,
    selectionController:   lineSelectionController,
    hotspotController:     lineHotspotController,
    viewBox:               viewBox,
    svgId:                 lineChartSvg.id
});
const [lineChartAxisGroup, lineAxisLabelSizeAdjuster] = SimpleAxisProjector(viewBox.width, true, true, "Month", "Sales");
const [lineChartYAxisTickMark, lineYLabelAdjuster]    = NumericTickMarkProjector({
    chartController:       lineChartController,
    coordinatesController: lineCoordsController,
    selectionController:   lineSelectionController,
    hotspotController:     lineHotspotController,
    viewboxLength:         viewBox.height,
    type:                  AxisTypes.Y_AXIS
});
const [lineChartXAxisTickMark, lineXLabelAdjuster]    = CategoricTickMarkProjector({
    chartController:       lineChartController,
    coordinatesController: lineCoordsController,
    selectionController:   lineSelectionController,
    hotspotController:     lineHotspotController,
    viewboxLength:         viewBox.width,
    type:                  AxisTypes.X_AXIS
});

/**
 * This projector draws a line from the data point to the axis when the point is on hotpsot.
 * TODO: uncomment the projector & adjust the variable names
 */
const [chartDottedLine] = DottedLineProjector(lineChartController, lineCoordsController, lineSelectionController, lineHotspotController, viewBox.width);


/**
 * Step 3: Appending the elements to the HTML
 * TODO:
 *  - Append all elements to the corresponding HTML element (e.g. element with id "lineChart").
 *    Reminder: The order is important because later additions will be layered on top of the previously appended ones.
 */

const lineChartRoot = document.getElementById("lineChart");
lineChartSvg.appendChild(lineChartAxisGroup);
lineChartSvg.appendChild(lineChartYAxisTickMark);
lineChartSvg.appendChild(lineChartXAxisTickMark);
lineChartSvg.appendChild(chartDottedLine);
lineChartSvg.appendChild(lineChart);
lineChartRoot.appendChild(lineChartSvg);

/**
 * TODO:
 *  - Create a `resizeLineLabels` function and call it on `window resize` and when the partitions change `onPartitionsChanged`.
 */
const resizeLineLabels = () => {
    const lineBoundingRect = lineChartSvg.getBoundingClientRect();
    const lineCurrentWidth = lineBoundingRect.width;
    lineAxisLabelSizeAdjuster(lineCurrentWidth);
    lineYLabelAdjuster(lineCurrentWidth);
    lineXLabelAdjuster(lineCurrentWidth);
};

lineChartController.onPartitionsChanged(_ => {
    resizeLineLabels();
});

window.addEventListener("resize", () => {
    resizeLineLabels();
});

/**
 * Step 4: Update data
 * TODO: update the data of the chart controller, use `salesData`.
 */

lineChartController.updateData(salesData);



// --------------------------------------------  Task 3  ---------------------------------------------------------------

/**
 * Step 1: Prepare Controllers
 * TODO: Create the table chart controller by:
 *  - Grouping the data into an array of all values (using `identity`).
 *  - Create selection and hotspot controllers for the table chart.
 */
const groupBy = a => [...Object.values(a)];
const groupFn = identity;

const tableChartController     = ChartController(groupBy, groupFn);
const tableSelectionController = MultiSelectionController();
const tableHotspotController   = HotspotController();

/**
 * Step 2: Render the Data Table
 * Use the TableProjector to create a table that displays the complete dataset.
 *
 * TODO:
 *  - Define the columns to display, including custom formatting functions.
 *  - Create the table using {@link TableProjector}.
 *  - Append the table to the corresponding HTML element (e.g. element with id "data-table").
 */
const tableRoot = document.getElementById("data-table");

const columns = [
    {label: 'Date',         format: a => new Date(a.date).toLocaleDateString("de-CH")},
    {label: 'Region',       format: a => a.region},
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

/**
 * Step 3: Update data
 * TODO: update the data of the chart controller, use `salesData`.
 */

tableChartController.updateData(salesData);


// --------------------------------------------  Task 5  ---------------------------------------------------------------
/**
 * Step 1: Linking the charts
 * Combine the individual controllers into a dimensional chart controller {@link DimensionalChartController}.
 *
 * After this step the selection of a chart will have a filter effect on the following charts.
 * Since now the dimensional chart is managing the data you can remove
 * the `chartController.updateData(salesData);` for both charts & the table above.
 */

/** You might need to adjust the names of the controllers according to your naming */
const charts = [
    {chartController: barChartController,   selectionController: barSelectionController},
    {chartController: lineChartController,  selectionController: lineSelectionController},
    {chartController: tableChartController, selectionController: tableSelectionController},
];

const dimChartController = DimensionalChartController(salesData, charts);
