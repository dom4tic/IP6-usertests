import { ChartConfig } from "./chartConfig.js";
import { PieChartProjector } from "../projector/pieChartProjector.js";

export { PieChartConfig };

/**
 * @typedef { ChartConfigType } PieChartConfigType
 */

/**
 * @template _T_
 * @param { ChartConfigData } parameterObject
 * @return { PieChartConfigType }
 * @constructor
 */
const PieChartConfig = ({
                            chartId,
                            dimension,
                            groupFn,
                            sortBy,
                            legendConfig
                        }) => ChartConfig({
    chartId,
    dimension,
    groupFn,
    chartProjector: PieChartProjector,
    ...(sortBy       !== undefined && { sortBy }),      // Include only if explicitly set
    ...(legendConfig !== undefined && { legendConfig }) // Include only if explicitly set
});
