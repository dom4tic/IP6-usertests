import { TestSuite } from "../../kolibri/util/test.js";
import { lightenHexColor, darkenHexColor } from "./color.js";

const colorSuite = TestSuite("util/color");

colorSuite.add("lightenHexColor", assert => {
    const color = lightenHexColor("#6000ff", 40);
    assert.is(color, "#9f66ff")
});

colorSuite.add("darkenHexColor", assert => {
    const color = darkenHexColor("#e11161", 50);
    assert.is(color, "#700830")
});
colorSuite.run();
