import { dom }                     from "../../../../Kolibri/util/dom.js";
import { removeChildrenFromSVG,  } from "../../../util/chartUtil.js";
import {
    createLabel,
    createXAxisMajorTick, createXAxisMinorTick,
    createYAxisMajorTick, createYAxisMinorTick,
    getNiceTicks,
    updateNumericAxisLabelsVisibility,
    updateLabelFontSizeByClass,
    formatNumber, groupPartitionKeysBy
} from "../../../util/axisUtil.js";
import { AxisTypes } from "./axisTypes.js";

export { NumericTickMarkProjector }

const ATTRIBUTE_PARTITION_KEYS = "data-partition-keys";

let counter = 0;

/**
 * Numeric Gridline Projector
 * Constructor for a {@link AxisProjectorType Axis}.
 * @param { TickmarkAxisProjectorDataType } parameterObject
 * @constructor
 *
 * @return { AxisProjectorType }
 */
const NumericTickMarkProjector = ({
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
            .axis-numeric-tick-mark-group-${ styleId } {
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
                
                .axis-tick, .partition-tick {
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

    const axisTickMarkClass = `axis-numeric-tick-mark-group-${ styleId }`;
    const axisTickMarkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    axisTickMarkGroup.classList.add(axisTickMarkClass);
    axisTickMarkGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(axisTickMarkGroup, "tick-label-group");
        switch (type) {
            case AxisTypes.X_AXIS:
                axisTickMarkGroup.appendChild(createXTicks(chartController, coordinatesController, axisLength));
                axisTickMarkGroup.setAttribute("transform", `translate(${ padding }, ${ viewboxLength - padding })`);
                break;
            case AxisTypes.Y_AXIS:
                axisTickMarkGroup.appendChild(createYTicks(chartController, coordinatesController, axisLength));
                axisTickMarkGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            default:
                throw new Error("Not supported axis type provided! Type: " + type);
        }
        updateNumericAxisLabelsVisibility(axisTickMarkGroup, chartController, selectionController, hotspotController, !type === AxisTypes.Y_AXIS);
    };

    chartController.onPartitionsChanged(_ => render());
    hotspotController.onHotspotChanged(    _=> updateNumericAxisLabelsVisibility(axisTickMarkGroup, chartController, selectionController, hotspotController, type === AxisTypes.Y_AXIS));
    selectionController.onSelectionChanged(_=> updateNumericAxisLabelsVisibility(axisTickMarkGroup, chartController, selectionController, hotspotController, type === AxisTypes.Y_AXIS));

    switch (type) {
        case AxisTypes.X_AXIS: coordinatesController.onXRangeChanged(_ => render()); break;
        case AxisTypes.Y_AXIS: coordinatesController.onYRangeChanged(_ => render()); break;
        default: throw new Error("Not supported axis type provided! Type: " + type);
    }

    /**
     * Adjust the font size of the labels according to the size of the root SVG
     * @param { number } svgWidth
     *
     * @return { void }
     */
    const updateFontSize = svgWidth => updateLabelFontSizeByClass(axisTickMarkGroup, svgWidth, viewboxLength, ".axis-label, .partition-label");

    return [axisTickMarkGroup, updateFontSize];
};


/**
 * Create the ticks for the x-axis
 * @param { ChartControllerType } chartController
 * @param { CoordinatesControllerType } coordinatesController
 * @param { number } axisLength
 *
 * @return { SVGGElement }
 */
const createXTicks = (chartController, coordinatesController, axisLength) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("tick-label-group");

    const partitions = chartController.getPartitions();

    const range = coordinatesController.getXRange();
    const ticks = getNiceTicks(range.min, range.max);

    ticks.majors.map(tick => {
        const pos = coordinatesController.getXAxisPosition(partitions, tick, axisLength);
        const label = createLabel(
            pos,
            5,
            formatNumber(tick),
            "middle");

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createXAxisMajorTick(pos, 0));
    });

    ticks.minors.map(tick => {
        const pos = coordinatesController.getXAxisPosition(partitions, tick, axisLength);
        tickLabelGroup.appendChild(createXAxisMinorTick(pos, 0));
    });

    const partitionKeysByValue = groupPartitionKeysBy(partitions, chartController.getXAxisValueAccessor());

    Object.entries(partitionKeysByValue).forEach(([value, keys]) => {
        const pos = coordinatesController.getXAxisPosition(partitions, value, axisLength);
        const num = Number(value);

        const label = createLabel(
            pos,
            5,
            formatNumber(num),
            "middle",
            "partition-label");


        const keyJson = JSON.stringify(keys);
        console.log('keyJson: ', keyJson);

        label.setAttribute(ATTRIBUTE_PARTITION_KEYS, keyJson);

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createXAxisMinorTick(pos, 0, keyJson, "partition-tick"));
    });

    return tickLabelGroup;
};

/**
 * Create the ticks for the y-axis
 * @param { ChartControllerType } chartController
 * @param { CoordinatesControllerType } coordinatesController
 * @param { number } axisLength
 *
 * @return { SVGGElement }
 */
const createYTicks = (chartController, coordinatesController,  axisLength) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("tick-label-group");

    const partitions = chartController.getPartitions();

    const range = coordinatesController.getYRange();
    const ticks = getNiceTicks(range.min, range.max);

    ticks.majors.map(tick => {
        const yAxisPos = axisLength - coordinatesController.getYAxisPosition(partitions, tick, axisLength);
        const xAxisPos = - axisLength * 0.03;

        const label = createLabel(
            xAxisPos,
            yAxisPos,
            formatNumber(tick),
            "end");

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createYAxisMajorTick(0, yAxisPos));
    });

    ticks.minors.map(tick => {
        const pos = coordinatesController.getYAxisPosition(partitions, tick, axisLength);
        tickLabelGroup.appendChild(createYAxisMinorTick(0, pos));
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
        tickLabelGroup.appendChild(createYAxisMinorTick(0, yAxisPos, keyJson, "partition-tick"));

    });

    return tickLabelGroup;
};
