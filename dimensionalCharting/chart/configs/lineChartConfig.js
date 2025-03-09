import { ChartConfig } from "./chartConfig.js";
import { LineChartProjector } from "../projector/lineChartProjector.js";
import { AxisProjector } from "../projector/axisProjector.js";

export { LineChartConfig };

/**
 * @typedef { ChartConfigType } LineChartConfigType
 */

/**
 * @template _T_
 * @param { ChartConfigData } parameterObject
 * @return { LineChartConfigType }
 * @constructor
 */
const LineChartConfig = ({
                             chartId,
                             dimension,
                             groupFn,
                             sortBy,
                             legendConfig
                         }) => ChartConfig({
    chartId,
    dimension,
    groupFn,
    chartProjector: LineChartProjector,
    axisProjector:  AxisProjector(),
    ...(sortBy       !== undefined && { sortBy }),      // Include only if explicitly set
    ...(legendConfig !== undefined && { legendConfig }) // Include only if explicitly set
});
