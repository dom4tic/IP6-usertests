import { dom }          from "../../kolibri/util/dom.js"
import { formatNumber } from "./axisUtil.js";

export { reduceCount, reduceSum, identity, hideTooltip, removeChildrenFromSVG, addRubberbandEventListeners, createSVG, addLineEventListeners, changeHotspotHover, showTooltipAt, createSvgShadowFilter, calculateTooltipPosition, isNumericAndFinite };

/**
 * A function which counts the amount of elements a reduce function was applied to.
 *
 * @param { number | {} } acc
 * @param _
 * @return { number }
 */
const reduceCount = (acc, _) => {
    if (isNaN(acc)) {
        acc = 1;
    } else {
        acc++;
    }
    return acc;
};

/**
 * A function which sums the values of the elements a reduce function was applied to.
 * @param { (data: *) => number } addendAccessor
 *
 * @return { function(*, *): number }
 * @example
 * reduceSum(d => d.dataValue);
 * reduceSum(d => d.size);
 */
const reduceSum = addendAccessor => (acc, curr) => {
    if (isNaN(acc)) {
        acc = 0;
    }

    acc += addendAccessor(curr);

    return acc;
};

/**
 * A function which returns the last element of the elements a reduce function was applied to.
 *
 * @param _
 * @param { any } curr
 * @return { any }
 */
const identity = (_, curr) => curr;

/**
 * Show a tooltip at the given absolut coordinates
 * @param { PointType }       coordinates
 * @param { string | number } value
 */
const showTooltipAt = (coordinates, value) => {
    const tooltip = document.getElementById('popup');
    tooltip.textContent = String(value);
    tooltip.style.opacity = '1';

    const tooltipRect = tooltip.getBoundingClientRect();

    // position the Tooltip center at the defined coordinates
    tooltip.style.left = `${ coordinates.x - tooltipRect.width / 2 }px`;
    tooltip.style.top  = `${ coordinates.y - tooltipRect.height / 2 }px`;
};

/**
 * Hide the tooltip
 * @returns { void }
 */
const hideTooltip = () => {
    const tooltip = document.getElementById('popup'); // TODO: improve this
    tooltip.style.opacity = '0';
};

/**
 * Remove all children from the svg with the given class
 * @param { SVGElement } svg
 * @param { string } childClass
 */
const removeChildrenFromSVG = (svg, childClass) => {
    const elements = svg.querySelectorAll(`.${ childClass }`);
    elements.forEach(element => element.remove());
};

/**
 * Add all needed event listeners for rubberband selection
 * @param { string } svgId
 * @param { string } pointClass
 * @param { ChartControllerType } chartController
 * @param { MultiSelectionControllerType } selectionController
 *
 * @returns { void }
 */
const addRubberbandEventListeners = (svgId, pointClass, chartController, selectionController) => {
    let rubberbandRect, startX, startY;

    document.addEventListener('mousedown', event => {
        const svgElement = document.getElementById(svgId);

        if (svgElement && event.target === svgElement) {
            // remove rubberband if it exists
            if (svgElement.querySelectorAll('.rubberband').length > 0) {
                svgElement.removeChild(svgElement.querySelector('.rubberband'));
            }

            // add class to all points
            svgElement.querySelectorAll(`.${ pointClass }`).forEach(point => {
                point.classList.add("rubberband-active");
            });

            // Calculate the starting point of the rubberband
            const point = svgElement.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            const svgCoords = point.matrixTransform(svgElement.getScreenCTM().inverse());

            startX = svgCoords.x;
            startY = svgCoords.y;

            rubberbandRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rubberbandRect.classList.add("rubberband");
            rubberbandRect.setAttribute("x", startX);
            rubberbandRect.setAttribute("y", startY);
            rubberbandRect.setAttribute("width", '0');
            rubberbandRect.setAttribute("height", '0');
            rubberbandRect.setAttribute("pointer-events", "none");
            svgElement.appendChild(rubberbandRect);

            svgElement.addEventListener('mousemove', resizeRubberband);
            svgElement.addEventListener('mouseup', completeRubberbandSelection);
        }
    });

    const getSVGCoords = (event, svgElement) => {
        const point = svgElement.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(svgElement.getScreenCTM().inverse());
    };

    const resizeRubberband = event => {
        const svgElement = document.getElementById(svgId);
        const svgCoords = getSVGCoords(event, svgElement);

        const currentX = svgCoords.x;
        const currentY = svgCoords.y;

        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(startX - currentX);
        const height = Math.abs(startY - currentY);

        rubberbandRect.setAttribute("x", x);
        rubberbandRect.setAttribute("y", y);
        rubberbandRect.setAttribute("width", width);
        rubberbandRect.setAttribute("height", height);
    };

    const completeRubberbandSelection = () => {
        const svgElement = document.getElementById(svgId);
        if (!svgElement || !rubberbandRect) return;

        const x1 = parseFloat(rubberbandRect.getAttribute("x"));
        const y1 = parseFloat(rubberbandRect.getAttribute("y"));
        const x2 = x1 + parseFloat(rubberbandRect.getAttribute("width"));
        const y2 = y1 + parseFloat(rubberbandRect.getAttribute("height"));

        const selectedPartitions = chartController.getPartitions().filter((partition, index) => {
            const point = svgElement.querySelectorAll(`.${ pointClass }`)[index];
            const px = parseFloat(point.getAttribute("cx"));
            const py = parseFloat(point.getAttribute("cy"));

            // Check if the point is inside the rubberband selection area
            const withinBoundsX = px >= x1 && px <= x2;
            const withinBoundsY = py >= y1 && py <= y2;

            return withinBoundsX && withinBoundsY;
        });

        svgElement.querySelectorAll(`.${ pointClass }`).forEach(point => {
            point.classList.remove("rubberband-active");
        });

        // Update Selection
        selectionController.clearSelection();
        selectedPartitions.forEach(partition => selectionController.select(partition));

        // remove event listeners
        svgElement.removeEventListener('mousemove', resizeRubberband);
        svgElement.removeEventListener('mouseup', completeRubberbandSelection);

        // remove rubberband after selection
        if (svgElement.querySelectorAll('.rubberband').length > 0) {
            svgElement.removeChild(svgElement.querySelector('.rubberband'));
        }
    };
};

/**
 * SVG Creation function
 *
 *  @param { string } svgId
 *  @param { ViewBoxType } viewBox
 *
 *  @returns { SVGElement }
 *
 * @constructor
 */

const createSVG = (svgId, viewBox) => {

    const [svg] = dom(`
        <svg id="${ svgId }" class="chart" viewBox="${ viewBox.x } ${ viewBox.y } ${ viewBox.width } ${ viewBox.height }" xmlns="http://www.w3.org/2000/svg"></svg>
    `);

    return svg;
};


/**
 * Add event listeners to the line point
 * @param { Element }                      pointCircle
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 * @param { string }                       hotspotController
 * @param { string }                       attributePartitionKey
 *
 * @return { void }
 */
const addLineEventListeners = (pointCircle, chartController, selectionController, hotspotController, attributePartitionKey) => {
    const partitionKey = pointCircle.getAttribute(attributePartitionKey);
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

/**
 * Add the hover class to the point at the hover index
 * @param { SVGElement }          svg
 * @param { string }          elementClass
 * @param { IPartition }          partition
 * @param { ChartControllerType } chartController
 * @param { string }              attributePartitionKey
 *
 * @return { void }
 */
const changeHotspotHover = (svg, elementClass, partition, chartController, attributePartitionKey) => {
    svg.querySelectorAll(`.${ elementClass }`).forEach(point => point.classList.remove(`${ elementClass }-hover`));
    svg.querySelectorAll(`.${ elementClass }`).forEach(point => point.classList.add(`${ elementClass }-hidden`));

    if (partition === undefined) {
        hideTooltip();
        return;
    }

    const point = svg.querySelector(`.${ elementClass }[${ attributePartitionKey }="${ partition.getKey() }"]`);
    const pointPartition = chartController.getPartitions().find(p => p.getKey() === partition.getKey());
    const pointValue = pointPartition.getValue();

    let pointTooltipValue = isNumericAndFinite(pointValue) ? formatNumber(pointValue) : pointValue;

    if (typeof pointValue === 'object') {
        pointTooltipValue = Object.entries(pointValue).reduce((acc, [key, value]) => {
            const val = isNumericAndFinite(value) ? formatNumber(value) : value;
            return `${ acc } ${ key }: ${ val },`;
        }, '');

        pointTooltipValue = pointTooltipValue.slice(0, -1);
    }
    const pointKey   = pointPartition.getKey();

    svg.querySelectorAll(`.${ elementClass }`).forEach(point => point.classList.remove(`${ elementClass }-hidden`));
    point.classList.add(`${ elementClass }-hover`);

    const tooltipPosition = calculateTooltipPosition(point);

    showTooltipAt(tooltipPosition, `${ pointKey }: ${ pointTooltipValue }`);
};

/**
 * Calculate the position the tooltip should be shown at
 * @param { SVGPathElement } svgElelement
 *
 * @return { PointType }
 */
const calculateTooltipPosition = svgElelement => {
    const bcPoint = svgElelement.getBoundingClientRect();
    const absoluteX = bcPoint.left + bcPoint.width / 2 + window.scrollX;
    const absoluteY = bcPoint.top - 25 + window.scrollY;

    return { x: absoluteX, y: absoluteY };
};

/**
 * Create a filter with two feDropShadow elements
 * @param { string } id
 *
 * @return { SVGFilterElement }
 */
const createSvgShadowFilter = id => {
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "300%");
    filter.setAttribute("height", "300%");

    const dropShadow1 = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
    dropShadow1.setAttribute("dx", ".6");
    dropShadow1.setAttribute("dy", "-.3");
    dropShadow1.setAttribute("stdDeviation", ".4");
    dropShadow1.setAttribute("flood-color", "var(--grey40)");

    const dropShadow2 = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
    dropShadow2.setAttribute("dx", "-.6");
    dropShadow2.setAttribute("dy", ".1");
    dropShadow2.setAttribute("stdDeviation", ".4");
    dropShadow2.setAttribute("flood-color", "var(--grey80)");

    const dropShadow3 = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
    dropShadow3.setAttribute("dx", ".6");
    dropShadow3.setAttribute("dy", ".6");
    dropShadow3.setAttribute("stdDeviation", ".4");
    dropShadow3.setAttribute("flood-color", "var(--grey80)");

    filter.appendChild(dropShadow1);
    filter.appendChild(dropShadow2);
    filter.appendChild(dropShadow3);

    return filter;
};

const isNumericAndFinite = value => {
    if (value === null) {
        return false;
    }

    const number = Number(value);
    return Number.isFinite(number);
};
