import { dom } from "../../../kolibri/util/dom.js"
import {
    hideTooltip,
    removeChildrenFromSVG,
    showTooltipAt,
    calculateTooltipPosition
} from "../../util/chartUtil.js";
import { createSvgShadowFilter } from "../../util/chartUtil.js";

export { BarChartProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

// TODO: fix ChartProjectorDataType { chartController, coordinatesController, selectionController, hotspotController, viewBox }

/**
 * Bar Chart SVG
 * Constructor for a {@link ChartProjectorType Chart}.
 * @param { SVGChartProjectorDataType & TwoDimensionalChartProjectorDataType } parameterObject
 * @constructor
 *
 * @return { ChartProjectorType }
 */
const BarChartProjector = ({
    chartController,
    coordinatesController,
    selectionController,
    hotspotController,
    viewBox
}) => {
    const padding = viewBox.width * 0.1;
    const styleId = counter++;

    const [css] = dom(`   
        <style>
            .bars-group-${ styleId } {   
                .bar {
                    cursor:     pointer;
                    rx:         .08em;
                    opacity:    1;
                    transition: opacity var(--animation-duration) ease;
                }
                
                .bar.animate {
                    opacity: 0;
                    animation:  barShow var(--animation-duration) forwards;
                }
                
                .bar.selected-bar {
                    opacity:    1;
                    filter:     url(#bar-shadow);
                }
                
                .bar.faded-bar {
                    opacity: .5;
                }
    
                .bar:nth-child(11n+1)  { fill: var(--color0); }
                .bar:nth-child(11n+2)  { fill: var(--color1); }
                .bar:nth-child(11n+3)  { fill: var(--color2); }
                .bar:nth-child(11n+4)  { fill: var(--color3); }
                .bar:nth-child(11n+5)  { fill: var(--color4); }
                .bar:nth-child(11n+6)  { fill: var(--color5); }
                .bar:nth-child(11n+7)  { fill: var(--color6); }
                .bar:nth-child(11n+8)  { fill: var(--color7); }
                .bar:nth-child(11n+9)  { fill: var(--color8); }
                .bar:nth-child(11n+10) { fill: var(--color9); }
                .bar:nth-child(11n+11) { fill: var(--color10); }
            }
            
            @keyframes barShow {
                to { opacity: 1; }
            }
        </style>
    `);

    const barClass = `bars-group-${ styleId }`;
    const barGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    barGroup.classList.add(barClass);
    barGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(barGroup, "bars");
        barGroup.appendChild(drawBars(chartController, coordinatesController, selectionController, hotspotController, viewBox, padding));
    };
    chartController.onPartitionsChanged(    _ => render());
    coordinatesController.onAnyRangeChanged(_ => render());
    selectionController.onSelectionChanged( _ => render());
    hotspotController.onHotspotChanged(partition => changeHotspotHover(barGroup, partition, chartController, selectionController));

    return barGroup;
};

/**
 * Draw the bar chart
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 * @param { ViewBoxType }                  viewBox
 * @param { number }                       padding
 *
 * @return { SVGGElement }
 */
const drawBars = (chartController, coordinatesController, selectionController, hotspotController, viewBox, padding) => {
    const innerWidth  = viewBox.width  - 2 * padding;
    const innerHeight = viewBox.height - 2 * padding;

    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    chartGroup.classList.add("bars");

    const partitions = chartController.getPartitions();
    if (partitions.length <= 0) return chartGroup; // TODO: no-data display

    const xPositions = coordinatesController.getXAxisPositionValues(partitions, innerWidth);
    const yPositions = coordinatesController.getYAxisPositionValues(partitions, innerHeight);

    const barWidth = partitions.length > 0 ? innerWidth / partitions.length * .9: 0;

    partitions.forEach((partition, index) => {
        const isSelected = selectionController.isSelected(partition);
        const someBarIsSelectedButNotThis = selectionController.getSelection().length > 0 && !isSelected;

        const x = xPositions[partition.getKey()] + padding - .5 * barWidth;
        const y = innerHeight - yPositions[partition.getKey()];

        /**
         * @type { PointType }
         */
        const currPoint = { x, y };

        // Create bar rectangle element
        const bar = createBar(currPoint, padding, barWidth, innerHeight, partition.getKey(), isSelected, someBarIsSelectedButNotThis, index);

        addEventListeners(bar, chartController, selectionController, hotspotController);

        chartGroup.appendChild(bar);
    });

    chartGroup.appendChild(createSvgShadowFilter("bar-shadow"));

    return chartGroup;
};

/**
 * Create a bar element
 * @param { PointType } currPoint
 * @param { number }    padding
 * @param { number }    barWidth
 * @param { number }    innerHeight
 * @param { string }    partitionKey
 * @param { boolean }   isSelected
 * @param { boolean }   someBarIsSelectedButNotThis
 * @param { number }    index
 *
 * @return { SVGRectElement }
 */
const createBar = (currPoint, padding, barWidth, innerHeight, partitionKey, isSelected, someBarIsSelectedButNotThis, index) => {
    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    bar.setAttribute("x", `${ currPoint.x }`);
    bar.setAttribute("y", `${ currPoint.y + padding }`);
    bar.setAttribute("width", `${ barWidth }`);
    bar.setAttribute("height", `${ innerHeight - currPoint.y }`);
    bar.setAttribute(ATTRIBUTE_PARTITION_KEY, partitionKey);
    bar.classList.add("bar", `bar-${ partitionKey }`);
    bar.style.animationDelay = `${ 0.01 * (index + 1) }s`;

    if (isSelected) {
        bar.classList.add("selected-bar");
    }

    if (someBarIsSelectedButNotThis) {
        bar.classList.add("faded-bar");
    } else {
        bar.classList.add("animate")
    }

    return bar;
};

/**
 * Add the hover class to the bar at the hover index
 * @param { Element }                      chartGroup
 * @param { IPartition }                   partition
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 *
 * @return { void }
 */
const changeHotspotHover = (chartGroup, partition, chartController, selectionController) => {
    const bars = chartGroup.querySelectorAll(".bar");
    const emptySelection = selectionController.getSelection().length !== 0;

    bars.forEach(bar => {
        const isSelected = bar.classList.contains("selected-bar");
        bar.classList.toggle("faded-bar", !isSelected && emptySelection);
    });

    if (!partition) {
        hideTooltip();
        return;
    }

    bars.forEach(bar => {
        const isHoverBar = bar.getAttribute(ATTRIBUTE_PARTITION_KEY) === partition.getKey();
        const isSelected = bar.classList.contains("selected-bar");
        bar.classList.toggle("faded-bar", !isHoverBar && !isSelected);
    });

    const bar = chartGroup.querySelector(`rect.bar[${ATTRIBUTE_PARTITION_KEY}="${partition.getKey()}"]`);
    const barPartition = chartController.getPartitions().find(p => p.getKey() === partition.getKey());
    const tooltipPosition = calculateTooltipPosition(bar);
    showTooltipAt(tooltipPosition, `${ barPartition.getKey() }: ${ barPartition.getValue() }`);
};

/**
 * Add event listeners to the bar group
 * @param { Element }                      bar
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 *
 * @return { void }
 */
const addEventListeners = (bar, chartController, selectionController, hotspotController) => {
    const partitionKey = bar.getAttribute(ATTRIBUTE_PARTITION_KEY);
    const partition = chartController.find(partitionKey);

    bar.addEventListener("click", () => {
        if (partition === undefined) return;

        if (selectionController.isSelected(partition)) {
            selectionController.unselect(partition);
        } else {
            selectionController.select(partition);
        }
    });

    bar.addEventListener("mousemove", () => {
        if (hotspotController.getHotspot()?.getKey() !== partitionKey) {
            hotspotController.setHotspot(partition);
        }
    });

    bar.addEventListener("mouseleave", () => {
        hotspotController.setHotspot(undefined);
    });


    bar.addEventListener('animationend', () => {
        bar.classList.remove("animate");
    });
};
