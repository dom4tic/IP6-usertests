import { dom }                   from "../../../../Kolibri/util/dom.js";
import { removeChildrenFromSVG } from "../../../util/chartUtil.js";

export { DottedLineProjector };

let counter = 0;

/**
 *
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 * @param { number }                       viewboxLength
 *
 * @return { SVGGElement[] }
 */
const DottedLineProjector = (chartController, coordinatesController, selectionController, hotspotController, viewboxLength) => {
    const padding    = viewboxLength * .1;
    const axisLength = viewboxLength * .8;
    const styleId = counter++;

    const [css] = dom(`
        <style>
            .dotted-line-group-${ styleId } {
                .dotted-line {
                    vector-effect:    non-scaling-stroke;
                    stroke:           var(--grey90);
                    stroke-dasharray: 5, 5;
                    stroke-width:     .8;
                    opacity:          0;
                }
                
                .dotted-line.hotspot-line, .dotted-line.selected-line {
                    opacity:      1;
                }
            }
        </style>
    `);

    const dottedLineClass = `dotted-line-group-${ styleId }`;
    const dottedLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    dottedLineGroup.classList.add(dottedLineClass);
    dottedLineGroup.appendChild(css);

    const render = () => {
        removeChildrenFromSVG(dottedLineGroup, "dotted-line-group");
        dottedLineGroup.appendChild(createDottedLines(chartController, coordinatesController, selectionController, hotspotController, axisLength));
        dottedLineGroup.setAttribute("transform", `translate(${ padding }, ${ padding })`);
    };

    chartController.onPartitionsChanged(  _ => render());
    coordinatesController.onXRangeChanged(_ => render());
    coordinatesController.onYRangeChanged(_ => render());
    hotspotController.onHotspotChanged(    _ => updateDottedLineVisibility(dottedLineGroup, selectionController, hotspotController));
    selectionController.onSelectionChanged(_ => updateDottedLineVisibility(dottedLineGroup, selectionController, hotspotController));

    return [dottedLineGroup];
};

/**
 *
 * @param { ChartControllerType }          chartController
 * @param { CoordinatesControllerType }    coordinatesController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 * @param { number }                       axisLength
 *
 * @return { SVGGElement }
 */
const createDottedLines = (chartController, coordinatesController, selectionController, hotspotController, axisLength) => {
    const dottedLineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dottedLineGroup.classList.add("dotted-line-group");

    const partitions = chartController.getPartitions();

    const xPositions = coordinatesController.getXAxisPositionValues(partitions, axisLength);
    const yPositions = coordinatesController.getYAxisPositionValues(partitions, axisLength);

    partitions.forEach(partition => {
        const x = xPositions[partition.getKey()];
        const y = axisLength - yPositions[partition.getKey()];

        const x1 = 0;
        const y1 = y;
        const x2 = x;
        const y2 = y;

        dottedLineGroup.appendChild(createDottedLine(x1, y1, x2, y2, partition.getKey()));
        dottedLineGroup.appendChild(createDottedLine(x2, y2, x2, axisLength, partition.getKey()));
    });

    return dottedLineGroup;
};

/**
 * Create a line on the defined position
 * @param { number } x1
 * @param { number } y1
 * @param { number } x2
 * @param { number } y2
 * @param { string } partitionKey
 *
 * @return { SVGLineElement }
 */
const createDottedLine = (x1, y1, x2, y2, partitionKey) => {
    const dottedLine = document.createElementNS("http://www.w3.org/2000/svg", "line");

    dottedLine.setAttribute("x1", `${ x1 }`);
    dottedLine.setAttribute("y1", `${ y1 }`);
    dottedLine.setAttribute("x2", `${ x2 }`);
    dottedLine.setAttribute("y2", `${ y2 }`);
    dottedLine.setAttribute("PARTITION_KEY", partitionKey);

    dottedLine.classList.add("dotted-line");

    return dottedLine;
};

const updateDottedLineVisibility = (dottedLineGroup, selectionController, hotspotController) => {
    const lines = dottedLineGroup.querySelectorAll(".dotted-line");

    if (hotspotController.getHotspot() === undefined) {
        lines.forEach(line => line.classList.remove("hotspot-line"));
    } else {
        const partitionKey = hotspotController.getHotspot().getKey();
        const foundLines = Array.from(lines).filter(line =>
            line.attributes &&
            line.attributes["PARTITION_KEY"] &&
            line.attributes["PARTITION_KEY"].value === String(partitionKey)
        );

        if (foundLines) {
            foundLines.forEach(line => line.classList.add("hotspot-line"));
        }
    }

    lines.forEach(line => line.classList.remove("selected-line"));

    if (selectionController.getSelection().length === 1) {
        const selectedPartitionKey = selectionController.getSelection()[0].getKey();

        const foundLines = Array.from(lines).filter(line =>
            line.attributes &&
            line.attributes["PARTITION_KEY"] &&
            line.attributes["PARTITION_KEY"].value === String(selectedPartitionKey)
        );

        if (foundLines) {
            foundLines.forEach(line => line.classList.add("selected-line"));
        }
    }
};
