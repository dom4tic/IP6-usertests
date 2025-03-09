import { ChartConfig } from "./chartConfig.js";
import { identity } from "../../util/chartUtil.js";
import { TableProjector } from "../projector/tableProjector.js";

export { TableConfig };


/**
 * @typedef ColumnSpec
 * @template _T_
 *
 * @property { string } label
 * @property { (_T_) => string } format
 */

/**
 * @typedef { ChartConfigType & {columns: ColumnSpec[]}} TableConfigType
 */

/**
 * @param { string } chartId
 * @param { ColumnSpec[] } columns
 *
 * @return { TableConfigType }
 * @constructor
 */
const TableConfig = ({ chartId, columns }) => ({
    ...ChartConfig({
        chartId: chartId,
        dimension: a => [...Object.values(a)],
        groupFn: identity,
        chartProjector: TableProjector(columns)
    }),
    columns
});
