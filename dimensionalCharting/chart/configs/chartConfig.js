export { ChartConfig }

/**
 * @typedef ChartConfigData
 * @template _T_
 *
 * @property { !string } chartId
 * @property { !((_T_) => string | number | string[]) } dimension
 * @property { !((acc: *, curr: *) => *) } groupFn
 * @property { ChartProjectionType } chartProjector
 * @property { AxisProjectionType= }  axisProjector
 * @property { ((a: IPartition, b: IPartition) => number)= } sortBy
 * @property { LegendConfigType= } legendConfig
 */

/**
 * @typedef ChartConfigType
 * @template _T_
 *
 * @property { string } chartId
 * @property { (_T_) => string | number } dimension
 * @property { (acc: *, curr: *) => * } groupFn
 * @property { ChartProjectionType } chartProjector
 * @property { AxisProjectionType } axisProjector
 * @property { (a: IPartition, b: IPartition) => number } sortBy
 * @property { LegendConfigType } legendConfig
 */

/**
 * @param { ChartConfigData } parameterObject
 * @return { ChartConfigType }
 * @constructor
 */
const ChartConfig = ( {
                        chartId,
                        dimension,
                        groupFn,
                        chartProjector,
                        axisProjector = undefined,
                        sortBy                 = (a, b) => b.getValue() - a.getValue(), // default sort
                        legendConfig = undefined // default has no legend config
                     } ) => ({
        chartId,
        dimension,
        groupFn,
        chartProjector,
        axisProjector,
        sortBy,
        legendConfig
});
