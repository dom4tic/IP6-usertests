import { Observable } from "../../../kolibri/observable.js";
import { isNumericAndFinite }  from "../../util/chartUtil.js";

export { CoordinatesController }

/**
 * TODO: could be improved by using something like this or even separate controllers with a interface
 * ENUM of possible dimension types
 * @typedef GridLinesTypesEnum
 * @type {Readonly<{NUMERICAL: string, CATEGORICAL: string}>}
 */
// const DataTypes = Object.freeze({
//     NUMERICAL:        'NUMERICAL',
//     CATEGORICAL:      'CATEGORICAL',
// });

/**
 * @typedef CoordinatesControllerType
 *
 * @property { (accessor: ValueAccessor, range: AxisRangeType ) => void } setupX
 * @property { (r: AxisRangeType) => void } setXRange
 * @property { ()  => AxisRangeType }       getXRange
 * @property { (cb: ValueChangeCallback<AxisRangeType>) => void } onXRangeChanged
 * @property { (accessor: ValueAccessor, range: AxisRangeType ) => void } setupY
 * @property { (r: AxisRangeType) => void } setYRange
 * @property { ()  => AxisRangeType }       getYRange
 * @property { (cb: ValueChangeCallback<AxisRangeType>) => void } onYRangeChanged
 * @property { (cb: ValueChangeCallback<AxisRangeType>) => void } onAnyRangeChanged
 * @property { (ps: IPartition[], axisLength: number) => Record<string, number> } getXAxisPositionValues
 * @property { (ps: IPartition[], value: number | string, axisLength: number) => number } getXAxisPosition
 * @property { (ps: IPartition[], axisLength: number) => Record<string, number> } getYAxisPositionValues
 * @property { (ps: IPartition[], value: number | string, axisLength: number) => number } getYAxisPosition
 */

/**
 *
 * @param { (p: IPartition) => number | string } xAxisValueAccessor
 * @param { AxisRangeType } xAxisRange
 * @param { (p: IPartition) => number | string } yAxisValueAccessor
 * @param { AxisRangeType } yAxisRange
 * @return CoordinatesControllerType
 * @constructor
 *
 * @example
 * const coordsController = CoordinatesController(
 *      chartController.getXAxisValueAccessor(), {min: 0, max: 100},
 *      chartController.getYAxisValueAccessor(), undefined
 * );
 */
const CoordinatesController = (xAxisValueAccessor = undefined, xAxisRange = undefined, yAxisValueAccessor = undefined, yAxisRange = undefined) => {
    const xRange         = Observable(xAxisRange);
    const xValueAccessor = Observable(xAxisValueAccessor);


    const yRange         = Observable(yAxisRange);
    const yValueAccessor = Observable(yAxisValueAccessor);

    const onAnyRangeChanged = cb => {
        xRange.onChange(cb);
        yRange.onChange(cb);
    };

    const setupX = (valueAccessor, range) => {
        xValueAccessor.setValue(valueAccessor);
        xRange.setValue(range);
    };

    const setupY = (valueAccessor, range) => {
        yValueAccessor.setValue(valueAccessor);
        yRange.setValue(range);
    };

    /**
     *
     * @param { [IPartition] } partitions
     * @param { Number }       axisLength
     * @return { Record<string, number> }
     */
    const calculateXAxisPositions = (partitions, axisLength) => {
        const valueAccessor = xValueAccessor.getValue();
        if (valueAccessor === undefined)                 throw new Error("xAxisValueAccessor must be present!");
        if (axisLength === undefined || axisLength <= 0) throw new Error(`${ axisLength } must be greater than 0!`);
        return calculateAxisPosition(partitions, axisLength, valueAccessor, xRange.getValue());
    };

    const calculateXPosition = (partitions, value, axisLength) => {
        const valueAccessor = xValueAccessor.getValue();
        if (valueAccessor === undefined)                 throw new Error("xAxisValueAccessor must be present!");
        if (axisLength === undefined || axisLength <= 0) throw new Error(`${ axisLength } must be greater than 0!`);

        const values = partitions.map(p => valueAccessor(p));

        if (values.every(isNumericAndFinite)) {
            const range = xRange.getValue();
            const rangeDiff = range.max - range.min;
            return axisLength * ((value - range.min) / rangeDiff);
        } else {
            const uniqueValues = new Set(values);
            const categories = [...uniqueValues];
            const categoryWidth = axisLength / categories.length;
            const index = categories.indexOf(value);
            return index * categoryWidth + 0.5 * categoryWidth;
        }
    };

    /**
     *
     * @param { [IPartition] } partitions
     * @param { Number }       axisLength
     * @return { Record<string, number> }
     */
    const calculateYAxisPositions = (partitions, axisLength) => {
        const valueAccessor = yValueAccessor.getValue();
        if (valueAccessor === undefined)                 throw new Error("yAxisValueAccessor must be present!");
        if (axisLength === undefined || axisLength <= 0) throw new Error(`${ axisLength } must be greater than 0!`);

        return calculateAxisPosition(partitions, axisLength, valueAccessor, yRange.getValue());
    };

    const calculateYPosition = (partitions, value, axisLength) => {
        const valueAccessor = yValueAccessor.getValue();
        if (valueAccessor === undefined)                 throw new Error("yAxisValueAccessor must be present!");
        if (axisLength === undefined || axisLength <= 0) throw new Error(`${ axisLength } must be greater than 0!`);

        const values = partitions.map(p => valueAccessor(p));

        if (values.every(isNumericAndFinite)) {
            const range = yRange.getValue();
            const rangeDiff = range.max - range.min;
            return axisLength * ((value - range.min) / rangeDiff);
        } else {
            const uniqueValues = new Set(values);
            const categories = [...uniqueValues];
            const categoryWidth = axisLength / categories.length;
            const index = categories.indexOf(value);
            return index * categoryWidth + 0.5 * categoryWidth;
        }
    };

    return {
        setupX:          setupX,
        setXRange:       xRange.setValue,
        getXRange:       xRange.getValue,
        onXRangeChanged: xRange.onChange,

        setupY:          setupY,
        setYRange:       yRange.setValue,
        getYRange:       yRange.getValue,
        onYRangeChanged: yRange.onChange,

        onAnyRangeChanged: onAnyRangeChanged,

        getXAxisPositionValues: calculateXAxisPositions,
        getXAxisPosition:       calculateXPosition,
        getYAxisPositionValues: calculateYAxisPositions,
        getYAxisPosition:       calculateYPosition,
    };
};

/**
 *
 * @param { IPartition[] } partitions
 * @param { number } axisLength
 * @param { (p: IPartition) => number | string } valueAccessor
 * @param { { min: number, max: number } } axisRange
 * @returns { Record<string, number> }
 */
const calculateAxisPosition = (partitions, axisLength, valueAccessor, axisRange) => {
    const values = partitions.map(p => valueAccessor(p));


    if (values.length === 0) return;

    if (values.every(isNumericAndFinite)) {
        const positions = {};
        const maxValue = axisRange.max;
        const minValue = axisRange.min;

        const range = maxValue - minValue;

        const calcPosition = value => {
            if (range <= 0) {
                throw new Error(`maxValue(${ maxValue }) must be greater than minValue(${ minValue })!`);
            }
            return axisLength * ((value - minValue) / range);
        };

        partitions.forEach(p => positions[p.getKey()] = calcPosition(valueAccessor(p)));
        return positions;
    } else {
        const uniqueValues = new Set(values);
        const categories = [...uniqueValues];

        const categoryWidth = axisLength / categories.length;

        const positions = {};

        partitions.forEach(p => {
            const category = valueAccessor(p);
            const index = categories.indexOf(category);
            const value = index * categoryWidth + 0.5 * categoryWidth;

            positions[p.getKey()] = value;
        });

        return positions;
    }
};
