import { Observable } from "../../../kolibri/observable.js";
import { buildEmptyFilter, Filter } from "../filter.js";
import { times } from "../../../kolibri/util/arrayFunctions.js";

export { FilterController }

/**
 * @typedef FilterModelType
 * @property { () => FilterType[] } getFilters
 * @property { (filters: FilterType[]) => void } setFilters
 * @property { (cb: ValueChangeCallback<FilterType[]>) => void } onFiltersChanged
 * @property { (index: number) => FilterType } getFilter
 */

/**
 * @param { FilterType[] } initialFilters
 * @return { FilterModelType }
 * @constructor
 */
const FilterModel = initialFilters => {
    const filters = Observable(initialFilters);

    /**
     * @param { number } index
     * @return { FilterType }
     */
    const getFilter = index => filters.getValue()[index];

    return {
        getFilters:         filters.getValue,
        setFilters:         filters.setValue,
        onFiltersChanged:   filters.onChange,
        getFilter:          getFilter
    }
}

/**
 * @template _T_
 * @typedef FilterControllerType
 * @property { () => FilterType[] } getFilters
 * @property { (cb: ValueChangeCallback<FilterType[]>) => void } onFiltersChanged
 * @property { (selection: SelectionContext) => void } updateFilters
 * @property { (data: _T_, idx: number) => _T_[] } filter
 */

/**
 * @template _T_
 *
 * @param { KeyExtractor<_T_>[] } keyExtractors
 *
 * @return { FilterControllerType }
 * @constructor
 */

const FilterController = keyExtractors => {
    const model = FilterModel(times(keyExtractors.length)(_ => buildEmptyFilter()));

    /**
     * Updates the filters based on the selection given.
     * TODO: maybe this coupling between selection and filter should be done in dimensionalChartController
     *
     * @param { SelectionContext } selectionContext
     * @return void
     */
    const updateFilters = selectionContext => {
        const updatedFilters = [];

        updatedFilters.push(model.getFilter(0)); // first filter is never derived from the selection

        for (let i = 1; i < selectionContext.length; i++) {
            const selection = selectionContext[i-1]; // map selection to the next filter
            if (selection.length > 0) {
                updatedFilters.push(Filter(item => selection.includes(String(keyExtractors[i-1](item)))));
            } else {
                updatedFilters.push(buildEmptyFilter());
            }
        }

        model.setFilters(updatedFilters);
    }

    /**
     * Applies all filters until the given index (inclusive) to the data.
     * @template _T_
     * @param { _T_[] } data
     * @param { number } index
     * @return { _T_[] }
     */
    const filter = (data, index) => {
        if (index >= keyExtractors.length) throw new Error("Index must not be equal or greater than number of filters!");

        const filterChain = buildFilterChain(model.getFilters(), index);
        return applyFilters(data, filterChain);
    }

    return {
        getFilters:       model.getFilters,
        onFiltersChanged: model.onFiltersChanged,

        updateFilters:    updateFilters,
        filter:           filter
    }
}

/**
 * Builds a chain of filters from the first filter to the filter of the index (inclusive).
 * @param { FilterType[] } filters
 * @param { number } index
 * @return { FilterType[] }
 */
const buildFilterChain = (filters, index) => filters.slice(0, index+1);

/**
 * Applies the filters to the data in the given sequence.
 * @template _T_
 * @param { _T_[] } data
 * @param { FilterType[] } filters
 * @return { _T_[] }
 */
const applyFilters = (data, filters) => {
    // return filters.reduce((acc, curr) => acc.filter(curr), data);
    filters.forEach(filter => {
        if (filter) {
            data = data.filter(filter.getPredicate());
        }
    });
    return data;
}
