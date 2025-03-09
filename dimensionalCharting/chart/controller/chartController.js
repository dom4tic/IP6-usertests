import { Observable } from "../../../kolibri/observable.js";

export { ChartController, Partition }

// TODO: move Partition in separate file (module)

/**
 * @typedef { (p: IPartition) => number | string } ValueAccessor
 * A function that maps a value to a number.
 */

/**
 * @typedef IPartition
 * @property { () => string } getKey
 * @property { () => (number | {}) } getValue
 */

/**
 * @param   { string } key - the key of the partition.
 * @param   { number | {} } value
 * @constructor
 * @return { IPartition }
 */
const Partition = (key, value) => ({
    getKey:  ()  => key,
    getValue: ()  => value,
});

/**
 * @template _T_
 * @typedef ChartModelType
 * @property { () => ((_T_) => (number | string | (string | number)[])) } getGroupBy
 * @property { () => ((acc: *, curr: *) => *) } getGroupFn
 * @property { () => [IPartition] } getPartitions
 * @property { ([IPartition]) => void } setPartitions
 * @property { (cb: ValueChangeCallback<[IPartition]>) => void } onPartitionsChanged
 * @property { () => (a: IPartition, b: IPartition) => number } getSort
 * @property { ((a: IPartition, b: IPartition) => number) => void } setSort
 * @property { (cb: ValueChangeCallback<[number]>) => void } onSortChanged
 *
 * @property { (accessor: ValueAccessor) => void } setXAxisValueAccessor
 * @property { () => ValueAccessor }               getXAxisValueAccessor
 * @property { (accessor: ValueAccessor) => void } setYAxisValueAccessor
 * @property { () => ValueAccessor }               getYAxisValueAccessor
 *
 * @property { (accessor: (p: IPartition) => number) => void } setSizeValueAccessor
 * @property { () => ((p: IPartition) => number) }             getSizeValueAccessor
 */

/**
 * @template _T_
 * @param { (_T_) => (number | string | (string | number)[]) } groupBy
 * @param { (acc: *, curr: *) => * } groupFn
 * @return ChartModelType
 * @constructor
 */
const Chart = (groupBy, groupFn) => {
    const partitions = Observable([]);
    const sort        = Observable((a, b) => b.getValue() - a.getValue());

    const xAxisValueAccessor = Observable(undefined);
    const yAxisValueAccessor = Observable(undefined);
    const sizeValueAccessor  = Observable(undefined);

    return {
        getGroupBy:             () => groupBy,
        getGroupFn:             () => groupFn,

        getPartitions:          partitions.getValue,
        setPartitions:          partitions.setValue,
        onPartitionsChanged:    partitions.onChange,

        getSort:                sort.getValue,
        setSort:                sort.setValue,
        onSortChanged:          sort.onChange,

        setXAxisValueAccessor:  xAxisValueAccessor.setValue,
        getXAxisValueAccessor:  xAxisValueAccessor.getValue,

        setYAxisValueAccessor:  yAxisValueAccessor.setValue,
        getYAxisValueAccessor:  yAxisValueAccessor.getValue,

        setSizeValueAccessor:  sizeValueAccessor.setValue,
        getSizeValueAccessor:  sizeValueAccessor.getValue,
    };
};

/**
 * @typedef ChartControllerType
 * @template _T_
 * @property { ([_T_]) => void } updateData
 * @property { ((a: IPartition, b: IPartition) => number) => void } setSort
 * @property { () => [IPartition] } getPartitions
 * @property { (cb: ValueChangeCallback<[IPartition]>) => void } onPartitionsChanged
 * @property { () => KeyExtractor } getGroupBy
 * @property { (string) => ?IPartition } find
 * @property { (accessor: ValueAccessor) => void } setXAxisValueAccessor
 * @property { () => ValueAccessor }               getXAxisValueAccessor
 * @property { (accessor: ValueAccessor) => void } setYAxisValueAccessor
 * @property { () => ValueAccessor }               getYAxisValueAccessor
 * @property { (accessor: ValueAccessor) => void } setSizeValueAccessor
 * @property { () => ValueAccessor }               getSizeValueAccessor
 */

/**
 *
 * @template _T_
 * @param { (_T_) => (number | string | (string | number)[]) } groupBy
 * @param {  (acc: *, curr: *) => * } groupFn
 * @return { ChartControllerType }
 * @constructor
 * @example
 * const chart = ChartController(person => person.getAge(), personsData);
 */
const ChartController = (groupBy, groupFn) => {
    const chartModel = Chart(groupBy, groupFn);

    const buildAndSetChartData = data => chartModel.setPartitions(
        partitionData(
            data,
            chartModel.getGroupBy(),
            chartModel.getGroupFn(),
            chartModel.getSort(),
        ));

    const find = key => chartModel.getPartitions().find(partition => partition.getKey() === key);

    return {
        updateData:          buildAndSetChartData,
        setSort:             chartModel.setSort,

        getPartitions:       chartModel.getPartitions,
        onPartitionsChanged: chartModel.onPartitionsChanged,

        getGroupBy:          chartModel.getGroupBy,

        find:                find,

        setXAxisValueAccessor:  chartModel.setXAxisValueAccessor,
        getXAxisValueAccessor:  chartModel.getXAxisValueAccessor,
        setYAxisValueAccessor:  chartModel.setYAxisValueAccessor,
        getYAxisValueAccessor:  chartModel.getYAxisValueAccessor,
        setSizeValueAccessor:   chartModel.setSizeValueAccessor,
        getSizeValueAccessor:   chartModel.getSizeValueAccessor,
    }
};

/**
 * Partitions the data by the keyExtractor.
 * @template _T_
 * @param    { Array<_T_> } data
 * @param    { (_T_) => (number | string | (string | number)[]) } groupBy
 * @param    { (acc: *, curr: *) => * } groupFn
 * @param    { (a: IPartition, b: IPartition) => number } sort
 * @return   { Array<IPartition> }
 * @pure
 */
const partitionData = (data, groupBy, groupFn, sort) => {
    const mappedDataByGroup = data.map(d => ({key: groupBy(d), value: d}));

    const grouped = Object.groupBy(mappedDataByGroup, ({key}) => key);

    return  Object.entries(grouped).map(([key, value]) =>
        Partition(key, value.map(v => v.value).reduce(groupFn, {}))
    ).sort(sort);
};
