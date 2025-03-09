import { ChartConfig } from "./chartConfig.js";
import { ScatterChartProjector } from "../projector/scatterChartProjector.js";
import { AxisProjector } from "../projector/axisProjector.js";

export { ScatterChartConfig };

/**
 * @typedef { ChartConfigType } ScatterChartConfigType
 */

/**
 * @template _T_
 * @param { ChartConfigData } parameterObject
 * @return { ScatterChartConfigType }
 * @constructor
 */
const ScatterChartConfig = ({
                                chartId,
                                dimension,
                                groupFn,
                                sortBy,
                                legendConfig
                            }) => ChartConfig({
    chartId,
    dimension,
    groupFn,
    chartProjector: ScatterChartProjector,
    axisProjector:  AxisProjector(),
    ...(sortBy       !== undefined && { sortBy }),      // Include only if explicitly set
    ...(legendConfig !== undefined && { legendConfig }) // Include only if explicitly set
});
