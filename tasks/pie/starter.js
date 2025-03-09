/**
 * In this file we will create a simple pie chart using the dimensional charting library.
 * You will also integrate a legend and support user interactions such as selections and hover effects.
 * You won't need to change anything in the `index.html` file but take a look at the file.
 */

/**
 * Step 1: Imports
 * Here we already put all the imports you need to create a pie chart.
 */
import { salesData }                from "../../dimensionalCharting/data/datasets.js";
import { ChartController }          from "../../dimensionalCharting/chart/controller/chartController.js";
import { MultiSelectionController } from "../../dimensionalCharting/chart/controller/multiSelectionController.js";
import { HotspotController }        from "../../dimensionalCharting/chart/controller/hotspotController.js";
import { LegendProjector }          from "../../dimensionalCharting/chart/projector/legendProjector.js";
import { PieChartProjector }        from "../../dimensionalCharting/chart/projector/pieChartProjector.js";
import { createSVG, reduceSum }     from "../../dimensionalCharting/util/chartUtil.js";

/**
 * Step 2: HTML Elements
 * Below are the HTML elements you will later use to append the svg of the pie chart & the legend.
 */

const chart  = document.getElementById("chart");
const legend = document.getElementById("chart-legend");

// --------------------------------------------  STEP X  ---------------------------------------------------------------

/**
 * Step 3: Controllers
 * Here we will create the controllers for the pie chart and the legend.
 * - The chart controller will handle the data and the selection of the chart.
 * - The selection controller will handle the selection of the chart.
 * - The hotspot controller will handle the hover effect of the chart.
 *
 * To create the chart controller we need to define:
 *  - A dimension function (groupBy key): the function which defines a key the data is grouped by. This key must be a string.
 *  - A group function (groupFn): used to aggregate the grouped data.
 *    The resulting value can be a number, a string or even an object for more complex charts but for this example,
 *    it will be a number and we'll use the provided helper functions for the aggregation.
 *    There is `reduceCount` to count the number of elements in a group,
 *    `reduceSum(addendAccessor)` to sum the values of a group (and `identity` which is used for tables but more on that later).
 *
 *    Where are using the `salesData` dataset which contains the sales of a company.
 *    We want to group the data by `category` and sum the `sales` of each category.
 */

// TODO: define a function which returns the category of a sales
const groupBy = undefined;

/** TODO: make use of the helper function {@link reduceSum} to sum the `sales` of each category */
const groupFn = undefined;

/** TODO: create a chart controller {@link ChartController } */
const chartController = undefined;

/**
 * The chart controller support different value accessor which the charts are using:
 * - size value accessor: used to define a size e.g. the angle of a slice in a pie chart
 * - y value accessor: used to define the value accessor for a y-axis.
 * - x value accessor: used to define the value accessor for a x-axis.
 *
 * Every controller and chart works with {@link IPartition} which is the result of the group function.
 * TODO: set the size value accessor of the `chartController` to the value of the partition.
 */


/** TODO: create a selection controller {@link MultiSelectionController} and a hotspot controller {@link HotspotController} */
const selectionController = undefined;
const hotspotController   = undefined;

/**
 * Step 4: Base SVG
 * The viewBox {@link ViewBoxType} is used to define the SVG viewBox for the pie chart.
 * The viewBox is used to define the size and position (in SVG Elements) of the SVG content.
 * For our charts the viewBox must be a square.
 * Detailed description: {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox}
 */

/** @type ViewBoxType */ const viewBox = {x: 0, y: 0, width: 120, height: 120};

/** TODO: use the helper function {@link createSVG} to create the svg element the chart will be drawn in (define an id) */
const svg = undefined;

/**
 * Step 5: Projectors
 *
 * Under `dimensionalCharting/chart/projector` you can find the projectors for the different charts.
 * These projectors are used to create the SVG elements for the chart and are then appended to the HTML elements.
 *
 * TODO: create a {@link PieChartProjector} and a {@link LegendProjector} using the controllers created above.
 */
const chartSvg = undefined;
const legendElement = undefined;

/**
 * Step 6: Append the projectors to the HTML elements
 * Now we need to append the created elements to the according HTML elements.
 * TODO: append the legend elements to the legend HTML element
 */


/** TODO: append the chart elements to the svg (created with {@link createSVG}) and then the svg  to the chart HTML element*/


/**
 * Step 7: Update the data
 *
 * Finally, we need to fill the chart with the data, we can do that by updating the data on the chart controller.
 * TODO: Update the data on the chart controller {@link ChartController} using the {@link salesData} dataset.
 */
