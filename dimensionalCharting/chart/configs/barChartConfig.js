import { ChartConfig } from "./chartConfig.js";
import { BarChartProjector } from "../projector/barChartProjector.js";
import { AxisProjector } from "../projector/axisProjector.js";

export { BarChartConfig }

/**
 * @typedef { ChartConfigType } BarChartConfigType
 */

/**
 * @template _T_
 * @param { ChartConfigData } parameterObject
 * @return { BarChartConfigType }
 * @constructor
 */
const BarChartConfig = ({
                            chartId,
                            dimension,
                            groupFn,
                            sortBy,
                            legendConfig
                        }) => ChartConfig({
    chartId,
    dimension,
    groupFn,
    chartProjector: BarChartProjector,
    axisProjector:  AxisProjector(false),
    ...(sortBy       !== undefined && { sortBy }),      // Include only if explicitly set
    ...(legendConfig !== undefined && { legendConfig }) // Include only if explicitly set
});
