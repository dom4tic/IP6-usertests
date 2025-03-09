import { dom } from "../../../kolibri/util/dom.js"
import {
    addLineEventListeners,
    addRubberbandEventListeners,
    changeHotspotHover,
    createSvgShadowFilter,
    removeChildrenFromSVG,
} from "../../util/chartUtil.js";

export { LineChartProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

/**
 * Line Chart SVG
 * @param { SVGRubberbandChartProjectorDataType & TwoDimensionalChartProjectorDataType } parameterObject
 * @constructor
 *
 * @return { ChartProjectorType }
 */
const LineChartProjector = ({
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
            .lines-group-${ styleId } {
                .line-segment {
                    stroke-width:       .6;
                    stroke:             var(--color3); 
                    stroke-dasharray:   1000;
                    stroke-dashoffset:  1000;
                    animation:          lineDraw var(--animation-duration) forwards;
                }
                
                .line-point {
                    fill:       var(--color1);
                    opacity:    0;
                    cursor:     pointer;
                    animation:  pointShow var(--animation-duration) forwards;
                    transition: filter var(--animation-duration) ease,
                                r var(--animation-duration) ease;
                }
                
                .line-point.line-point-hover {
                    filter:     brightness(1.15);
                    r:          1;
                }
                
                .line-point.line-point-selected {
                    filter: url(#point-shadow)
                }
            }
            
            @keyframes pointShow {
                to { opacity: 1; }
            }
            
            @keyframes lineDraw {
                to {
                    stroke-dashoffset: 0;
                }
            }
        </style>
    `);

    const lineClass = `lines-group-${ styleId }`;
    const lineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    lineGroup.classList.add(lineClass);
    lineGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(lineGroup, "line-segments");
        removeChildrenFromSVG(lineGroup, "line-points");

        const [dataLineGroup, pointGroup] = drawLine(chartController, coordinatesController, selectionController, hotspotController, viewBox, padding);
        lineGroup.appendChild(dataLineGroup);
        lineGroup.appendChild(pointGroup);
    };
    chartController.onPartitionsChanged(    _ => render(false));
    coordinatesController.onAnyRangeChanged(_ => render(false));
    selectionController.onSelectionChanged( _ => render(false));
    hotspotController.onHotspotChanged(partition => changeHotspotHover(lineGroup, "line-point", partition, chartController, ATTRIBUTE_PARTITION_KEY));

    addRubberbandEventListeners(svgId, "line-point", chartController, selectionController);

    return lineGroup;
};

/**
 * Draw the line chart
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 * @param { ViewBoxType }                  viewBox
 * @param { number }                       padding
 *
 * @return { [SVGGElement, SVGGElement] }
 */
const drawLine = (chartController, coordinatesController, selectionController, hotspotController, viewBox, padding) => {
    const innerWidth  = viewBox.width  - 2 * padding;
    const innerHeight = viewBox.height - 2 * padding;

    const lineGroup  = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const pointGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    lineGroup .classList.add("line-segments");
    pointGroup.classList.add("line-points");

    const partitions = chartController.getPartitions();
    if (partitions.length <= 0) return [lineGroup, pointGroup]; // TODO: no-data display

    const xPositions = coordinatesController.getXAxisPositionValues(partitions, innerWidth);
    const yPositions = coordinatesController.getYAxisPositionValues(partitions, innerHeight);

    /**
     * @type { PointType }
     */
    let prevPoint = { x: 0, y: 0 };

    partitions.forEach((partition, index) => {
        const x = xPositions[partition.getKey()] + padding;
        const y = innerHeight - yPositions[partition.getKey()];

        /**
         * @type { PointType }
         */
        const currPoint = { x, y };

        const isSelected = selectionController.isSelected(partition);

        // draw the line between the points
        if (index > 0) {
            const lineSegment = createLineSegment(prevPoint, padding, currPoint, partition, index);
            lineGroup.appendChild(lineSegment);
        }

        const pointCircle = createPointCircle(partition, currPoint, padding, isSelected, index);

        pointGroup.appendChild(pointCircle);

        addLineEventListeners(pointCircle, chartController, selectionController, hotspotController, ATTRIBUTE_PARTITION_KEY);

        prevPoint = { x, y };
    });

    pointGroup.appendChild(createSvgShadowFilter("point-shadow"));

    return [lineGroup, pointGroup];
};

/**
 * Create a line segment
 * @param { PointType }  prevPoint
 * @param { number }     padding
 * @param { PointType }  currPoint
 * @param { IPartition } partition
 * @param { number }     index
 *
 * @return { SVGLineElement }
 */
const createLineSegment = (prevPoint, padding, currPoint, partition, index) => {
    const lineSegment = document.createElementNS("http://www.w3.org/2000/svg", "line");

    lineSegment.setAttribute("x1", `${ prevPoint.x }`);
    lineSegment.setAttribute("y1", `${ prevPoint.y + padding }`);
    lineSegment.setAttribute("x2", `${ currPoint.x }`);
    lineSegment.setAttribute("y2", `${ currPoint.y + padding }`);
    lineSegment.classList.add("line-segment", `line-segment-${ partition.getKey() }`);
    lineSegment.style.animationDelay = `${ 0.01 * (index + 1) }s`;

    return lineSegment;
};

/**
 * Create a point circle
 * @param { IPartition } partition
 * @param { PointType }  currPoint
 * @param { number }     padding
 * @param { boolean }    isSelected
 * @param { number }     index
 *
 * @return { SVGCircleElement }
 */
const createPointCircle = (partition, currPoint, padding, isSelected, index) => {
    const pointCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    pointCircle.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());
    pointCircle.setAttribute("cx", `${ currPoint.x }`);
    pointCircle.setAttribute("cy", `${ currPoint.y + padding }`);
    pointCircle.setAttribute("r", isSelected ? "1.2" : ".8");
    pointCircle.classList.add("line-point", `line-point-${ partition.getKey() }`);
    pointCircle.style.animationDelay = `${ 0.01 * (index + 1) }s`;

    if (isSelected) {
        pointCircle.classList.add("line-point-selected");
    }

    return pointCircle;
};
