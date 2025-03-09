
export { Filter, buildEmptyFilter }

/**
 * @typedef FilterType
 * @template _T_
 * @property { () => (_T_) => boolean } getPredicate
 */

/**
 * Creates a Filter object.
 * @template _T_
 * @param { (_T_) => boolean } predicate
 * @return { FilterType }
 * @constructor
 */
const Filter = predicate => ({
    getPredicate: () => predicate
});

/**
 * Builds an empty filter which acts as a pass-through filter.
 * @return { FilterType }
 */
const buildEmptyFilter = () => Filter(_ => true);
