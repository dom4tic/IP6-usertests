import { dom }                   from "../../../kolibri/util/dom.js"
import {
    hideTooltip,
    isNumericAndFinite,
    removeChildrenFromSVG,
    showTooltipAt
}                                from "../../util/chartUtil.js";
import { createSvgShadowFilter } from "../../util/chartUtil.js";
import { formatNumber }          from "../../util/axisUtil.js";

export { PieChartProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

/**
 * Constructor for a {@link ChartProjectorType Chart}.
 * @param { SVGChartProjectorDataType } parameterObject
 * @return { ChartProjectorType }
 * @constructor
 */
const PieChartProjector = ({
    chartController,
    selectionController,
    hotspotController,
    viewBox
}) => {
    const padding = viewBox.width * 0.1;
    const styleId = counter++;

    const [css] = dom(`   
        <style>
            .pie-group-${ styleId } {
                .slice {
                    stroke-width:      2;
                    stroke-dasharray:  1000;
                    stroke-dashoffset: 1000;
                    transform:         scale(0.5);
                    transform-origin:  60px 60px;
                    animation:         slice-appear var(--animation-duration) ease-out forwards;
                    cursor:  pointer;
                }
                
                .slice.selected-slice {
                    opacity: 1;
                    filter:  url(#slice-shadow);
                }
                
                .slice.faded-slice {
                    opacity: .5;
                }
                
                .slice:nth-child(11n+1)  { stroke: var(--color0); fill: var(--color0); }
                .slice:nth-child(11n+2)  { stroke: var(--color1); fill: var(--color1); }
                .slice:nth-child(11n+3)  { stroke: var(--color2); fill: var(--color2); }
                .slice:nth-child(11n+4)  { stroke: var(--color3); fill: var(--color3); }
                .slice:nth-child(11n+5)  { stroke: var(--color4); fill: var(--color4); }
                .slice:nth-child(11n+6)  { stroke: var(--color5); fill: var(--color5); }
                .slice:nth-child(11n+7)  { stroke: var(--color6); fill: var(--color6); }
                .slice:nth-child(11n+8)  { stroke: var(--color7); fill: var(--color7); }
                .slice:nth-child(11n+9)  { stroke: var(--color8); fill: var(--color8); }
                .slice:nth-child(11n+10) { stroke: var(--color9); fill: var(--color9); }
                .slice:nth-child(11n+11) { stroke: var(--color10);fill: var(--color10); }
                
            }
            
            @keyframes slice-appear {
                to {
                    transform: scale(1);
                }
            }
        </style>
    `);


    const pieClass = `pie-group-${ styleId }`;
    const pieGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    pieGroup.classList.add(pieClass);
    pieGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(pieGroup, "slices");
        pieGroup.appendChild(drawSlices(chartController, selectionController, hotspotController, viewBox, padding));
    };
    chartController.onPartitionsChanged(    _ => render());
    selectionController.onSelectionChanged( _ => render());
    hotspotController.onHotspotChanged(partition => changeHotspotHover(pieGroup, partition, chartController, selectionController));

    return pieGroup;
};


/**
 * Draw the pie chart
 * @param { ChartControllerType } chartController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType } hotspotController
 * @param { Object } viewBox
 * @param { number } padding
 *
 * @return { SVGGElement }
 */
const drawSlices = (chartController, selectionController, hotspotController, viewBox, padding) => {
    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    chartGroup.classList.add("slices");

    const partitions = chartController.getPartitions();
    if (partitions.length <= 0) return chartGroup;

    let centerX, centerY, radius;
    let startAngle = 0;

    const sizeValueAccessor = chartController.getSizeValueAccessor();
    const total = partitions.map(p => sizeValueAccessor(p)).sum();

    partitions.forEach(partition => {
        const isSelected = selectionController.isSelected(partition);
        const someSliceIsSelectedButNotThis = selectionController.getSelection().length > 0 && isSelected === false;

        centerX = getCenterX(padding, viewBox.width);
        centerY = getCenterY(padding, viewBox.width);
        radius  = getRadius( padding, viewBox.width);

        const sliceRadius = isSelected ? radius * 1.1 : radius;
        const sliceAngle  = calculateSliceAngle(sizeValueAccessor(partition) / total);
        const endAngle    = startAngle + sliceAngle;

        // SVG path calculation
        const {x1, y1, x2, y2} = getCoordinates(centerX, centerY, sliceRadius, startAngle, endAngle);
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = `
            M ${ centerX },${ centerY }
            L ${ x1 },${ y1 }
            A ${ sliceRadius },${ sliceRadius } 0 ${ largeArcFlag }, 1 ${ x2 },${ y2 }
            Z
        `;

        const slice = createSlice(pathData, partition, isSelected, someSliceIsSelectedButNotThis);

        chartGroup.appendChild(slice);
        addEventListeners(chartController, selectionController, hotspotController, slice);

        startAngle = endAngle;
    });

    chartGroup.appendChild(createSvgShadowFilter('slice-shadow'));

    return chartGroup;
};

/**
 *
 * @param { string }     pathData
 * @param { IPartition } partition
 * @param { boolean }    isSelected
 * @param { boolean }    someSliceIsSelectedButNotThis
 *
 * @return { SVGPathElement }
 */
const createSlice = (pathData, partition, isSelected, someSliceIsSelectedButNotThis) => {
    const slice = createPathElement(pathData, '');

    slice.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());
    slice.classList.add("slice", `slice-${partition.getKey()}`);

    if (isSelected) {
        slice.classList.add("selected-slice");
    }

    if (someSliceIsSelectedButNotThis) {
        slice.classList.add('faded-slice');
    }

    return slice;
};

/**
 * Add the hover class to the slice at the hover index
 * @param { SVGGElement }                      chartGroup
 * @param { IPartition }                   partition
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 *
 * @return { void }
 */
const changeHotspotHover = (chartGroup, partition, chartController, selectionController) => {
    const slices = chartGroup.querySelectorAll(".slice");
    const emptySelection = selectionController.getSelection().length !== 0;

    slices.forEach(bar => {
        const isSelected = bar.classList.contains("selected-slice");
        bar.classList.toggle("faded-slice", !isSelected && emptySelection);
    });

    if (!partition) {
        hideTooltip();
        return;
    }

    slices.forEach(slice => {
        const isHoverSlice = slice.getAttribute(ATTRIBUTE_PARTITION_KEY) === partition.getKey();
        const isSelected = slice.classList.contains("selected-slice");
        slice.classList.toggle("faded-slice", !isHoverSlice && !isSelected);
    });

    const slice = chartGroup.querySelector(`path.slice[${ATTRIBUTE_PARTITION_KEY}="${partition.getKey()}"]`);
    const slicePartition = chartController.getPartitions().find(p => p.getKey() === partition.getKey());
    const absoluteSlicePosition = calculateAbsolutePosition(slice);
    const tooltipLabel = isNumericAndFinite(slicePartition.getValue()) ? formatNumber(slicePartition.getValue()) : slicePartition.getValue();

    showTooltipAt(absoluteSlicePosition, `${ slicePartition.getKey() }: ${ tooltipLabel }`);
};

/**
 * Calculate the absolute position of a slice
 * @param { SVGPathElement } slice
 *
 * @return { PointType }
 */
const calculateAbsolutePosition = slice => {
    const bcRect = slice.getBoundingClientRect();
    const absoluteX = bcRect.left + bcRect.width / 2 + window.scrollX;
    const absoluteY = bcRect.top + bcRect.height / 2 + window.scrollY;

    return { x: absoluteX, y: absoluteY };
};

/**
 * Get the center of the SVG element on the x-axis
 * @param { number } padding
 * @param { number } viewBoxSize
 *
 * @return { number }
 */
const getCenterX = (padding, viewBoxSize) => padding + (viewBoxSize - 2 * padding) / 2;

/**
 * Get the center of the SVG element on the y-axis
 * @param { number } padding
 * @param { number } viewBoxSize
 *
 * @return { number }
 */
const getCenterY = (padding, viewBoxSize) => padding + (viewBoxSize - 2 * padding) / 2;

/**
 * Get the radius of the SVG element
 * @param { number } padding
 * @param { number } viewBoxSize
 *
 * @return {number}
 */
const getRadius = (padding, viewBoxSize) => Math.min((viewBoxSize - 2 * padding) / 2, (viewBoxSize - 2 * padding) / 2);

/**
 * Get all coordinates of a slice
 * @param { number } centerX
 * @param { number } centerY
 * @param { number } sliceRadius
 * @param { number } startAngle
 * @param { number } endAngle
 *
 * @return {{y1: number, x1: number, y2: number, x2: number}}
 */
const getCoordinates = (centerX, centerY, sliceRadius, startAngle, endAngle) => {
    const x1 = getXCoordinates(centerX, sliceRadius, startAngle);
    const y1 = getYCoordinates(centerY, sliceRadius, startAngle);
    const x2 = getXCoordinates(centerX, sliceRadius, endAngle);
    const y2 = getYCoordinates(centerY, sliceRadius, endAngle);

    return { x1, y1, x2, y2 };
};

/**
 * Get the x coordinates of a slice
 * @param { number } center
 * @param { number } sliceRadius
 * @param { number } angle
 *
 * @return { number }
 */
const getXCoordinates = (center, sliceRadius, angle) => center + sliceRadius * Math.cos(angle);

/**
 * Get the y coordinates of a slice
 * @param { number } center
 * @param { number } sliceRadius
 * @param { number } angle
 *
 * @return { number }
 */
const getYCoordinates = (center, sliceRadius, angle) => center + sliceRadius * Math.sin(angle);

/**
 * Create a svg path element for a slice
 * @param { string } pathData
 * @param { string } fillColor
 *
 * @return { SVGPathElement }
 */
const createPathElement = (pathData, fillColor) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("slice");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", fillColor);

    return path;
};

/**
 * Calculate the angle of a slice
 * @param { number } ratio
 *
 * @return { number }
 */
const calculateSliceAngle = ratio => ratio * 2 * Math.PI;

/**
 * Add event listeners to the slice group
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 * @param { Element }                      slice
 *
 * @return { void }
 */
const addEventListeners = (chartController, selectionController, hotspotController, slice) => {
    const partitionKey = slice.getAttribute(ATTRIBUTE_PARTITION_KEY);
    const partition = chartController.find(partitionKey);

    slice.addEventListener('click', event => {
        if (partition === undefined) return;

        if (selectionController.isSelected(partition)) {
            // same slice, undo selection filter
            selectionController.unselect(partition);
        } else {
            selectionController.select(partition);
        }
    });

    slice.addEventListener('mousemove', event => {
        if (hotspotController.getHotspot()?.getKey() !== partitionKey) {
            hotspotController.setHotspot(partition);
        }
    });

    slice.addEventListener('mouseleave', () => {
        hotspotController.setHotspot(undefined);
    });
};
