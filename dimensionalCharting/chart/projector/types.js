/**
 * @typedef ChartProjectorDataType
 * @property { !ChartControllerType }          chartController
 * @property { !MultiSelectionControllerType } selectionController
 * @property { !HotspotControllerType }        hotspotController
 */

/**
 * @typedef { ChartProjectorDataType & { viewBox: ViewBoxType } } SVGChartProjectorDataType
 */

/**
 * @typedef { SVGChartProjectorDataType & { svgId: string } } SVGRubberbandChartProjectorDataType
 */

/**
 * @typedef { ChartProjectorDataType & { coordinatesController: CoordinatesControllerType} } TwoDimensionalChartProjectorDataType
 */

/**
 * @typedef { SVGGElement } ChartProjectorType
 */

/**
 * @typedef { ChartProjectorDataType & { columns: ColumnSpec[]} } TableProjectorDataType
 */

/**
 * @typedef { ChartProjectorDataType & { labelAccessor: ((p: IPartition) => string)= } } LegendProjectorDataType
 */

/**
 * @typedef AxisProjectorDataType
 * @property { !ChartControllerType }          chartController
 * @property { !CoordinatesControllerType }    coordinatesController
 * @property { !MultiSelectionControllerType } selectionController
 * @property { !HotspotControllerType }        hotspotController
 * @property { !number }                       viewboxLength
 */

/**
 * @typedef { AxisProjectorDataType & { type: GridLinesTypesEnum } } GridlineAxisProjectorDataType
 */

/**
 * @typedef { AxisProjectorDataType & { type: AxisTypesEnum } } TickmarkAxisProjectorDataType
 */

/**
 * @typedef { GridlineAxisProjectorDataType & { labelAccessor: ((p: IPartition) => string)= } } CategoricGridlineAxisProjectorDataType
 */

/**
 * @typedef { TickmarkAxisProjectorDataType & { labelAccessor: ((p: IPartition) => string)= } } CategoricTickmarkAxisProjectorDataType
 */

/**
 * @typedef { [SVGGElement, (svgWidth:number) => void] } AxisProjectorType
 */


/**
 *
 * @typedef {{x: number, y: number, width: number, height: number}} ViewBoxType
 */

/**
 * @template _T_
 * @typedef { (_T_) => (number | string | (string | number)[]) } KeyExtractor
 */

/**
 * @typedef { {x: number, y: number} } PointType
 */

/**
 * @typedef { { min: number, max: number } } AxisRangeType
 * @example
 * { min: 0, max: 1000 }
 */

/**
 * @typedef coordinatesType
 *
 * @property { number } x1
 * @property { number } y1
 * @property { number } x2
 * @property { number } y2
 */

/**
 * @typedef coordinatesDescriptionType
 *
 * @property { number } x
 * @property { number } y
 * @property { string } orientation
 */
