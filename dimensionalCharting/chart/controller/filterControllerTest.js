import { TestSuite } from "../../../kolibri/util/test.js";
import { FilterController } from "./filterController.js";

const testSuite = TestSuite("filterController");

const emptyFilter = _ => true;

const planets = [
    {name: "Earth",    size: 12_742, galaxy: "Milky Way"},
    {name: "Neptune",  size: 49_244, galaxy: "Milky Way"},
    {name: "Tatooine", size: 10_465, galaxy: "Outer Rim"},
];

testSuite.add("initialFilters", assert => {
    assert.is(FilterController([]).getFilters().length, 0);

    const oneFilter = FilterController([planet => planet.galaxy]).getFilters();
    assert.is(oneFilter.length, 1);
    assert.is(oneFilter[0].getPredicate()(), emptyFilter());

    const twoFilters = FilterController([planet => planet.galaxy, planet => planet.size]).getFilters();
    assert.is(twoFilters.length, 2);
    assert.is(twoFilters[0].getPredicate()(), emptyFilter());
    assert.is(twoFilters[1].getPredicate()(), emptyFilter());

});

testSuite.add("filter", assert => {
    const controller = FilterController([planet => planet.galaxy, planet => planet.size, planet => planet.name]);

    assert.iterableEq(controller.filter(planets, 0), planets);
    assert.iterableEq(controller.filter(planets, 1), planets);
    assert.iterableEq(controller.filter(planets, 2), planets);
    assert.throws(() => controller.filter(planets, 3), "Index must not be equal or greater than number of filters!");

    controller.updateFilters([["Milky Way"], [], []]);
    assert.iterableEq(controller.filter(planets, 0), planets);
    assert.iterableEq(controller.filter(planets, 1), [planets[0], planets[1]]);
    assert.iterableEq(controller.filter(planets, 2), [planets[0], planets[1]]);

    controller.updateFilters([["Milky Way"], ["12742"], []]);
    assert.iterableEq(controller.filter(planets, 0), planets);
    assert.iterableEq(controller.filter(planets, 1), [planets[0], planets[1]]);
    assert.iterableEq(controller.filter(planets, 2), [planets[0]]);

    controller.updateFilters([[], ["non-existing"], []]);
    assert.iterableEq(controller.filter(planets, 0), planets);
    assert.iterableEq(controller.filter(planets, 1), planets);
    assert.iterableEq(controller.filter(planets, 2), []);
});

testSuite.run();
