import { dom } from "../../../kolibri/util/dom.js"
import {
    addRubberbandEventListeners,
    changeHotspotHover,
    createSvgShadowFilter,
    removeChildrenFromSVG,
} from "../../util/chartUtil.js";

export { BubbleChartProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

/**
 * Bubble Chart
 * @param { SVGRubberbandChartProjectorDataType & TwoDimensionalChartProjectorDataType } parameterObject
 * @constructor
 *
 * @return { ChartProjectorType }
 */
const BubbleChartProjector = ({
    chartController,
    coordinatesController,
    selectionController,
    hotspotController,
    viewBox,
    svgId
}) => {
    const padding = viewBox.width * 0.1;
    const styleId = counter++;

    const [css] = dom(`   
        <style>   
            .bubble-group-${ styleId } {
                .bubble-point {
                    fill:       var(--color1);
                    opacity:    0;
                    animation:  bubbleShow var(--animation-duration) forwards;
                    transition: filter var(--animation-duration) ease;
                }
                
                .bubble-point.bubble-point-hover {
                    filter: brightness(1.15);
                }
                
                .bubble-point.bubble-point-selected {
                    filter: url(#bubble-shadow);
                }
            }
            
            @keyframes bubbleShow {
                to { opacity: 1; }
            }
        </style>
    `);

    const bubbleClass = `bubble-group-${ styleId }`;
    const bubbleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    bubbleGroup.classList.add(bubbleClass);
    bubbleGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(bubbleGroup, "bubble-points");
        bubbleGroup.appendChild(drawPoints(chartController, coordinatesController, selectionController, hotspotController, viewBox, padding));
    };
    chartController.onPartitionsChanged(_ => render(false));
    coordinatesController.onAnyRangeChanged(_ => render(false));
    selectionController.onSelectionChanged(_ => render(false));
    hotspotController.onHotspotChanged(partition => changeHotspotHover(bubbleGroup, "bubble-point", partition, chartController, ATTRIBUTE_PARTITION_KEY));

    addRubberbandEventListeners(svgId, "bubble-point", chartController, selectionController);

    return bubbleGroup;
};

/**
 * Draw the Scatter chart
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 * @param { number }                       padding
 * @param { ViewBoxType }                  viewBox
 *
 * @return { SVGGElement }
 */
const drawPoints = (chartController, coordinatesController, selectionController, hotspotController, viewBox, padding) => {
    const bubbleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const innerWidth  = viewBox.width  - 2 * padding;
    const innerHeight = viewBox.height - 2 * padding;

    const partitions = chartController.getPartitions();
    if (partitions.length <= 0) return bubbleGroup;

    const xPositions = coordinatesController.getXAxisPositionValues(partitions, innerWidth);
    const yPositions = coordinatesController.getYAxisPositionValues(partitions, innerHeight);

    const sizeValueAccessor = chartController.getSizeValueAccessor();
    const average = partitions.map(p => sizeValueAccessor(p)).sum() / partitions.length;

    bubbleGroup.classList.add("bubble-points");

    partitions.forEach((partition, index) => {
        const x = xPositions[partition.getKey()] + padding;
        const y = innerHeight - yPositions[partition.getKey()] + padding;
        const r = sizeValueAccessor(partition) / average * 3;

        /**
         * @type { PointType }
         */
        const currPoint = { x, y };

        const isSelected = selectionController.isSelected(partition);
        const bubbleCircle = createPointCircle(partition, currPoint, r, padding, isSelected, index);

        bubbleGroup.appendChild(bubbleCircle);

        addEventListeners(bubbleCircle, chartController, hotspotController, selectionController);
    });

    bubbleGroup.appendChild(createSvgShadowFilter("bubble-shadow"));

    return bubbleGroup;
};

/**
 * Create a point circle
 * @param { IPartition } partition
 * @param { PointType }  currPoint
 * @param { number }     radius
 * @param { number }     padding
 * @param { boolean }    isSelected
 * @param { number }     index
 *
 * @return { SVGCircleElement }
 */
const createPointCircle = (partition, currPoint, radius,  padding, isSelected, index) => {
    const pointCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    pointCircle.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());
    pointCircle.setAttribute("cx", `${ currPoint.x }`);
    pointCircle.setAttribute("cy", `${ currPoint.y }`);
    pointCircle.setAttribute("r",  `${ radius }`);
    pointCircle.classList.add("bubble-point", `bubble-point-${ partition.getKey() }`);
    pointCircle.style.animationDelay = `${ 0.01 * (index + 1) }s`;

    if (isSelected) {
        pointCircle.classList.add("bubble-point-selected");
    }

    return pointCircle;
};

/**
 * Add event listeners to the points
 * @param { Element }                      pointCircle
 * @param { ChartControllerType }          chartController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 *
 * @return { void }
 */
const addEventListeners = (pointCircle, chartController, hotspotController, selectionController) => {
    const partitionKey = pointCircle.getAttribute(ATTRIBUTE_PARTITION_KEY);
    const partition = chartController.find(partitionKey);

    pointCircle.addEventListener('click', () => {
        if (partition === undefined) return;

        if (selectionController.isSelected(partition)) {
            selectionController.unselect(partition);
        } else {
            selectionController.select(partition);
        }
    });

    pointCircle.addEventListener('mousemove', () => {
        if (hotspotController.getHotspot()?.getKey() !== partitionKey) {
            hotspotController.setHotspot(partition);
        }
    });

    pointCircle.addEventListener('mouseleave', () => {
        hotspotController.setHotspot(undefined);
    });
};
