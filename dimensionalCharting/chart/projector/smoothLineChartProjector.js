import { dom } from "../../../kolibri/util/dom.js"
import {
    addLineEventListeners,
    addRubberbandEventListeners,
    changeHotspotHover,
    createSvgShadowFilter,
    removeChildrenFromSVG,
} from "../../util/chartUtil.js";

export { SmoothLineChartProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

// TODO: fix chartProjectorType

/**
 * Line Chart SVG
 * Constructor for a {@link ChartProjectorType Chart}.
 * @param { SVGRubberbandChartProjectorDataType & TwoDimensionalChartProjectorDataType } parameterObject
 * @constructor
 *
 * @return { ChartProjectorType }
 */
const SmoothLineChartProjector = ({
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
                    fill:               none;
                }
                
                .line-point {
                    fill:      var(--color1);
                    opacity:   1;
                    cursor:    pointer;
                    transition: opacity var(--animation-duration) ease, 
                                fill var(--animation-duration) ease, 
                                r var(--animation-duration) ease;
                }
                
                .line-point.line-point-hidden {
                    fill:   transparent;
                    stroke: transparent;
                }
                
                .line-point.line-point-hover {
                    opacity:    1;
                    filter:     brightness(1.15);
                    r:          1;
                }
                
                .line-point.line-point-selected {
                    fill:    var(--color1);
                    opacity: 1;
                    filter:  url(#point-shadow);
                }
                
                .line-point.rubberband-active {
                    opacity:   1;
                    fill:      var(--color1);
                }
            }
            
            @keyframes lineDraw {
                to {
                    stroke-dashoffset: 0;
                }
            }
        </style>
    `);

    const smoothLineClass = `lines-group-${ styleId }`;
    const smoothLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    smoothLineGroup.classList.add(smoothLineClass);
    smoothLineGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(smoothLineGroup, "line-segments");
        removeChildrenFromSVG(smoothLineGroup, "line-points");

        const [lineGroup, pointGroup] = drawLine(chartController, coordinatesController, selectionController, hotspotController, viewBox, padding);
        smoothLineGroup.appendChild(lineGroup);
        smoothLineGroup.appendChild(pointGroup);
    };
    chartController.onPartitionsChanged(    _ => render());
    coordinatesController.onAnyRangeChanged(_ => render());
    selectionController.onSelectionChanged( _ => render());
    hotspotController.onHotspotChanged(partition => changeHotspotHover(smoothLineGroup, "line-point", partition, chartController, ATTRIBUTE_PARTITION_KEY));

    addRubberbandEventListeners(svgId, "line-point", chartController, selectionController);

    return smoothLineGroup;
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
    if (partitions.length <= 0) return [lineGroup, pointGroup];

    const xPositions = coordinatesController.getXAxisPositionValues(partitions, innerWidth);
    const yPositions = coordinatesController.getYAxisPositionValues(partitions, innerHeight);

    const points = [];

    /**
     * @type { PointType }
     */
    let prevPoint = { x: 0, y: 0 };

    partitions.forEach((partition, index) => {
        const x = xPositions[partition.getKey()] + padding;
        const y = innerHeight - yPositions[partition.getKey()] + padding;

        /**
         * @type { PointType }
         */
        const currPoint = { x, y };

        points.push(currPoint);

        const isSelected = selectionController.isSelected(partition);
        const pointCircle = createPointCircle(partition, currPoint, padding, isSelected, index);

        addLineEventListeners(pointCircle, chartController, selectionController, hotspotController, ATTRIBUTE_PARTITION_KEY);

        pointGroup.appendChild(pointCircle);
        prevPoint = { x, y };
    });

    if (partitions.length === 1) {
        pointGroup.querySelector(".line-point").classList.remove("line-point-hidden");
    }

    const path = catmullRom2bezier(points);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

    line.setAttribute("d", path);
    line.classList.add("line-segment");

    lineGroup.appendChild(line);

    lineGroup.addEventListener("mousemove", () => {
        pointGroup.querySelectorAll(".line-point").forEach(point => point.classList.remove("line-point-hidden"));
    });

    lineGroup.addEventListener("mouseleave", () => {
        pointGroup.querySelectorAll(".line-point").forEach(point => {
            if (!point.classList.contains("line-point-selected")) {
                point.classList.add("line-point-hidden");
            }
        });
    });

    lineGroup.appendChild(createSvgShadowFilter("point-shadow"));

    return [lineGroup, pointGroup];
};

// source: https://github.com/ariutta/catmullrom2bezier
// refined by ChatGPT
/**
 * Convert a array of points to a bezier curve (catmull-rom to have all points included in the curve)
 * @param { [number] } points
 *
 * @return { string }
 */
const catmullRom2bezier = points => {
    let d = `M ${ points[0].x },${ points[0].y }`;
    for (let i = 0; i < points.length - 1; i++) {
        // calculate the control points
        // take the first point twice and the last point twice
        const p0 = i === 0 ? points[0] : points[i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i + 2 < points.length ? points[i + 2] : p2;

        // calculate the control points
        const cp1x = p1.x + (p2.x - p0.x) / 8;
        const cp1y = p1.y + (p2.y - p0.y) / 8;
        const cp2x = p2.x - (p3.x - p1.x) / 8;
        const cp2y = p2.y - (p3.y - p1.y) / 8;

        // add the curve to the path
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
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
    pointCircle.setAttribute("cy", `${ currPoint.y }`);
    pointCircle.setAttribute("r", isSelected ? "1.2" : ".8");
    pointCircle.classList.add("line-point", `line-point-hidden`, `line-point-${ partition.getKey() }`);

    if (isSelected) {
        pointCircle.classList.add("line-point-selected");
        pointCircle.classList.remove("line-point-hidden");
    }

    return pointCircle;
};
