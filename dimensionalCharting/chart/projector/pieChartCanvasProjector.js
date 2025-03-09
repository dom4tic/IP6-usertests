import { dom } from "../../../kolibri/util/dom.js"
import { lightenHexColor } from "../../util/color.js"
import { showTooltipAt } from "../../util/chartUtil.js";

export { PieChartCanvasProjector }

/**
 * @typedef { ChartProjectorDataType & { height: number, width: number } } CanvasChartProjectorDataType
 */

/**
 * Constructor for a {@link ChartProjectorType Chart}.
 * @param { CanvasChartProjectorDataType } parameterObject
 * @return { ChartProjectorType }
 * @constructor
 */
const PieChartCanvasProjector = ({
     chartController,
     selectionController,
     hotspotController,
     height,
     width
}) => {
    const [canvas] = dom(`
        <canvas class="chart" width="${ width }" height="${ height }"></canvas>
    `);

    const padding = width * 0.1;
    const render = () => draw(chartController, selectionController, hotspotController, padding, canvas);

    chartController.onPartitionsChanged(_ => render());
    selectionController.onSelectionChanged (_ => render());
    hotspotController.onHotspotChanged (_ => render());

    canvas.addEventListener('mousemove', /** @param { MouseEvent } event */ event => {
        const { mouseX, mouseY } = getMousePosition(event, canvas);

        /** @type { PointType } */
        const point = { x: mouseX, y: mouseY };

        // check if the mouse is outside the circle
        const hoverPartition = hotspotController.getHotspot();
        const currPartition = getPartition(mouseX, mouseY, padding, canvas, chartController.getPartitions());

        // only redraw the chart if the hover index has changed
        if (currPartition !== hoverPartition) {
            hotspotController.setHotspot(currPartition);

            // if hovering show the cursor as pointer
            if (currPartition) {
                canvas.style.cursor = "pointer";
                showTooltipAt(point, `${ currPartition.getKey() }: ${ currPartition.getValue() }`);
            } else {
                canvas.style.cursor = "default";
            }
        }
    });

    canvas.addEventListener('click', event => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);

        const partition = getPartition(mouseX, mouseY, padding, canvas, chartController.getPartitions());

        if (partition === undefined) return;

        if (selectionController.isSelected(partition)) {
            // same slice, undo selection filter
            selectionController.unselect(partition);
        } else {
            selectionController.select(partition);
        }
    });

    render();
    return canvas;
};

const draw = (chartController, selectionController, hotspotController, padding, canvas) => {
    const colors = ["#6000ff", "#8c49fe", "#ad75fc", "#c79ef9", "#ddc7f5", "#f1f1f1", "#f5cdd2", "#f4a8b4", "#f18297", "#ea577b", "#e11161"];

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const partitions = chartController.getPartitions();
    const selection = selectionController.getSelection();
    const hoverPartition = hotspotController.getHotspot();

    const total = partitions.reduce((acc, cat) => acc + cat.getValue(), 0);

    let centerX, centerY, radius;
    let startAngle = 0;

    partitions.forEach((partition, index) => {
        const isHovered = hoverPartition === partition;
        const isSelected = selectionController.isSelected(partition);
        const someSliceIsSelectedButNotThis = selection.length > 0 && isSelected === false;

        centerX = getCenterX(padding, canvas);
        centerY = getCenterY(padding, canvas);
        radius  = getRadius(canvas, padding);

        const sliceRadius = isSelected ? radius + 15 : radius;
        const sliceAngle = calculateSliceAngle(partition.getValue(), total);

        // canvas drawing
        ctx.beginPath();
        ctx.moveTo(centerX, centerY); // sets the starting point to the center of the canvas
        ctx.arc(
            centerX,
            centerY,
            sliceRadius,
            startAngle,
            startAngle + sliceAngle
        );
        ctx.closePath();

        // fill the slice with a color, if a slice is hovered/selected lighten all other slices
        const color = colors[index % colors.length];
        ctx.fillStyle = someSliceIsSelectedButNotThis || isHovered ? lightenHexColor(color, 40) : color;
        ctx.fill();

        // set the start angle for the next slice
        startAngle += sliceAngle;
    });
};

/**
 * Get the x-coordinate of the center of the circle
 * @param { HTMLCanvasElement } canvas
 * @param { number }            padding
 *
 * @returns { number }
 */
const getCenterX = (padding, canvas) => padding + (canvas.width - 2 * padding) / 2;

/**
 * Get the y-coordinate of the center of the circle
 * @param { HTMLCanvasElement } canvas
 * @param { number }            padding
 *
 * @returns { number }
 */
const getCenterY = (padding, canvas) => padding + (canvas.height - 2 * padding) / 2;

/**
 * Get the radius of the circle
 * @param { HTMLCanvasElement } canvas
 * @param { number }            padding
 *
 * @returns { number }
 */
const getRadius = (canvas, padding) => Math.min((canvas.width - 2 * padding) / 2, (canvas.height - 2 * padding) / 2);

/**
 * Calculate the angle of a slice
 * @param { number } sliceData
 * @param { number } total
 *
 * @return { number }
 */
const calculateSliceAngle = (sliceData, total) => (sliceData / total) * 2 * Math.PI;

/**
 * Get the mouse position relative to the canvas
 * @param { MouseEvent }        event
 * @param { HTMLCanvasElement } canvas
 *
 * @return { { mouseX: number, mouseY: number } }
 */
function getMousePosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    return {mouseX, mouseY};
}

/**
 * Get the partition that the mouse is currently hovering over
 * @param { number }       mouseX
 * @param { number }       mouseY
 * @param { number }       padding
 * @param { HTMLCanvasElement }       canvas
 * @param { IPartition[] } partitions
 *
 * @return { undefined | IPartition }
 */
function getPartition(mouseX, mouseY, padding, canvas, partitions) {
    const dx = mouseX - getCenterX(padding, canvas);
    const dy = mouseY - getCenterY(padding, canvas);
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

    // check if the mouse is outside the circle
    if (distanceFromCenter > getRadius(canvas, padding)) return undefined      ;

    // calculate the angle of the mouse pointer relative to the center of the circle
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;

    // check which slice the mouse is hovering over
    let startAngle = 0;
    const total = getTotal(partitions);

    for (let index = 0; index < partitions.length; index++) {
        const partition = partitions[index];
        const sliceAmount = partition.getValue();
        const sliceAngle = calculateSliceAngle(sliceAmount, total);
        const endAngle = startAngle + sliceAngle;

        if (angle >= startAngle && angle < endAngle) {
            return partition;
        }

        startAngle = endAngle;
    }

    return undefined;
}

const getTotal = data => data.reduce((acc, cat) => acc + cat.getValue(), 0);
