import { dom }                   from "../../../../Kolibri/util/dom.js";
import { removeChildrenFromSVG } from "../../../util/chartUtil.js";
import {
    createLabel,
    createXAxisMajorTick,
    createYAxisMajorTick,
    updateCategoricAxisLabelsVisibility, updateLabelFontSizeByClass,
}                                from "../../../util/axisUtil.js";
import { AxisTypes } from "./axisTypes.js";

export { CategoricTickMarkProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

/**
 * Categoric Tickmark Projector
 * Constructor for a {@link AxisProjectorType Axis}.
 * @param { CategoricTickmarkAxisProjectorDataType } parameterObject
 * @constructor
 *
 * @return { AxisProjectorType }
 */
const CategoricTickMarkProjector = ({
    chartController,
    coordinatesController,
    selectionController,
    hotspotController,
    viewboxLength,
    type,
    labelAccessor = undefined
}) => {
    const padding    = viewboxLength * .1;
    const axisLength = viewboxLength * .8;
    const styleId = counter++;

    const [css] = dom(`
        <style>   
             .axis-catecoric-tick-mark-group-${ styleId } {         
                .axis-label.hidden-label {
                    opacity:    0;
                }
                
                .axis-label.selected-label {
                    font-weight: var(--font-weight-bold);
                }
                
                .axis-label.hotspot-label {
                    font-weight: var(--font-weight);
                }
                
                .axis-label {
                    font-family:          var(--font-family), system-ui;
                    font-weight:          var(--font-weight-light);
                    font-variant-numeric: tabular-nums;
                    
                    fill:                 var(--font-color);
                    opacity:              1;
                    transition:           font-weight var(--animation-duration) ease, opacity var(--animation-duration) ease;
                    alignment-baseline:   middle;
                }
                
                .axis-tick {
                    vector-effect: non-scaling-stroke;
                    stroke:        var(--grey90);
                    stroke-width:  .8;
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

    const axisTickMarkClass = `axis-catecoric-tick-mark-group-${ styleId }`;
    const axisTickMarkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    axisTickMarkGroup.classList.add(axisTickMarkClass);
    axisTickMarkGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(axisTickMarkGroup, "tick-label-group");
        switch (type) {
            case AxisTypes.X_AXIS:
                axisTickMarkGroup.appendChild(createXTicks(chartController, coordinatesController, axisLength, labelAccessor));
                axisTickMarkGroup.setAttribute("transform", `translate(${ padding }, ${ viewboxLength - padding })`);
                break;
            case AxisTypes.Y_AXIS:
                axisTickMarkGroup.appendChild(createYTicks(chartController, coordinatesController, axisLength, labelAccessor));
                axisTickMarkGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            default:
                throw new Error("Not supported axis type provided! Type: " + type);
        }
    };

    chartController.onPartitionsChanged(_ => render());
    selectionController.onSelectionChanged(_ => updateCategoricAxisLabelsVisibility(axisTickMarkGroup, chartController, selectionController, hotspotController, type === AxisTypes.Y_AXIS));
    hotspotController.onHotspotChanged(    _ => updateCategoricAxisLabelsVisibility(axisTickMarkGroup, chartController, selectionController, hotspotController, type === AxisTypes.Y_AXIS));

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
 * @param { number }              axisLength
 * @param { ?((p: IPartition) => string) } labelAccessor
 *
 * @return { SVGGElement }
 */
const createXTicks = (chartController, coordinatesController, axisLength, labelAccessor) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("tick-label-group");

    const usedValues = new Set();
    const partitions = chartController.getPartitions();

    partitions.forEach(partition => {
        const value = chartController.getXAxisValueAccessor()(partition);

        if (usedValues.has(value)) return;
        usedValues.add(value);

        const pos   = coordinatesController.getXAxisPosition(partitions, value, axisLength);
        const xAxisPos = pos;
        const yAxisPos = 5;

        const label = createLabel(
            xAxisPos,
            yAxisPos,
            labelAccessor ? labelAccessor(partition) : String(value),
            "middle");

        label.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createXAxisMajorTick(pos, 0));
    });


    return tickLabelGroup;
};

/**
 * Create the ticks for the y-axis
 * @param { ChartControllerType } chartController
 * @param { CoordinatesControllerType } coordinatesController
 * @param { number }              axisLength
 * @param { ?((p: IPartition) => string) } labelAccessor
 *
 * @return { SVGGElement }
 */
const createYTicks = (chartController, coordinatesController, axisLength, labelAccessor) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("tick-label-group");

    const usedValues = new Set();
    const partitions = chartController.getPartitions();

    partitions.forEach(partition => {
        const value = chartController.getYAxisValueAccessor()(partition);

        if (usedValues.has(value)) return;
        usedValues.add(value);

        const pos   = axisLength - coordinatesController.getYAxisPosition(partitions, value, axisLength);
        const xAxisPos = - axisLength * 0.03;
        const yAxisPos = pos + axisLength * 0.004;

        const label = createLabel(
            xAxisPos,
            yAxisPos,
            labelAccessor ? labelAccessor(partition) : String(value),
            "end");

        label.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createYAxisMajorTick(0, pos));
    });

    return tickLabelGroup;
};
