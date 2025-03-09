import { dom }                   from "../../../../Kolibri/util/dom.js";
import { removeChildrenFromSVG } from "../../../util/chartUtil.js";
import {
    createLabel,
    createValueLine,
    updateCategoricAxisLabelsVisibility,
    updateLabelFontSizeByClass,
} from "../../../util/axisUtil.js";
import { GridLinesTypes } from "./axisTypes.js";

export { CategoricGridLineProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;
/**
 * Categoric Gridline Projector
 * Constructor for a {@link AxisProjectorType Axis}.
 * @param { CategoricGridlineAxisProjectorDataType } parameterObject
 * @constructor
 *
 * @return { AxisProjectorType }
 */
const CategoricGridLineProjector = ({
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
            .axis-categoric-value-line-group-${ styleId } {         
                .axis-value-line {
                    vector-effect: non-scaling-stroke;
                    stroke:        var(--grey90);
                    stroke-width:  .4;
                }
                
                .axis-label.hidden-label {
                    opacity:    0;
                }
                
                .axis-label.selected-label {
                    font-weight: var(--font-weight-bold);
                }
                
                .axis-label.hotspot-label {
                    font-weight: var(--font-weight);
                    opacity:    1;
                }
                
                .axis-label {
                    font-family:          var(--font-family), system-ui;
                    font-weight:          var(--font-weight-light);
                    font-variant-numeric: tabular-nums;
                    
                    fill:                 var(--font-color);
                    transition:           font-weight var(--animation-duration) ease, opacity var(--animation-duration) ease;
                    alignment-baseline:   middle;
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

    const axisValueLineClass = `axis-categoric-value-line-group-${ styleId }`;
    const axisValueLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    axisValueLineGroup.classList.add(axisValueLineClass);
    axisValueLineGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(axisValueLineGroup, "value-line-label-group");

        switch (type) {
            case GridLinesTypes.HORIZONTAL:
                axisValueLineGroup.appendChild(createHorizontalValueLines(chartController, coordinatesController, axisLength, labelAccessor));
                axisValueLineGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            case GridLinesTypes.VERTICAL:
                axisValueLineGroup.appendChild(createVerticalValueLines(chartController, coordinatesController, axisLength, labelAccessor));
                axisValueLineGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
                break;
            default:
                throw new Error("Not supported GridLine type provided! Type: " + type);
        }
    };

    chartController.onPartitionsChanged(_ => render());
    selectionController.onSelectionChanged(_=> updateCategoricAxisLabelsVisibility(axisValueLineGroup, chartController, selectionController, hotspotController, type === GridLinesTypes.HORIZONTAL));
    hotspotController.onHotspotChanged(    _=> updateCategoricAxisLabelsVisibility(axisValueLineGroup, chartController, selectionController, hotspotController, type === GridLinesTypes.HORIZONTAL));

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
 * @param { ?((p: IPartition) => string) } labelAccessor
 *
 * @return { SVGGElement }
 */
const createVerticalValueLines = (chartController, coordinatesController, axisLength, labelAccessor) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("value-line-label-group");

    const usedValues = new Set();
    const partitions = chartController.getPartitions();

    partitions.forEach(partition => {
        const value = chartController.getXAxisValueAccessor()(partition);

        if (usedValues.has(value)) return;
        usedValues.add(value);

        const pos   = coordinatesController.getXAxisPosition(partitions, value, axisLength);

        const label = createLabel(
            pos,
            axisLength + 5,
            labelAccessor ? labelAccessor(partition) : String(value),
            "middle");
        label.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createValueLine(pos, 0, pos, axisLength));
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
const createHorizontalValueLines = (chartController, coordinatesController, axisLength, labelAccessor) => {
    const tickLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tickLabelGroup.classList.add("value-line-label-group");

    const usedValues = new Set();
    const partitions = chartController.getPartitions();

    partitions.forEach(partition => {
        const value = chartController.getYAxisValueAccessor()(partition);

        if (usedValues.has(value)) return;
        usedValues.add(value);

        const pos = axisLength - coordinatesController.getYAxisPosition(partitions, value, axisLength);

        const label = createLabel(
            - axisLength * 0.03,
            pos - axisLength * 0.015,
            labelAccessor ? labelAccessor(partition) : String(value),
            "end");
        label.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());

        tickLabelGroup.appendChild(label);
        tickLabelGroup.appendChild(createValueLine(- axisLength * 0.07, pos, axisLength, pos));
    });

    return tickLabelGroup;
};
