import { ironmanData } from "../../../data/datasets.js";
import { MultiSelectionController }   from "../../../chart/controller/multiSelectionController.js";
import { HotspotController }          from "../../../chart/controller/hotspotController.js";
import { identity } from "../../../util/chartUtil.js";

import { ChartController }            from "../../../chart/controller/chartController.js";
import { TableProjector } from "../../../chart/projector/tableProjector.js";

// Get HTML elements
const dataTable = document.getElementById("data-table");

// Prepare chart controller
const dimension = a => [...Object.values(a)];
const groupByFn = identity;

const chartController = ChartController(dimension, groupByFn);
chartController.setXAxisValueAccessor(p => p.getKey());
chartController.setYAxisValueAccessor(p => p.getValue());

// Prepare selection, hotspot & tickController controller
const selectionController = MultiSelectionController();
const hotspotController = HotspotController();

// Build projectors
const columns = [
    {label: 'Id',         format: a => a.athlete_id},
    {label: 'Name',       format: a => a.name},
    {label: 'Age',        format: a => a.age},
    {label: 'Gender',     format: a => a.gender === 'male' ? '♂' : '♀'},
    {label: 'Country',    format: a => a.country},
    {label: 'Swim Time',  format: a => a.swim_time},
    {label: 'Bike Time',  format: a => a.bike_time},
    {label: 'Run Time',   format: a => a.run_time},
    {label: 'Total Time', format: a => a.total_time},
    {label: 'Rank',       format: a => a.rank_overall},
];

const table = TableProjector({
    chartController,
    hotspotController,
    selectionController,
    columns
});

dataTable.appendChild(table);

// Set data
chartController.updateData(ironmanData);

