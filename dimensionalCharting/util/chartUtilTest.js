import { TestSuite } from "../../kolibri/util/test.js";
import { ChartController } from "../chart/controller/chartController.js";
import {
    addLineEventListeners,
    addRubberbandEventListeners,
    calculateTooltipPosition,
    changeHotspotHover, createSVG,
    createSvgShadowFilter, hideTooltip, identity,
    isNumericAndFinite, reduceCount, reduceSum, removeChildrenFromSVG,
    showTooltipAt
} from "./chartUtil.js";

const utilSuite = TestSuite("util/chartUtil");

// utilSuite.add("chain", assert => {
//     const chart1 = ChartController(_ => undefined);
//     const chart2 = ChartController(_ => undefined);
//     const chart3 = ChartController(_ => undefined);
//
//     chain(chart1, chart2, chart3);
//
//     assert.is(chart1.getNext(), chart2);
//     assert.is(chart2.getNext(), chart3);
// });

utilSuite.add("isNumericAndFinite", assert => {
    assert.is(isNumericAndFinite(1), true);
    assert.is(isNumericAndFinite(1.1), true);

    assert.is(isNumericAndFinite("1"), true);
    assert.is(isNumericAndFinite("1.1"), true);
    assert.is(isNumericAndFinite("a"), false);
    assert.is(isNumericAndFinite("1a"), false);
    assert.is(isNumericAndFinite("a1"), false);
    assert.is(isNumericAndFinite("a1a"), false);

    assert.is(isNumericAndFinite(null), false);
    assert.is(isNumericAndFinite(undefined), false);
    assert.is(isNumericAndFinite(NaN), false);
    assert.is(isNumericAndFinite(1 / 0), false);
    assert.is(isNumericAndFinite(1 / 3), true);
    assert.is(isNumericAndFinite(Infinity), false);
    assert.is(isNumericAndFinite(-Infinity), false);
    assert.is(isNumericAndFinite(Number.PI), false);
    assert.is(isNumericAndFinite(Number.E), false);
});

utilSuite.add("reduceCount", assert => {
    assert.is(reduceCount(NaN, {}), 1);
    assert.is(reduceCount(0, {}), 1);
    assert.is(reduceCount(1, {}), 2);
});

utilSuite.add("reduceSum", assert => {
    const arr = [{ value: 10 }, { value: 20 }, { value: 30 }];
    const sum = arr.reduce(reduceSum(item => item.value), 0);
    assert.is(sum, 60);
});

utilSuite.add("identity", assert => {
    assert.is(identity("first", "second"), "second");
});

utilSuite.add("hideTooltip", assert => {
    const tooltip = document.createElement("div");
    tooltip.id = "popup";
    tooltip.style.opacity = "1";
    document.body.appendChild(tooltip);
    hideTooltip();
    assert.is(tooltip.style.opacity, "0");
    tooltip.remove();
});

utilSuite.add("removeChildrenFromSVG", assert => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const child = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    child.classList.add("remove-me");
    svg.appendChild(child);
    removeChildrenFromSVG(svg, "remove-me");
    assert.is(svg.querySelectorAll(".remove-me").length, 0);
});

utilSuite.add("addRubberbandEventListeners", assert => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "test-svg");

    const point1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point1.classList.add("point-class");
    point1.setAttribute("cx", "10");
    point1.setAttribute("cy", "10");
    svg.appendChild(point1);

    const point2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point2.classList.add("point-class");
    point2.setAttribute("cx", "50");
    point2.setAttribute("cy", "50");
    svg.appendChild(point2);

    document.body.appendChild(svg);

    const partitions = [{ getKey: () => "p1" }, { getKey: () => "p2" }];

    const chartController = {
        getPartitions: () => partitions
    };
    let selectedPartitions = [];
    const selectionController = {
        clearSelection: () => { selectedPartitions = []; },
        select: partition => selectedPartitions.push(partition),
        getSelection: () => selectedPartitions
    };

    addRubberbandEventListeners("test-svg", "point-class", chartController, selectionController);

    const mousedownEvent = new MouseEvent("mousedown", { clientX: 100, clientY: 100, bubbles: true });
    svg.dispatchEvent(mousedownEvent);

    const rubberband = svg.querySelector(".rubberband");
    assert.is(!!rubberband, true);

    const mouseupEvent = new MouseEvent("mouseup", { bubbles: true });
    svg.dispatchEvent(mouseupEvent);
    svg.remove();
});

utilSuite.add("createSVG", assert => {
    const svg = createSVG("my-svg", { x: 0, y: 0, width: 100, height: 50 });
    assert.is(svg.getAttribute("id"), "my-svg");
    assert.is(svg.getAttribute("viewBox"), "0 0 100 50");
});

utilSuite.add("addLineEventListeners", assert => {
    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("data-key", "p1");
    const partition = { getKey: () => "p1" };

    let isSelected = false;
    const selectionController = {
        isSelected: _ => isSelected,
        select: _ => { isSelected = true; },
        unselect: _ => { isSelected = false; }
    };
    let hotspot = undefined;
    const hotspotController = {
        getHotspot: () => hotspot,
        setHotspot: p => { hotspot = p; }
    };
    const chartController = {
        find: key => partition
    };

    addLineEventListeners(point, chartController, selectionController, hotspotController, "data-key");

    point.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    assert.is(isSelected, true);
    point.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    assert.is(isSelected, false);

    point.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    assert.is(hotspot, partition);

    point.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    assert.is(hotspot, undefined);
});

utilSuite.add("changeHotspotHover", assert => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.classList.add("test-point");
    point.setAttribute("data-key", "p1");
    svg.appendChild(point);

    const partition = { getKey: () => "p1" };
    const partitionWithValue = {
        getKey: () => "p1",
        getValue: () => 1000
    };
    const chartController = {
        getPartitions: () => [partitionWithValue]
    };

    const tooltip = document.createElement("div");
    tooltip.id = "popup";
    document.body.appendChild(tooltip);

    changeHotspotHover(svg, "test-point", partition, chartController, "data-key");

    assert.is(point.classList.contains("test-point-hover"), true);
    assert.is(tooltip.textContent.includes("p1: 1k"), true);

    tooltip.remove();
});

utilSuite.add("showTooltipAt", assert => {
    const tooltip = document.createElement("div");
    tooltip.id = "popup";
    tooltip.style.opacity = "0";
    document.body.appendChild(tooltip);

    tooltip.getBoundingClientRect = () => ({ width: 100, height: 50, left: 0, top: 0 });
    showTooltipAt({ x: 200, y: 150 }, "Tooltip Test");

    assert.is(tooltip.style.opacity, "1");
    assert.is(tooltip.style.left, "150px");
    assert.is(tooltip.style.top, "125px");
    tooltip.remove();
});

utilSuite.add("createSvgShadowFilter", assert => {
    const filter = createSvgShadowFilter("shadow1");
    assert.is(filter.tagName.toLowerCase(), "filter");
    assert.is(filter.getAttribute("id"), "shadow1");
    const shadows = filter.querySelectorAll("feDropShadow");
    assert.is(shadows.length, 3);
});

utilSuite.add("calculateTooltipPosition", assert => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", "path");
    element.getBoundingClientRect = () => ({ left: 100, top: 200, width: 50, height: 30 });
    const pos = calculateTooltipPosition(element);
    assert.is(pos.x, 125);
    assert.is(pos.y, 175);
});


utilSuite.run();
