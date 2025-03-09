
export { AxisTypes, GridLinesTypes, DataIndicatorTypes }

/**
 * ENUM of possible dimension types
 * @typedef AxisTypesEnum
 * @type {Readonly<{X_AXIS: string, Y_AXIS: string}>}
 */
const AxisTypes = Object.freeze({
    X_AXIS:      'X_AXIS',
    Y_AXIS:      'Y_AXIS',
});

/**
 * ENUM of possible dimension types
 * @typedef GridLinesTypesEnum
 * @type {Readonly<{HORIZONTAL: string, VERTICAL: string}>}
 */
const GridLinesTypes = Object.freeze({
    HORIZONTAL:    'HORIZONTAL',
    VERTICAL:      'VERTICAL',
});

/**
 * ENUM of possible data indicator types
 * @typedef DataIndicatorTypesEnum
 * @type {Readonly<{HORIZONTAL: string, VERTICAL: string}>}
 */
const DataIndicatorTypes = Object.freeze({
    HORIZONTAL:    'HORIZONTAL',
    VERTICAL:      'VERTICAL',
});