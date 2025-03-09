import { TestSuite } from "../../kolibri/util/test.js";
import { arrayDeepEq } from "./arrayUtil.js";

const arrayUtilSuite = TestSuite("util/arrayUtil");

arrayUtilSuite.add("deepEq", assert => {
    assert.is( arrayDeepEq([])([]),      true);
    assert.is( arrayDeepEq([1])([1]),    true);
    assert.is( arrayDeepEq([1])([]),     false);
    assert.is( arrayDeepEq([])([1]),     false);
    assert.is( arrayDeepEq([0])(["0"]),  false);
    assert.is( arrayDeepEq([[]])([[]]),  true);
    assert.is( arrayDeepEq([[1]])([[1]]),true);
    assert.is( arrayDeepEq([[]])([]),    false);
    assert.is( arrayDeepEq([[1], [2, 3]])([[1], [2, 3]]),true);
    assert.is( arrayDeepEq([[[[1, 2]]]])([[[[1, 2]]]]),  true);
    assert.is( arrayDeepEq([[1], 2])([[1], 2]),          true);
});

// TODO: add tests for deepEq with array prototype usage

arrayUtilSuite.run();
