import { dom }                        from "../../../../Kolibri/util/dom.js";
import { removeChildrenFromSVG }      from "../../../util/chartUtil.js";
import { updateLabelFontSizeByClass } from "../../../util/axisUtil.js";
import { DataIndicatorTypes }         from "./axisTypes.js";

export { DataIndicatorProjector };

let counter = 0;

/**
 *
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { number }                       viewboxWidth
 * @param { number }                       viewboxHeight
 * @param { DataIndicatorTypes }           type
 * @param { boolean }                      [drawMin = true]
 * @param { boolean }                      [drawMax = true]
 * @param { boolean }                      [drawAvg = true]
 * @param { boolean }                      [drawMed = true]
 *
 * @return { [SVGGElement, (svgWidth:number) => void] }
 */
const DataIndicatorProjector = (chartController, coordinatesController, viewboxWidth, viewboxHeight, type, drawMin = true, drawMax = true, drawAvg = true, drawMed = true) => {
    const padding    = viewboxWidth * .1;
    const axisLength = viewboxWidth * .8;
    const styleId = counter++;

    const [css] = dom(`
        <style>
            .data-line-group-${ styleId } {
                .dotted-data-line {
                    vector-effect:    non-scaling-stroke;
                    stroke:           var(--grey90);
                    stroke-dasharray: 5, 5;
                    stroke-width:     .8;
                    opacity:          1;
                }
                
                .data-label {
                    font-family:          var(--font-family), system-ui;
                    font-weight:          var(--font-weight-light);
                    font-variant-numeric: tabular-nums;
                    
                    fill:                 var(--font-color);
                    transition:           font-weight var(--animation-duration) ease, opacity var(--animation-duration) ease;
                    alignment-baseline:   middle;
                    pointer-events:       all;
                }
                
                .data-label.hotspot-label, .dotted-data-line.hotspot-label {
                    font-weight:  var(--font-weight);
                    stroke-width: 1.2;
                }
                
                .data-label.faded-label, .dotted-data-line.faded-label {
                    opacity: .2;
                }
                
                .data-label.hotspot-label .data-value {
                    font-weight: var(--font-weight-bold);
                }
                
                .data-value {
                    font-weight:        var(--font-weight);

                    transition:         font-weight var(--animation-duration) ease;
                    alignment-baseline: middle;
                    pointer-events:     all;
                }
                
                text {    
                    pointer-events:      none;    
                    -webkit-user-select: none;    
                    -moz-user-select:    none;    
                    -ms-user-select:     none;    
                    user-select:         none;
                }
            }
        </style>
    `);

    const dataLineClass = `data-line-group-${ styleId }`;
    const dataLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    dataLineGroup.classList.add(dataLineClass);
    dataLineGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(dataLineGroup, "data-line-group");
        switch (type) {
            case DataIndicatorTypes.HORIZONTAL:
                dataLineGroup.appendChild(createHorizontalDataLines(chartController, coordinatesController, axisLength, type, drawMin, drawMax, drawAvg, drawMed));
                dataLineGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            case DataIndicatorTypes.VERTICAL:
                dataLineGroup.appendChild(createVerticalDataLines(chartController, coordinatesController, axisLength, type, drawMin, drawMax, drawAvg, drawMed));
                dataLineGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            default:
                throw new Error("Not supported DataIndicator type provided! Type: " + type);
        }
    };

    chartController.onPartitionsChanged(  _ => render());
    coordinatesController.onXRangeChanged(_ => render());
    coordinatesController.onYRangeChanged(_ => render());

    dataLineGroup.addEventListener("mouseover", event => {
        const dataLabel = event.target.closest(".data-label");
        if (dataLabel) {
            const dataType = dataLabel.getAttribute("DATA_TYPE");
            const dataElements = dataLineGroup.querySelectorAll(".data-label, .dotted-data-line");

            dataElements.forEach(dataElement => {
                if (dataElement.getAttribute("DATA_TYPE") !== dataType) {
                    dataElement.classList.add("faded-label");
                } else {
                    dataElement.classList.add("hotspot-label");
                }
            });

        }
    });

    dataLineGroup.addEventListener("mouseout", event => {
        const dataLabel = event.target.closest(".data-label");
        if (dataLabel) {
            const dataType = dataLabel.getAttribute("DATA_TYPE");
            const dataElements = dataLineGroup.querySelectorAll(".data-label, .dotted-data-line");

            dataElements.forEach(dataElement => {
                if (dataElement.getAttribute("DATA_TYPE") !== dataType) {
                    dataElement.classList.remove("faded-label");
                } else {
                    dataElement.classList.remove("hotspot-label");
                }
            });
        }
    });

    /**
     * Adjust the font size of the labels according to the size of the root SVG
     * @param { number } svgWidth
     *
     * @return { void }
     */
    const updateFontSize = svgWidth => updateLabelFontSizeByClass(dataLineGroup, svgWidth, viewboxWidth, ".data-label");


    return [dataLineGroup, updateFontSize];
};

/**
 * Create the vertical data lines (min, max, avg, med)
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { number }                       axisLength
 * @param { DataIndicatorTypes }           type
 * @param { boolean }                      drawMin
 * @param { boolean }                      drawMax
 * @param { boolean }                      drawAvg
 * @param { boolean }                      drawMed
 *
 * @return { SVGGElement }
 */
const createHorizontalDataLines = (chartController, coordinatesController, axisLength, type, drawMin, drawMax, drawAvg, drawMed) => {
    const dottedLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dottedLineGroup.classList.add("data-line-group");

    const partitions = chartController.getPartitions();
    const yValueAccessor = chartController.getYAxisValueAccessor();
    const yPositions = coordinatesController.getYAxisPositionValues(partitions, axisLength);

    if (drawMin) {
        const minPartition = getMinPartition(partitions, yValueAccessor);
        const y = axisLength - yPositions[minPartition.getKey()];

        dottedLineGroup.appendChild(createDottedLine(0, y, axisLength * 1.065, y, "min"));
        dottedLineGroup.appendChild(createLineDescription(axisLength, y - axisLength * 0.01, minPartition.getValue(), "min"));
    }

    if (drawMax) {
        const maxPartition = getMaxPartition(partitions, yValueAccessor);
        const y = axisLength - yPositions[maxPartition.getKey()];

        dottedLineGroup.appendChild(createDottedLine(0, y, axisLength * 1.065, y, "max"));
        dottedLineGroup.appendChild(createLineDescription(axisLength, y - axisLength * 0.01, maxPartition.getValue(), "max"));
    }

    if (drawAvg) {
        const avgValue = getAverageValue(partitions, yValueAccessor);
        const y = axisLength - coordinatesController.getYAxisPosition(partitions, avgValue, axisLength);

        dottedLineGroup.appendChild(createDottedLine(0, y, axisLength * 1.065, y, "avg"));
        dottedLineGroup.appendChild(createLineDescription(axisLength, y - axisLength * 0.01,  roundToOneDecimal(avgValue), "avg"));
    }
    if (drawMed) {
        const medValue = getMedianValue(partitions, yValueAccessor);
        const y = axisLength - coordinatesController.getYAxisPosition(partitions, medValue, axisLength);

        dottedLineGroup.appendChild(createDottedLine(0, y, axisLength * 1.065, y, "med"));
        dottedLineGroup.appendChild(createLineDescription(axisLength, y - axisLength * 0.01,  roundToOneDecimal(medValue), "med"));
    }

    return dottedLineGroup;
};


/**
 * Create the vertical data lines (min, max, avg, med)
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { number }                       axisLength
 * @param { DataIndicatorTypes }           type
 * @param { boolean }                      drawMin
 * @param { boolean }                      drawMax
 * @param { boolean }                      drawAvg
 * @param { boolean }                      drawMed
 *
 * @return { SVGGElement }
 */
const createVerticalDataLines = (chartController, coordinatesController, axisLength, type, drawMin, drawMax, drawAvg, drawMed) => {
    const dottedLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dottedLineGroup.classList.add("data-line-group");

    const partitions = chartController.getPartitions();
    const xValueAccessor = chartController.getXAxisValueAccessor();
    const xPositions = coordinatesController.getXAxisPositionValues(partitions, axisLength);

    if (drawMin) {
        const minPartition = getMinPartition(partitions, xValueAccessor);
        const x = xPositions[minPartition.getKey()];

        dottedLineGroup.appendChild(createDottedLine(x, 0, x, axisLength, "min"));
        dottedLineGroup.appendChild(createLineDescription(x, 0, minPartition.getValue(), "min"));
    }

    if (drawMax) {
        const maxPartition = getMaxPartition(partitions, xValueAccessor);
        const x = xPositions[maxPartition.getKey()];

        dottedLineGroup.appendChild(createDottedLine(x, 0, x, axisLength, "max"));
        dottedLineGroup.appendChild(createLineDescription(x, 0, maxPartition.getValue(), "max"));
    }

    if (drawAvg) {
        const avgValue = getAverageValue(partitions, xValueAccessor);
        const x = coordinatesController.getXAxisPosition(partitions, avgValue, axisLength);

        dottedLineGroup.appendChild(createDottedLine(x, 0, x, axisLength, "avg"));
        dottedLineGroup.appendChild(createLineDescription(x, 0,  roundToOneDecimal(avgValue), "avg"));
    }
    if (drawMed) {
        const medValue = getMedianValue(partitions, xValueAccessor);
        const x = coordinatesController.getXAxisPosition(partitions, medValue, axisLength);

        dottedLineGroup.appendChild(createDottedLine(x, 0, x, axisLength, "med"));
        dottedLineGroup.appendChild(createLineDescription(x, 0,  roundToOneDecimal(medValue), "med"));
    }

    return dottedLineGroup;
};

/**
 * Get the partition with the smallest value
 * @param { IPartition[] } partitions
 * @param { (p: IPartition) => number | string } valueAccessor
 *
 * @return { IPartition | undefined }
 */
const getMinPartition = (partitions, valueAccessor) => {
    if (partitions.length === 0) return undefined;

    return partitions.reduce((acc, curr) =>
            valueAccessor(curr) < valueAccessor(acc) ? curr : acc
        , partitions[0]);
};

/**
 * Get the partition with the highest value
 * @param { IPartition[] } partitions
 * @param { (p: IPartition) => number | string } valueAccessor
 *
 * @return { IPartition | undefined }
 */
const getMaxPartition = (partitions, valueAccessor) => {
    if (partitions.length === 0) return undefined;

    return partitions.reduce((acc, curr) =>
            valueAccessor(curr) > valueAccessor(acc) ? curr : acc
        , partitions[0]);
};

/**
 * Calculate the average value of all partitions
 * @param { IPartition[] } partitions
 * @param { (p: IPartition) => number | string } valueAccessor - Must return numeric values
 *
 * @return { number | undefined }
 */
const getAverageValue = (partitions, valueAccessor) => {
    if (partitions.length === 0) return undefined;

    const sum = partitions.reduce((acc, curr) => {
        const value = valueAccessor(curr);
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        return isNaN(numValue) ? acc : acc + numValue;
    }, 0);

    return sum / partitions.length;
};

/**
 * Calculate the median value of all partitions
 * @param { IPartition[] } partitions
 * @param { (p: IPartition) => number } valueAccessor - Must return numeric values
 *
 * @return { number | undefined }
 */
const getMedianValue = (partitions, valueAccessor) => {
    if (partitions.length === 0) return undefined;

    const sortedValues = partitions
        .map(p => valueAccessor(p))
        .sort((a, b) => a - b);

    const middleIndex = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 0 && sortedValues.length > 1) {
        return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
    }

    return sortedValues[middleIndex];
};

/**
 * Round a number to one decimal
 * @param { number } num
 *
 * @return { number }
 */
function roundToOneDecimal(num) {
    return Math.round(num * 10) / 10;
}

/**
 * create the data line description
 * @param { number } x
 * @param { number } y
 * @param { number } value
 * @param { string } type
 *
 * @return { SVGTextElement }
 */
const createLineDescription = (x, y, value, type) => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", `${ x }`);
    text.setAttribute("y", `${ y }`);
    text.setAttribute("DATA_TYPE", type);
    text.textContent = `${ type }: `;
    text.classList.add("data-label");

    const valueText = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    valueText.textContent = `${ value }`;
    valueText.classList.add("data-value");

    text.appendChild(valueText);

    return text;
};

/**
 * Create a line on the defined position
 * @param { number } x1
 * @param { number } y1
 * @param { number } x2
 * @param { number } y2
 * @param { string } type
 *
 * @return { SVGLineElement }
 */
const createDottedLine = (x1, y1, x2, y2, type) => {
    const dottedLine = document.createElementNS("http://www.w3.org/2000/svg", "line");

    dottedLine.setAttribute("x1", `${ x1 }`);
    dottedLine.setAttribute("y1", `${ y1 }`);
    dottedLine.setAttribute("x2", `${ x2 }`);
    dottedLine.setAttribute("y2", `${ y2 }`);
    dottedLine.setAttribute("DATA_TYPE", type);

    dottedLine.classList.add("dotted-data-line");

    return dottedLine;
};
