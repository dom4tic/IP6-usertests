import { Observable }                     from "../../kolibri/observable.js";
import { FilterController }               from "./controller/filterController.js";
import {}                                 from "../util/arrayUtil.js";

// Test imports
import { TestSuite } from "../../kolibri/util/test.js";
import { MultiSelectionController } from "./controller/multiSelectionController.js";
import { Partition } from "./controller/chartController.js";

export { DimensionalChartController, clearSelections }

/**
 * @typedef { String[][] } SelectionContext
 */

/**
 * @typedef DimensionalChartModelType
 * @property { () => SelectionContext } getSelectionContext
 * @property { (SelectionContext) => void} setSelectionContext
 * @property { (cb: ValueChangeCallback<SelectionContext>) => void } onSelectionContextChanged
 */

/**
 * @param { SelectionContext } selection
 * @return { DimensionalChartModelType }
 * @constructor
 */
const DimensionalChartModel = selection => {
    const selectionContext = Observable(selection);

    return {
        getSelectionContext:       selectionContext.getValue,
        setSelectionContext:       selectionContext.setValue,
        onSelectionContextChanged: selectionContext.onChange
    }
};

/**
 * @typedef ChartComponents
 *
 * @property { ChartControllerType } chartController
 * @property { MultiSelectionControllerType } selectionController
 */

/**
 * Creates a controller for managing dimensional charts.
 *
 * @param { [] } data
 * @param { ChartComponents[] } charts
 * @constructor
 */
const DimensionalChartController = (data, charts) => {
    const selectionControllers = charts.map(chart => chart.selectionController);
    const chartControllers     = charts.map(chart => chart.chartController);

    const model = DimensionalChartModel(selectionControllers.map(getSelectedKeys));

    const filterController = FilterController(chartControllers.map(chartController => chartController.getGroupBy()));

    let lastSelectedChartIndex = -1;

    // Bind selection controllers with selectionContext
    for (let i = 0; i < selectionControllers.length; i++) {
        const selectionController = selectionControllers[i];
        selectionController.onSelectionChanged(() => {
            const evaluatedSelection = evaluateSelections(selectionControllers, i);
            // this is necessary since observable doesn't compare the values deeply
            if (!evaluatedSelection.deepEq(model.getSelectionContext())) {
                lastSelectedChartIndex = i;
                model.setSelectionContext(evaluatedSelection);
                clearSelections(selectionControllers, i + 1);
            }
        });
    }

    model.onSelectionContextChanged(context => filterController.updateFilters(context));

    // only update charts that are after the chart with the selection
    chartControllers.forEach((chartController, index) => {
        filterController.onFiltersChanged(() => {
            if (index > lastSelectedChartIndex) {
                const filteredData = filterController.filter(data, index);
                chartController.updateData(filteredData);
            }
        });
    });

    return {};
};

/**
 * Gets the keys from the partition of the current selection.
 * @param { MultiSelectionControllerType } selectionController
 * @return { String[] }
 */
const getSelectedKeys = selectionController => selectionController.getSelection().map(selection => selection.getKey());

/**
 * Evaluates the new selection context. All selections after the given index will be cleared.
 * @param { MultiSelectionControllerType[] } selectionControllers
 * @param { number } currentIndex
 * @return { SelectionContext }
 */
const evaluateSelections = (selectionControllers, currentIndex) => {
    const evaluated = [];
    for (let i = 0; i < selectionControllers.length; i++) {
        if (i > currentIndex) {
            evaluated.push([]); // resets the selection
        } else {
            evaluated.push(getSelectedKeys(selectionControllers[i]));
        }
    }
    return evaluated;
};

/**
 * Clears the selection starting from the given index. Selections before the index are kept.
 * @param { MultiSelectionControllerType[] } selectionControllers
 * @param { number } startIndex
 */
const clearSelections = (selectionControllers, startIndex) => {
    for (let i = startIndex; i < selectionControllers.length; i++) {
        selectionControllers[i].clearSelection();
    }
};

/***************************************************************************
 *                                                                         *
 * Tests                                                                   *
 *                                                                         *
 **************************************************************************/

const testSuite = TestSuite("dimensionalChartController");

testSuite.add("evaluateSelections", assert => {
    const s1 = MultiSelectionController();
    const s2 = MultiSelectionController();
    const s3 = MultiSelectionController();
    const selectionControllers = [s1, s2, s3];

    const p1 = Partition("key1", 1);
    const p2 = Partition("key2", 2);
    const p3 = Partition("key3", 3);
    const p4 = Partition("key4", 4);

    const assertSelection = (currentIndex, expected) => assert.isTrue(evaluateSelections(selectionControllers, currentIndex).deepEq(expected));

    assertSelection(0, [[], [], []]);

    s1.select(p1);
    assertSelection(0, [[p1.getKey()], [], []]);
    assertSelection(1, [[p1.getKey()], [], []]);
    assertSelection(2, [[p1.getKey()], [], []]);

    s2.select(p2);
    assertSelection(0, [[p1.getKey()], [], []]);
    assertSelection(1, [[p1.getKey()], [p2.getKey()], []]);
    assertSelection(2, [[p1.getKey()], [p2.getKey()], []]);

    s2.select(p3);
    assertSelection(0, [[p1.getKey()], [], []]);
    assertSelection(1, [[p1.getKey()], [p2.getKey(), p3.getKey()], []]);
    assertSelection(2, [[p1.getKey()], [p2.getKey(), p3.getKey()], []]);

    s3.select(p4);
    assertSelection(0, [[p1.getKey()], [], []]);
    assertSelection(1, [[p1.getKey()], [p2.getKey(), p3.getKey()], []]);
    assertSelection(2, [[p1.getKey()], [p2.getKey(), p3.getKey()], [p4.getKey()]]);

    s1.clearSelection();
    assertSelection(0, [[], [], []]);
    assertSelection(1, [[], [p2.getKey(), p3.getKey()], []]);
    assertSelection(2, [[], [p2.getKey(), p3.getKey()], [p4.getKey()]]);
});

testSuite.add("clearSelection", assert => {
    const s1 = MultiSelectionController();
    const s2 = MultiSelectionController();
    const s3 = MultiSelectionController();
    const selectionControllers = [s1, s2, s3];

    const p1 = Partition("key1", 1);
    const p2 = Partition("key2", 2);
    const p3 = Partition("key3", 3);

    clearSelections(selectionControllers, 0);
    assert.iterableEq(s1.getSelection(), []);
    assert.iterableEq(s2.getSelection(), []);
    assert.iterableEq(s3.getSelection(), []);

    s1.select(p1);
    s2.select(p2);
    s3.select(p3);
    assert.iterableEq(s1.getSelection(), [p1]);
    assert.iterableEq(s2.getSelection(), [p2]);
    assert.iterableEq(s3.getSelection(), [p3]);

    clearSelections(selectionControllers, 1);
    assert.iterableEq(s1.getSelection(), [p1]);
    assert.iterableEq(s2.getSelection(), []);
    assert.iterableEq(s3.getSelection(), []);

    clearSelections(selectionControllers, 0);
    assert.iterableEq(s1.getSelection(), []);
    assert.iterableEq(s2.getSelection(), []);
    assert.iterableEq(s3.getSelection(), []);
});

testSuite.add("getSelectedKeys", assert => {
    const s1 = MultiSelectionController();
    const p1 = Partition("key1", 1);
    const p2 = Partition("key2", 2);

    assert.iterableEq(getSelectedKeys(s1), []);

    s1.select(p1);
    assert.iterableEq(getSelectedKeys(s1), [p1.getKey()]);

    s1.select(p2);
    assert.iterableEq(getSelectedKeys(s1), [p1.getKey(), p2.getKey()]);
});

// TODO: add further tests for whole dimensional chart controller (logging tests)

// testSuite.run();

