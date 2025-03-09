import { dom } from "../../../kolibri/util/dom.js"
import {
    addRubberbandEventListeners, changeHotspotHover,
    createSvgShadowFilter,
    removeChildrenFromSVG,
} from "../../util/chartUtil.js";

export { ScatterChartProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

/**
 * Scatter Chart SVG
 * @param { SVGRubberbandChartProjectorDataType & TwoDimensionalChartProjectorDataType } parameterObject
 * @constructor
 *
 * @return { ChartProjectorType }
 */
const ScatterChartProjector = ({
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
            .points-group-${ styleId } {
                .scatter-point {
                    fill:      var(--color1);
                    opacity:   0;
                    animation: scatterPointShow var(--animation-duration) forwards;
                    transition: filter var(--animation-duration) ease, r var(--animation-duration) ease;
                }
            
                text {
                    pointer-events:      none;
                    -webkit-user-select: none;
                    -moz-user-select:    none;
                    -ms-user-select:     none;
                    user-select:         none;
                }
                
                .scatter-point.scatter-point-hover {
                    filter:     brightness(1.15);
                    r:          1;
                }
                
                .scatter-point.scatter-point-selected {
                    filter: url(#point-shadow);
                }
            }
            
            @keyframes scatterPointShow {
                to { opacity: 1; }
            }
        </style>
    `);

    const scatterClass = `points-group-${ styleId }`;
    const scatterGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    scatterGroup.classList.add(scatterClass);
    scatterGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(scatterGroup, "scatter-points");
        scatterGroup.appendChild(drawPoints(chartController, coordinatesController, selectionController, hotspotController, viewBox, padding));
    };
    chartController.onPartitionsChanged(    _ => render(false));
    coordinatesController.onAnyRangeChanged(_ => render(false));
    selectionController.onSelectionChanged( _ => render(false));
    // hotspotController.onHotspotChanged(partition => changeHotspotHover(scatterGroup, partition, chartController));
    hotspotController.onHotspotChanged(partition => changeHotspotHover(scatterGroup, "scatter-point", partition, chartController, ATTRIBUTE_PARTITION_KEY));
    addRubberbandEventListeners(svgId, "scatter-point", chartController, selectionController);

    return scatterGroup;
};

/**
 * Draw the scatter chart
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 * @param { ViewBoxType }                  viewBox
 * @param { number }                       padding
 *
 * @return { SVGGElement }
 */
const drawPoints = (chartController, coordinatesController, selectionController, hotspotController, viewBox, padding) => {
    const innerWidth  = viewBox.width  - 2 * padding;
    const innerHeight = viewBox.height - 2 * padding;

    const pointGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pointGroup.classList.add("scatter-points");

    const partitions = chartController.getPartitions();
    if (partitions.length <= 0) return pointGroup;

    const xPositions = coordinatesController.getXAxisPositionValues(partitions, innerWidth);
    const yPositions = coordinatesController.getYAxisPositionValues(partitions, innerHeight);

    partitions.forEach((partition, index) => {
        const x = xPositions[partition.getKey()] + padding;
        const y = innerHeight - yPositions[partition.getKey()] + padding;

        /**
         * @type { PointType }
         */
        const currPoint = { x, y };

        const isSelected = selectionController.isSelected(partition);
        const pointCircle = createPointCircle(partition, currPoint, isSelected, index);

        pointGroup.appendChild(pointCircle);

        addEventListeners(pointCircle, chartController, selectionController, hotspotController);
    });

    pointGroup.appendChild(createSvgShadowFilter("point-shadow"));

    return pointGroup;
};

/**
 * Create a point circle
 * @param { IPartition } partition
 * @param { PointType }  currPoint
 * @param { boolean }    isSelected
 * @param { number }     index
 *
 * @return { SVGCircleElement }
 */
const createPointCircle = (partition, currPoint, isSelected, index) => {
    const pointCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    pointCircle.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());
    pointCircle.setAttribute("cx", `${ currPoint.x }`);
    pointCircle.setAttribute("cy", `${ currPoint.y }`);
    pointCircle.setAttribute("r", isSelected ? "1.2" : ".8");
    pointCircle.classList.add("scatter-point", `scatter-point-${ partition.getKey() }`);
    pointCircle.style.animationDelay = `${ 0.01 * (index + 1) }s`;

    if (isSelected) {
        pointCircle.classList.add("scatter-point-selected");
    }

    return pointCircle;
};

/**
 * Add event listeners to the points
 * @param { Element }                      pointCircle
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 *
 * @return { void }
 */
const addEventListeners = (pointCircle, chartController, selectionController, hotspotController) => {
    const partitionKey = pointCircle.getAttribute(ATTRIBUTE_PARTITION_KEY);
    const partition = chartController.find(partitionKey);

    pointCircle.addEventListener("click", () => {
        if (partition === undefined) return;

        if (selectionController.isSelected(partition)) {
            selectionController.unselect(partition);
        } else {
            selectionController.select(partition);
        }
    });

    pointCircle.addEventListener("mousemove", () => {
        if (hotspotController.getHotspot()?.getKey() !== partitionKey) {
            hotspotController.setHotspot(partition);
        }
    });

    pointCircle.addEventListener("mouseleave", () => {
        hotspotController.setHotspot(undefined);
    });
};
