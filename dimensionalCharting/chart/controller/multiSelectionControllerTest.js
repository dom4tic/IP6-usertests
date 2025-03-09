import { TestSuite } from "../../../kolibri/util/test.js";
import { MultiSelectionController } from "./multiSelectionController.js";
import { Partition } from "./chartController.js";

const testSuite = TestSuite("selectionController");

testSuite.add("select", assert => {
   const controller = MultiSelectionController();

   // initial state
    assert.iterableEq(controller.getSelection(), []);

    // select
   const partition = Partition("switzerland", 10);
   controller.select(partition);
   assert.iterableEq(controller.getSelection(), [partition]);
});

testSuite.add("unselect", assert => {
    const controller = MultiSelectionController();
    const partition = Partition("switzerland", 10);

    // initial state
    controller.select(partition);
    assert.iterableEq(controller.getSelection(), [partition]);

    // unselect
    controller.unselect(partition);
    assert.iterableEq(controller.getSelection(), []);
});

testSuite.add("re-select", assert => {
    const controller = MultiSelectionController();
    const partition = Partition("switzerland", 10);

    // initial state
    controller.select(partition);
    assert.is(controller.getSelection().length, 1);
    assert.iterableEq(controller.getSelection(), [partition]);

    // re-select
    controller.select(partition);
    assert.is(controller.getSelection().length, 1);
    assert.iterableEq(controller.getSelection(), [partition]);
});

testSuite.add("unselect non existing", assert => {
    const controller = MultiSelectionController();
    const partition = Partition("switzerland", 10);

    // initial state
    assert.iterableEq(controller.getSelection(), []);

    // unselect
    controller.unselect(partition);
    assert.iterableEq(controller.getSelection(), []);
});

testSuite.add("isSelected", assert => {
    const controller = MultiSelectionController();
    const switzerland = Partition("switzerland", 10);
    const germany = Partition("germany", 40);

    // initial state
    controller.select(switzerland);
    assert.iterableEq(controller.getSelection(), [switzerland]);

    // isSelected
    assert.isTrue(controller.isSelected(switzerland));
    assert.is(controller.isSelected(germany), false);
});

testSuite.add("multiSelect", assert => {
    const controller = MultiSelectionController();
    const switzerland = Partition("switzerland", 10);
    const germany = Partition("germany", 40);

    // initial state
    controller.select(switzerland);
    controller.select(germany);
    assert.iterableEq(controller.getSelection(), [switzerland, germany]);

    // isSelected
    assert.isTrue(controller.isSelected(switzerland));
    assert.isTrue(controller.isSelected(germany));
});

testSuite.run();
