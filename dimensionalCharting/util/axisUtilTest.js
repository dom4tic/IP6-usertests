import { TestSuite } from "../../kolibri/util/test.js";
import {
    createLabel,
    createTick,
    createValueLine,
    createXAxisMajorTick,
    createXAxisMinorTick,
    createYAxisMajorTick,
    createYAxisMinorTick,
    formatNumber,
    getNiceTicks,
    updateCategoricAxisLabelsVisibility,
    updateLabelFontSizeByClass,
    updateNumericAxisLabelsVisibility
} from "./axisUtil.js";

const axisUtilSuite = TestSuite("util/axisUtil");

axisUtilSuite.add("createXAxisMajorTick", assert => {
    const tick = createXAxisMajorTick(10, 20, "['data']", "test-tick");

    assert.is(tick.getAttribute("x1"), "10");
    assert.is(tick.getAttribute("y1"), "18"); // 20 - 2
    assert.is(tick.getAttribute("x2"), "10");
    assert.is(tick.getAttribute("y2"), "22"); // 20 + 2
    assert.is(tick.getAttribute("data-partition-keys"), "['data']");
    assert.is(tick.classList.contains("test-tick"), true);
});

axisUtilSuite.add("createXAxisMinorTick", assert => {
    const tick = createXAxisMinorTick(30, 40, "['minor']", "minor-tick");

    assert.is(tick.getAttribute("x1"), "30");
    assert.is(tick.getAttribute("y1"), "39"); // 40 - 1
    assert.is(tick.getAttribute("x2"), "30");
    assert.is(tick.getAttribute("y2"), "41"); // 40 + 1
    assert.is(tick.getAttribute("data-partition-keys"), "['minor']");
    assert.is(tick.classList.contains("minor-tick"), true);
});

axisUtilSuite.add("createYAxisMajorTick", assert => {
    const tick = createYAxisMajorTick(50, 60, "['y-major']", "major-tick");

    assert.is(tick.getAttribute("x1"), "48"); // 50 - 2
    assert.is(tick.getAttribute("y1"), "60");
    assert.is(tick.getAttribute("x2"), "52"); // 50 + 2
    assert.is(tick.getAttribute("y2"), "60");
    assert.is(tick.getAttribute("data-partition-keys"), "['y-major']");
    assert.is(tick.classList.contains("major-tick"), true);
});

axisUtilSuite.add("createYAxisMinorTick", assert => {
    const tick = createYAxisMinorTick(70, 80, "['y-minor']", "minor-tick");

    assert.is(tick.getAttribute("x1"), "69"); // 70 - 1
    assert.is(tick.getAttribute("y1"), "80");
    assert.is(tick.getAttribute("x2"), "71"); // 70 + 1
    assert.is(tick.getAttribute("y2"), "80");
    assert.is(tick.getAttribute("data-partition-keys"), "['y-minor']");
    assert.is(tick.classList.contains("minor-tick"), true);
});

axisUtilSuite.add("createTick", assert => {
    const tick = createTick(5, 6, 7, 8, "['tick']", "custom-tick");

    assert.is(tick.getAttribute("x1"), "5");
    assert.is(tick.getAttribute("y1"), "6");
    assert.is(tick.getAttribute("x2"), "7");
    assert.is(tick.getAttribute("y2"), "8");
    assert.is(tick.getAttribute("data-partition-keys"), "['tick']");
    assert.is(tick.classList.contains("custom-tick"), true);
});

axisUtilSuite.add("createLabel", assert => {
    const label = createLabel(100, 200, "Label", "middle", "custom-label");

    assert.is(label.getAttribute("x"), "100");
    assert.is(label.getAttribute("y"), "200");
    assert.is(label.getAttribute("text-anchor"), "middle");
    assert.is(label.getAttribute("class"), "custom-label");
    assert.is(label.getAttribute("font-size"), "2");
    assert.is(label.textContent, "Label");
});

axisUtilSuite.add("createValueLine", assert => {
    const line = createValueLine(10, 20, 30, 40);

    assert.is(line.getAttribute("x1"), "10");
    assert.is(line.getAttribute("y1"), "20");
    assert.is(line.getAttribute("x2"), "30");
    assert.is(line.getAttribute("y2"), "40");
    assert.is(line.classList.contains("axis-value-line"), true);
});

axisUtilSuite.add("formatNumber", assert => {
    assert.is(formatNumber(1500000000), "1.5B");
    assert.is(formatNumber(2300000), "2.3M");
    assert.is(formatNumber(12000), "12k");
    assert.is(formatNumber(0.5), "0.5");
    assert.is(formatNumber(0), "0");
    assert.is(formatNumber(42), "42");
});

axisUtilSuite.add("getNiceTicks", assert => {
    const { majors, minors } = getNiceTicks(0, 10);

    assert.is(majors[0], 0);
    assert.is(majors[majors.length - 1], 10);

    minors.forEach(minor => {
        const isMajor = majors.some(major => Math.abs(major - minor) < 1e-10);
        assert.is(isMajor, false);
    });
});

axisUtilSuite.add("updateCategoricAxisLabelsVisibility", assert => {
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

    label.classList.add("axis-label");
    label.setAttribute("data-partition-key", "test");
    axisGroup.appendChild(label);

    const chartController = {
        getXAxisValueAccessor: () => () => "test",
        getYAxisValueAccessor: () => () => "test"
    };
    const selectionController = {
        getSelection: () => [] // keine Selektion
    };
    const hotspotController = {
        getHotspot: () => undefined
    };

    label.classList.add("hidden-label", "hotspot-label");

    updateCategoricAxisLabelsVisibility(axisGroup, chartController, selectionController, hotspotController, true);

    assert.is(label.classList.contains("hotspot-label"), false);
    assert.is(label.classList.contains("hidden-label"), false);
});


axisUtilSuite.add("updateNumericAxisLabelsVisibility", assert => {
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

    label.classList.add("axis-label");
    label.textContent = "50";
    axisGroup.appendChild(label);

    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");

    tick.classList.add("partition-tick");
    tick.setAttribute("data-partition-keys", "['50']");
    axisGroup.appendChild(tick);

    const chartController = {
        getXAxisValueAccessor: () => () => "50",
        getYAxisValueAccessor: () => () => "50"
    };

    const selectionController = {
        getSelection: () => []
    };

    const hotspotController = {
        getHotspot: () => undefined
    };

    label.classList.add("hotspot-label", "faded-label");
    tick.classList.add("selected-line");

    updateNumericAxisLabelsVisibility(axisGroup, chartController, selectionController, hotspotController, true);

    assert.is(label.classList.contains("hotspot-label"), false);
    assert.is(label.classList.contains("faded-label"), false);
    assert.is(tick.classList.contains("selected-line"), false);
});

axisUtilSuite.add("updateNumericAxisLabelsVisibility: selection then deselection", assert => {
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const partition = {
        getKey: () => "p50"
    };

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.classList.add("axis-label");
    label.setAttribute("data-partition-keys", JSON.stringify([partition.getKey()]));
    axisGroup.appendChild(label);


    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.classList.add("partition-tick");
    tick.setAttribute("data-partition-keys", JSON.stringify([partition.getKey()]));
    axisGroup.appendChild(tick);

    const chartController = {
        getXAxisValueAccessor: () => () => "50",
        getYAxisValueAccessor: () => () => "50"
    };

    let selection = [partition];
    const selectionController = {
        getSelection: () => selection
    };

    const hotspotController = {
        getHotspot: () => undefined
    };

    updateNumericAxisLabelsVisibility(axisGroup, chartController, selectionController, hotspotController, true);

    assert.is(label.classList.contains("selected-label"), true);
    assert.is(tick.classList.contains("selected-tick"), true);

    selection = [];
    updateNumericAxisLabelsVisibility(axisGroup, chartController, selectionController, hotspotController, true);

    assert.is(label.classList.contains("selected-label"), false);
    assert.is(tick.classList.contains("selected-tick"), false);
});



axisUtilSuite.add("updateLabelFontSizeByClass", assert => {
    const rootSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.classList.add("test-class");
    rootSvg.appendChild(label);

    // Beispiel: svgWidth = 200, viewBoxWidth = 100 führt zu scaleFactor = 2,
    // newFontSize = 10/2 * 1.2 = 6
    updateLabelFontSizeByClass(rootSvg, 200, 100, ".test-class");
    assert.is(label.style.fontSize, "6px");
});

axisUtilSuite.run();
