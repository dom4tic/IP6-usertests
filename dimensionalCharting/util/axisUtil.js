export {
    createXAxisMajorTick,
    createXAxisMinorTick,
    createYAxisMajorTick,
    createYAxisMinorTick,
    createTick,
    formatNumber,
    createLabel,
    createValueLine,
    getNiceTicks,
    updateCategoricAxisLabelsVisibility,
    updateNumericAxisLabelsVisibility,
    updateLabelFontSizeByClass,
    groupPartitionKeysBy,
}

const ATTRIBUTE_PARTITION_KEYS = "data-partition-keys";

/**
 * Create a major tick for the axis
 * @param { number } x
 * @param { number } y
 * @param { string } [tickData = ""]
 * @param { string } [tickClass = "axis-tick"]
 *
 * @return { SVGLineElement }
 */
const createXAxisMajorTick = (x , y,  tickData= "", tickClass= "axis-tick") => createTick(x, y - 2, x, y + 2, tickData, tickClass);

/**
 * Create a minor tick for the axis
 * @param { number } x
 * @param { number } y
 * @param { string } [tickData = ""]
 * @param { string } [tickClass = "axis-tick"]
 *
 * @return { SVGLineElement }
 */
const createXAxisMinorTick = (x , y,  tickData= "", tickClass= "axis-tick") => createTick(x, y - 1, x, y + 1, tickData, tickClass);

/**
 * Create a major tick for the axis
 * @param { number } x
 * @param { number } y
 * @param { string } [tickData = ""]
 * @param { string } [tickClass = "axis-tick"]
 *
 * @return { SVGLineElement }
 */
const createYAxisMajorTick = (x, y,  tickData= "", tickClass= "axis-tick") => createTick(x - 2, y, x + 2, y, tickData, tickClass);


/**
 * Create a minor tick for the axis
 * @param { number } x
 * @param { number } y
 * @param { string } [tickData = ""]
 * @param { string } [tickClass = "axis-tick"]
 *
 * @return { SVGLineElement }
 */
const createYAxisMinorTick = (x, y,  tickData= "", tickClass= "axis-tick") => createTick(x - 1, y, x + 1, y, tickData, tickClass);


/**
 * Create a tick on the defined position
 * @param { number } x1
 * @param { number } y1
 * @param { number } x2
 * @param { number } y2
 * @param { string } tickData
 * @param { string } tickClass
 * @return { SVGLineElement }
 */
const createTick = (x1, y1, x2, y2, tickData, tickClass) => {
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");

    tick.setAttribute("x1", `${ x1 }`);
    tick.setAttribute("y1", `${ y1 }`);
    tick.setAttribute("x2", `${ x2 }`);
    tick.setAttribute("y2", `${ y2 }`);
    tick.setAttribute(ATTRIBUTE_PARTITION_KEYS, tickData);
    tick.classList.add(tickClass);

    return tick;
};

/**
 * Create a label for the axis
 * @param { number } x
 * @param { number } y
 * @param { string } text
 * @param { string } labelAnchor
 * @param { string } [labelClass = ""]
 *
 * @return { SVGTextElement }
 */
const createLabel = (x, y, text, labelAnchor, labelClass = "axis-label") => {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

    label.setAttribute("x", `${ x }`);
    label.setAttribute("y", `${ y }`);
    label.setAttribute("text-anchor", `${ labelAnchor }`);
    label.setAttribute("class", labelClass);
    label.setAttribute("font-size", "2");
    label.textContent = text;

    return label;
};

/**
 * Create a line on the defined position
 * @param { number } x1
 * @param { number } y1
 * @param { number } x2
 * @param { number } y2
 *
 * @returns { SVGLineElement }
 */
const createValueLine = (x1, y1, x2, y2) => {
    const valueLine = document.createElementNS("http://www.w3.org/2000/svg", "line");

    valueLine.setAttribute("x1", `${ x1 }`);
    valueLine.setAttribute("y1", `${ y1 }`);
    valueLine.setAttribute("x2", `${ x2 }`);
    valueLine.setAttribute("y2", `${ y2 }`);

    valueLine.classList.add("axis-value-line");

    return valueLine;
};

/**
 * Function to calculate "nice ticks"
 * Inspired by https://github.com/HanSolo/charts/blob/master/src/main/java/eu/hansolo/fx/charts/Axis.java#L1125
 * @param { number } minValue
 * @param { number } maxValue
 *
 * @returns { {majors: number[], minors: number[]} }
 */
const getNiceTicks = (minValue, maxValue) => {
    const maxMajorTicksAmount = 10;
    const maxMinorTicksAmount = 5;
    const niceRange = calcNiceNumber(maxValue - minValue, false);

    const majorTickSpace = calcNiceNumber(niceRange / (maxMajorTicksAmount - 1), true);
    const minorTickSpace = calcNiceNumber(majorTickSpace / (maxMinorTicksAmount - 1), true);

    const majorTicks = [];
    const minorTicks = [];
    const tolerance = 1e-10; // Small tolerance to handle floating-point errors

    const firstMajorTick = Math.ceil(minValue / majorTickSpace) * majorTickSpace;
    for (let tick = firstMajorTick; tick <= maxValue + tolerance; tick += majorTickSpace) {
        majorTicks.push(Math.round(tick * 1e10) / 1e10);
    }

    const firstMinorTick = Math.ceil(minValue / minorTickSpace) * minorTickSpace;
    for (let tick = firstMinorTick; tick <= maxValue + tolerance; tick += minorTickSpace) {
        const roundedTick = Math.round(tick * 1e10) / 1e10;
        if (!majorTicks.some(major => Math.abs(major - roundedTick) < tolerance)) {
            minorTicks.push(roundedTick);
        }
    }

    if (!majorTicks.some(tick => Math.abs(tick - minValue) < tolerance)) majorTicks.unshift(minValue);
    if (!majorTicks.some(tick => Math.abs(tick - maxValue) < tolerance)) majorTicks.push(maxValue);

    return {
        majors: majorTicks,
        minors: minorTicks
    };
};

/**
 * Calculates a "nice" rounded number based on a given range.
 * This is useful for creating human-friendly axis labels in charts.
 * Original: https://github.com/HanSolo/charts/blob/master/src/main/java/eu/hansolo/fx/charts/tools/Helper.java#L184
 * @param { number } number - The range or number to be adjusted.
 * @param { boolean } round - If true, rounds to the nearest "nice" number.
 *                            If false, chooses the next "nice" number that is >= the input.
 * @return { number } A nicely rounded number for better readability.
 */
const calcNiceNumber = (number, round) => {
    let niceFraction;
    const exponent = Math.floor(Math.log10(number));
    const fraction = number / Math.pow(10, exponent);

    if (round) {
        if (fraction < 1.5) {
            niceFraction = 1;
        } else if (fraction < 3) {
            niceFraction = 2;
        } else if (fraction < 7) {
            niceFraction = 5;
        } else {
            niceFraction = 10;
        }
    } else {
        if (fraction <= 1) {
            niceFraction = 1;
        } else if (fraction <= 2) {
            niceFraction = 2;
        } else if (fraction <= 5) {
            niceFraction = 5;
        } else {
            niceFraction = 10;
        }
    }

    return niceFraction * Math.pow(10, exponent);
};

/**
 * Formats a number into a more readable string with metric suffixes.
 *
 * - Numbers in the billions are suffixed with 'B' (e.g., 1,500,000,000 → "1.5B").
 * - Numbers in the millions are suffixed with 'M' (e.g., 2,300,000 → "2.3M").
 * - Numbers in the thousands are suffixed with 'k' (e.g., 12,000 → "12k").
 * - Numbers between -1 and 1 are formatted to one decimal place.
 * - All other numbers are rounded to the nearest integer and returned as a string.
 *
 * @param {number} num - The number to format.
 * @return {string} The formatted number with appropriate suffix or decimal precision.
 */
const formatNumber = num => {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (num >= 1_000_000) {
        return (num / 1_000_000)    .toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1_000) {
        return (num / 1_000)        .toFixed(1).replace(/\.0$/, '') + 'k';
    } else if (num !== 0 && num < 1 && num > -1) {
        return num.toFixed(1);
    }

    return Math.round(num).toString();
};

/**
 *
 * @param { SVGGElement }                  axisGroup
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 * @param { boolean }                      isHorizontal
 */
const updateCategoricAxisLabelsVisibility = (axisGroup, chartController, selectionController, hotspotController, isHorizontal) => {
    const ATTRIBUTE_PARTITION_KEY = "data-partition-key";
    const axisLabels = axisGroup.querySelectorAll(".axis-label, .partition-label");

    if (hotspotController.getHotspot() === undefined) {
        axisLabels.forEach(label => label.classList.remove("hotspot-label"));
    } else {
        const partition = hotspotController.getHotspot();
        const label = Array.from(axisLabels).find(label => label.getAttribute(ATTRIBUTE_PARTITION_KEY) === partition.getKey());
        
        if (label) {
            label.classList.remove("hidden-label");
            label.classList.add("hotspot-label");
        }
    }

    axisLabels.forEach(label => label.classList.remove("selected-label"));

    if (selectionController.getSelection().length === 0) {
        axisLabels.forEach(label => label.classList.remove("hidden-label"));
    } else if (hotspotController.getHotspot() === undefined) {
        axisLabels.forEach(label => label.classList.add("hidden-label"));
    }

    selectionController.getSelection().forEach(selection => {
        const label = Array.from(axisLabels).find(label => label.getAttribute(ATTRIBUTE_PARTITION_KEY) === selection.getKey());

        if (label) {
            label.classList.remove("hidden-label");
            label.classList.remove("hotspot-label");
            label.classList.add("selected-label");
        }
    });
};

/**
 *
 * @param { SVGGElement }                  axisGroup
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HotspotControllerType }        hotspotController
 * @param { boolean }                      isHorizontal
 */
const updateNumericAxisLabelsVisibility = (axisGroup, chartController, selectionController, hotspotController, isHorizontal) => {
    const axisLabels = axisGroup.querySelectorAll(".axis-label, .partition-label");
    const axisTicks = axisGroup.querySelectorAll(".partition-tick");
    const axisElements = Array.from(axisLabels).concat(Array.from(axisTicks));

    axisElements.forEach(element => element.classList.remove("hotspot-label"));
    axisElements.forEach(element => element.classList.remove("faded-label"));
    axisElements.forEach(element => element.classList.remove("selected-line"));
    axisElements.forEach(element => element.classList.remove("selected-label"));
    axisElements.forEach(element => element.classList.remove("selected-tick"));

    if (hotspotController.getHotspot() !== undefined) {
        handleNumericHotspot(hotspotController, chartController, isHorizontal, axisLabels, axisTicks);
    }

    if (selectionController.getSelection().length === 1) {
        handleNumericSingleSelection(selectionController, chartController, isHorizontal, axisLabels, axisTicks);
        const partition = selectionController.getSelection()[0];
        handleNumericNeighborVisibility(chartController, partition, axisLabels, isHorizontal);
    }

    if (selectionController.getSelection().length > 1) {
        handleNumericMultiSelection(selectionController, axisTicks);
    }
};

/**
 * Handle the hotspot of the numeric axis and add classes to the corresponding label and tick
 * @param { HotspotControllerType } hotspotController
 * @param { ChartControllerType } chartController
 * @param { boolean } isHorizontal
 * @param { NodeListOf<Element> } labels
 * @param { NodeListOf<Element> } ticks
 */
const handleNumericHotspot = (hotspotController, chartController, isHorizontal, labels, ticks) => {
    const partition = hotspotController.getHotspot();

    const label = Array.from(labels).find(label => {
        if (label.attributes && label.attributes[ATTRIBUTE_PARTITION_KEYS]) {
            return JSON.parse(label.attributes[ATTRIBUTE_PARTITION_KEYS].value).includes(partition.getKey());
        }
    });

    const tick = Array.from(ticks).find(tick => {
        if (tick.attributes && tick.attributes[ATTRIBUTE_PARTITION_KEYS]) {
            return JSON.parse(tick.attributes[ATTRIBUTE_PARTITION_KEYS].value).includes(partition.getKey());
        }
    });

    if (label) {
        label.classList.remove("hidden-label");
        label.classList.add("hotspot-label");
    }

    if (tick) {
        tick.classList.remove("hidden-label");
        tick.classList.add("hotspot-label");
    }

    handleNumericNeighborVisibility(chartController, partition, labels, isHorizontal);
};

/**
 * Handle the selection of a single numeric partition and add classes to the corresponding label and tick
 * @param { MultiSelectionControllerType } selectionController
 * @param { ChartControllerType }          chartController
 * @param { boolean }                      isHorizontal
 * @param { NodeListOf<Element> }          labels
 * @param { NodeListOf<Element> }          ticks
 */
const handleNumericSingleSelection = (selectionController, chartController, isHorizontal, labels, ticks) => {
    const selectedPartition = selectionController.getSelection()[0];

    const foundLabel = Array.from(labels).find(label => {
        if (label.attributes && label.attributes[ATTRIBUTE_PARTITION_KEYS]) {
            return JSON.parse(label.attributes[ATTRIBUTE_PARTITION_KEYS].value).includes(selectedPartition.getKey());
        }
    });

    const foundTick = Array.from(ticks).find(tick => {
        if (tick.attributes && tick.attributes[ATTRIBUTE_PARTITION_KEYS]) {
            return JSON.parse(tick.attributes[ATTRIBUTE_PARTITION_KEYS].value).includes(selectedPartition.getKey());
        }
    });

    if (foundTick) {
        foundTick.classList.add("selected-tick");
    }

    if (foundLabel) {
        foundLabel.classList.add("selected-label");
    }
};

/**
 * Handle the selection of multiple numeric partitions and add classes to the corresponding labels and ticks
 * @param { MultiSelectionControllerType } selectionController
 * @param { NodeListOf<Element> }          axisTicks
 */
const handleNumericMultiSelection = (selectionController, axisTicks) => {
    const selectedPartitions = selectionController.getSelection();
    const selectedPartitionsKeys = selectedPartitions.map(partition => partition.getKey());

    const foundTicks = Array.from(axisTicks).filter(tick => {
        if (tick.attributes && tick.attributes[ATTRIBUTE_PARTITION_KEYS]) {
            return selectedPartitionsKeys.some(key => JSON.parse(tick.attributes[ATTRIBUTE_PARTITION_KEYS].value).includes(key));
        }
    });

    if (foundTicks) {
        foundTicks.forEach(tick => tick.classList.add("selected-tick"));
    }
};

/**
 * Handle the visibility of the neighbors of the selected numeric partition
 * @param { ChartControllerType } chartController
 * @param { IPartition } partition
 * @param { NodeListOf<Element> } labels
 * @param { boolean } isHorizontal
 */
const handleNumericNeighborVisibility = (chartController, partition, labels, isHorizontal) => {
    const valueComparator = Number(extractValueWithAccessor(chartController, partition, isHorizontal));
    const axisLabels = Array.from(labels).filter(label => label.classList.contains("axis-label"));
    const axisLabelValues = axisLabels.map(label => Number(label.textContent));

    if (!axisLabelValues.includes(valueComparator)) {
        // add the hotspotComparatorValue to the axisLabelValues and sort them to get the neighbor Values
        axisLabelValues.push(valueComparator);
        const targetIndex = axisLabelValues.sort((a, b) => a - b).indexOf(valueComparator);

        // get the elements with targetIndex - 1 and targetIndex + 1 from axisLabelValues
        const nearestValues = [axisLabelValues[targetIndex - 1], axisLabelValues[targetIndex + 1]];
        const nearestLabels = axisLabels.filter(label => nearestValues.includes(Number(label.textContent)));

        if (nearestLabels) {
            nearestLabels.forEach(label => label.classList.add("faded-label"));
        }
    }
};


/**
 * Extract the value from the partition using the valueAccessor
 * @param { ChartControllerType } chartController
 * @param { IPartition } partition
 * @param { Boolean } isHorizontal
 * @returns { number | string }
 */
const extractValueWithAccessor = (chartController,  partition, isHorizontal) => {
    if (isHorizontal) {
        return chartController.getYAxisValueAccessor()(partition);
    } else {
        return chartController.getXAxisValueAccessor()(partition);
    }
};

/**
 * Update the font size of the labels with the corresponding class, that it is always the same size
 * @param { SVGElement } rootSvg
 * @param { number }     svgWidth
 * @param { number }     viewBoxWidth
 * @param { String }     className
 */
const updateLabelFontSizeByClass = (rootSvg, svgWidth, viewBoxWidth, className) => {
    const labels = rootSvg.querySelectorAll(`${ className }`);

    const scaleFactor = svgWidth / viewBoxWidth;

    const baseFontSize = 10;
    const newFontSize = baseFontSize / scaleFactor * 1.2;

    labels.forEach(label => {
        label.style.fontSize = `${ newFontSize }px`;
    });
};

/**
 * Groups partition by the given groupByFn and collects the keys for each group.
 * @param { IPartition[] } data
 * @param { (IPartition) => string} groupByFn
 */
const groupPartitionKeysBy = (data, groupByFn) =>
    data.reduce((acc, item) => {
        const key = groupByFn(item);
        (acc[key] ||= []).push(item.getKey());
        return acc;
    }, {});
