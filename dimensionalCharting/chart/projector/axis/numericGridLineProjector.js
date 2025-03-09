import { dom }                   from "../../../../Kolibri/util/dom.js";
import { removeChildrenFromSVG } from "../../../util/chartUtil.js";
import {
    createLabel,
    getNiceTicks,
    formatNumber,
    createValueLine,
    updateNumericAxisLabelsVisibility,
    createYAxisMajorTick,
    updateLabelFontSizeByClass,
    createXAxisMinorTick, createXAxisMajorTick, groupPartitionKeysBy, createYAxisMinorTick,
} from "../../../util/axisUtil.js";
import { GridLinesTypes } from "./axisTypes.js";

export { NumericGridLineProjector }

const ATTRIBUTE_PARTITION_KEYS = "data-partition-keys";

let counter = 0;

/**
 * Numeric Gridline Projector
 * Constructor for a {@link AxisProjectorType Axis}.
 * @param { GridlineAxisProjectorDataType } parameterObject
 * @constructor
 *
 * @return { AxisProjectorType }
 */
const NumericGridLineProjector = ({
    chartController,
    coordinatesController,
    selectionController,
    hotspotController,
    viewboxLength,
    type
}) => {
    const padding    = viewboxLength * .1;
    const axisLength = viewboxLength * .8;
    const styleId = counter++;

    const [css] = dom(`
        <style>
            .axis-numeric-value-line-group-${ styleId } {
                .axis-label.hidden-label, .partition-label.hidden-label, .partition-tick.hidden-label {
                    opacity:    0;
                }
                
                .axis-label.hotspot-label, .partition-label.hotspot-label, .partition-tick.hotspot-label {
                    font-weight: var(--font-weight);
                    opacity:    1;
                }
                
                .axis-label.selected-label, .partition-label.selected-label, .partition-tick.selected-tick {
                    font-weight:  var(--font-weight-bold);
                    stroke-width: 1.2;
                    opacity:      1;
                }
                
                .partition-tick.selected-tick {
                    stroke: var(--grey60);
                }
                
                .axis-label.faded-label {
                    opacity: .2;
                }
                
                .axis-label, .partition-label {
                    font-family:          var(--font-family), system-ui;
                    font-weight:          var(--font-weight-light);
                    font-variant-numeric: tabular-nums;
                    
                    fill:                 var(--font-color);
                    transition:           font-weight var(--animation-duration) ease, opacity var(--animation-duration) ease;
                    alignment-baseline:   middle;
                }
                
                .partition-label, .partition-tick {
                    opacity: 0;
                }
                
                .axis-value-line {
                    vector-effect: non-scaling-stroke;
                    stroke:        var(--grey90);
                    stroke-width:  .4;
                    transition:    stroke-width var(--animation-duration) ease;
                }
                
                .partition-tick {
                    vector-effect: non-scaling-stroke;
                    stroke:        var(--grey90);
                    stroke-width:  .8;
                    transition:    stroke-width var(--animation-duration) ease;
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

    const axisValueLineClass = `axis-numeric-value-line-group-${ styleId }`;
    const axisValueLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    axisValueLineGroup.classList.add(axisValueLineClass);
    axisValueLineGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(axisValueLineGroup, "value-line-label-group");
        switch (type) {
            case GridLinesTypes.HORIZONTAL:
                axisValueLineGroup.appendChild(createHorizontalValueLines(chartController, coordinatesController, axisLength));
                axisValueLineGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            case GridLinesTypes.VERTICAL:
                axisValueLineGroup.appendChild(createVerticalValueLines(chartController, coordinatesController, axisLength));
                axisValueLineGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            default:
                throw new Error("Not supported GridLine type provided! Type: " + type);
        }
        updateNumericAxisLabelsVisibility(axisValueLineGroup, chartController, selectionController, hotspotController, type === GridLinesTypes.HORIZONTAL);
    };

    chartController.onPartitionsChanged(_ => render());
    hotspotController.onHotspotChanged(    _=> updateNumericAxisLabelsVisibility(axisValueLineGroup, chartController, selectionController, hotspotController, type === GridLinesTypes.HORIZONTAL));
    selectionController.onSelectionChanged(_=> updateNumericAxisLabelsVisibility(axisValueLineGroup, chartController, selectionController, hotspotController, type === GridLinesTypes.HORIZONTAL));

    switch (type) {
        case GridLinesTypes.HORIZONTAL: coordinatesController.onYRangeChanged(_ => render()); break;
        case GridLinesTypes.VERTICAL:   coordinatesController.onXRangeChanged(_ => render()); break;
        default: throw new Error("Not supported GridLine type provided! Type: " + type);
    }

    /**
     * Adjust the font size of the labels according to the size of the root SVG
     * @param { number } svgWidth
     *
     * @return { void }
     */
    const updateFontSize = svgWidth => updateLabelFontSizeByClass(axisValueLineGroup, svgWidth, viewboxLength, ".axis-label, .partition-label");

    return [axisValueLineGroup, updateFontSize];
};

/**
 * Create the ticks for the x-axis
 * @param { ChartControllerType } chartController
 * @param { CoordinatesControllerType } coordinatesController
 * @param { number }              axisLength
 *
 * @return { SVGGElement }
 */
const createVerticalValueLines = (chartController, coordinatesController, axisLength) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("value-line-label-group");

    const partitions = chartController.getPartitions();
    const range = coordinatesController.getXRange();
    const ticks = getNiceTicks(range.min, range.max).majors;

    ticks.map(tick => {
        const pos = coordinatesController.getXAxisPosition(partitions, tick, axisLength);
        const label = createLabel(
            pos,
            axisLength + 5,
            formatNumber(tick),
            "middle");

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createValueLine(pos, 0, pos, axisLength));
    });

    const partitionKeysByValue = groupPartitionKeysBy(partitions, chartController.getXAxisValueAccessor());

    Object.entries(partitionKeysByValue).forEach(([value, keys]) => {
        const pos = coordinatesController.getXAxisPosition(partitions, value, axisLength);
        const num = Number(value);

        const label = createLabel(
            pos,
            axisLength + 5,
            formatNumber(num),
            "middle",
            "partition-label");

        const keyJson = JSON.stringify(keys);

        label.setAttribute(ATTRIBUTE_PARTITION_KEYS, keyJson);

        tickLabelGroup.appendChild(label);

        if (ticks.includes(num)) {
            Array.from(tickLabelGroup.querySelectorAll(".axis-label"))
                .find(element => element.innerHTML === String(num))
                .setAttribute(ATTRIBUTE_PARTITION_KEYS, keyJson);
        } else {
            tickLabelGroup.appendChild(createXAxisMinorTick(pos, axisLength, keyJson, "partition-tick"));
        }
    });

    return tickLabelGroup;
};

/**
 * Create the ticks for the y-axis
 * @param { ChartControllerType }       chartController
 * @param { CoordinatesControllerType } coordinatesController
 * @param { number }                    axisLength
 *
 * @return { SVGGElement }
 */
const createHorizontalValueLines = (chartController, coordinatesController, axisLength) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("value-line-label-group");

    const partitions = chartController.getPartitions();
    const range = coordinatesController.getYRange();
    const ticks = getNiceTicks(range.min, range.max).majors;

    ticks.map(tick => {
        const pos = axisLength - coordinatesController.getYAxisPosition(partitions, tick, axisLength);
        const xAxisPos = - axisLength * 0.03;
        const yAxisPos = pos - axisLength * 0.02;
        const label = createLabel(
            xAxisPos,
            yAxisPos,
            formatNumber(tick),
            "end");

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createValueLine( - axisLength * 0.07, pos, axisLength, pos));
    });

    const partitionKeysByValue = groupPartitionKeysBy(partitions, chartController.getYAxisValueAccessor());

    Object.entries(partitionKeysByValue).forEach(([value, keys]) => {
        const yAxisPos = axisLength - coordinatesController.getYAxisPosition(partitions, value, axisLength);
        const xAxisPos = - axisLength * 0.03;
        const num = Number(value);

        const label = createLabel(
            xAxisPos,
            yAxisPos,
            formatNumber(num),
            "end",
            "partition-label");

        const keyJson = JSON.stringify(keys);

        label.setAttribute(ATTRIBUTE_PARTITION_KEYS, keyJson);

        tickLabelGroup.appendChild(label);

        if (ticks.includes(num)) {
            Array.from(tickLabelGroup.querySelectorAll(".axis-label"))
                .find(element => element.innerHTML === String(num))
                .setAttribute(ATTRIBUTE_PARTITION_KEYS, keyJson);
        } else {
            tickLabelGroup.appendChild(createYAxisMinorTick(0, yAxisPos, keyJson, "partition-tick"));
        }
    });


    return tickLabelGroup;
};
