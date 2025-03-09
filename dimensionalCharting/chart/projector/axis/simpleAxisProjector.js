import { dom }                             from "../../../../Kolibri/util/dom.js";
import { removeChildrenFromSVG }           from "../../../util/chartUtil.js";
import { updateLabelFontSizeByClass }      from "../../../util/axisUtil.js";

export { SimpleAxisProjector }

let counter = 0;

/**
 * @typedef SimpleAxisProjectorType
 *
 * @param { number }  axisLength
 * @param { boolean } [showXAxis = true]
 * @param { boolean } [showYAxis = true]
 * @param { string }  [xAxisDescription = ""]
 * @param { string }  [yAxisDescription = ""]
 *
 * @return { [SVGGElement, (svgWidth:number) => void] }
 */
const SimpleAxisProjector = (axisLength, showXAxis = true, showYAxis = true, xAxisDescription = "", yAxisDescription = "") => {
    const padding = axisLength * 0.1;
    const styleId = counter++;

    const [css] = dom(`
        <style>
            .axis-stroke-group-${ styleId } {
                .axis-stroke {
                    vector-effect: non-scaling-stroke;
                    stroke:        var(--grey90);
                    stroke-width:  .8;
                }
                
                .axis-description {
                    font-family:          var(--font-family), system-ui;
                    font-weight:          var(--font-weight-light);
                    
                    fill:                 var(--font-color);
                    opacity:              1;
                    transition:           font-weight var(--animation-duration) ease;
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

    const axisStrokeClass = `axis-stroke-group-${ styleId }`;
    const axisStrokeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    axisStrokeGroup.classList.add(axisStrokeClass);
    axisStrokeGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(axisStrokeGroup, axisStrokeClass);
        const origin = { x: padding, y: axisLength - padding } ;

        if (showXAxis) {
            const coordinates = calculateXAxisCoordinates(origin, axisLength, padding);
            const descriptionCoordinates = calculateXAxisDescriptionCoordinates(origin, axisLength, padding);
            axisStrokeGroup.appendChild(createAxis(coordinates, xAxisDescription, descriptionCoordinates));
        }

        if (showYAxis) {
            const coordinates = calculateYAxisCoordinates(origin, padding);
            const descriptionCoordinates = calculateYAxisDescriptionCoordinates(origin, axisLength, padding);
            axisStrokeGroup.appendChild(createAxis(coordinates, yAxisDescription, descriptionCoordinates));
        }
    };

    render();

    /**
     * Adjust the font size of the labels according to the size of the root SVG
     * @param { number } svgWidth
     *
     * @return { void }
     */
    const updateFontSize = svgWidth => updateLabelFontSizeByClass(axisStrokeGroup, svgWidth, axisLength, ".axis-description");

    return [axisStrokeGroup, updateFontSize];
};
/**
 * create and position axis
 *
 * @param { coordinatesType }            coordinates
 * @param { string }                     axisDescription
 * @param { coordinatesDescriptionType } coordinatesDescription
 *
 * @return { SVGGElement }
 */
const createAxis = (coordinates, axisDescription, coordinatesDescription) => {
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");

    axis.setAttribute("x1", `${ coordinates.x1 }`);
    axis.setAttribute("y1", `${ coordinates.y1 }`);
    axis.setAttribute("x2", `${ coordinates.x2 }`);
    axis.setAttribute("y2", `${ coordinates.y2 }`);
    axis.classList.add("axis-stroke");
    const axisDescriptionElement = createAxisDescription(coordinatesDescription, axisDescription);


    axisGroup.appendChild(axis);
    axisGroup.appendChild(axisDescriptionElement);

    return axisGroup;
};

/**
 * create and position axis description text
 * @param { coordinatesDescriptionType } coordinatesDescription
 * @param { string } axisDescription
 * @returns {SVGTextElement}
 */
const createAxisDescription = (coordinatesDescription, axisDescription) => {
    const axisDescriptionElement = document.createElementNS("http://www.w3.org/2000/svg", "text");

    axisDescriptionElement.textContent = axisDescription;
    axisDescriptionElement.setAttribute("x", `${coordinatesDescription.x}`);
    axisDescriptionElement.setAttribute("y", `${coordinatesDescription.y}`);
    axisDescriptionElement.setAttribute("text-anchor", "middle");
    axisDescriptionElement.setAttribute("class", "axis-description");
    axisDescriptionElement.setAttribute("font-size", "2");

    if (coordinatesDescription.orientation === "vertical") {
        axisDescriptionElement.setAttribute("transform", `rotate(-90, ${coordinatesDescription.x}, ${coordinatesDescription.y})`);
    }

    return axisDescriptionElement;
};

/**
 * calculate the x-axis coordinates
 * @param { {x: number, y: number} } origin
 * @param { number }                 axisLength
 * @param { number }                 padding
 * @return { coordinatesType }
 */
const calculateXAxisCoordinates = (origin, axisLength, padding) => ({
        x1: origin.x,
        y1: origin.y,
        x2: axisLength - padding,
        y2: axisLength - padding
});

/**
 * calculate the y-axis coordinates
 * @param { {x: number, y: number} } origin
 * @param { number }                 padding
 * @return { coordinatesType }
 */
const calculateYAxisCoordinates = (origin, padding) => ({
        x1: origin.x,
        y1: origin.y,
        x2: padding,
        y2: padding
});

/**
 * calculate the x-axis description coordinates
 * @param { {x: number, y: number} } origin
 * @param { number }                 axisLength
 * @param { number }                 padding
 * @return { coordinatesDescriptionType }
 */
const calculateXAxisDescriptionCoordinates = (origin, axisLength, padding) => ({
    x: axisLength / 2,
    y: origin.y + 10,
    orientation: "horizontal",
});

/**
 * calculate the y-axis description coordinates
 * @param { {x: number, y: number} } origin
 * @param { number }                 axisLength
 * @param { number }                 padding
 * @return { coordinatesDescriptionType }
 */
const calculateYAxisDescriptionCoordinates = (origin, axisLength, padding) => ({
    x: axisLength * 0.02,
    y: axisLength / 2,
    orientation: "vertical",
});