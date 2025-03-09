export { arrayDeepEq }

/**
 * A function that compares two array for equality by checking that they are of the same length and
 * all elements are pairwise equal. This includes if elements are arrays. The "leaf" elements are
 * compared with respect to the "===" operator. Arguments are given in curried style.
 * Arguments must not be null/undefined and must be of type {@link Array}.
 * TODO: could be potentially be moved to kolibri/util/arrayFunctions
 *
 * @template T
 * @pure
 * @type { (arrayA:!Array<T>) => (arrayB:!Array<T>) => boolean }
 * @param { !Array<T>} arrayA - the first array. Mandatory.
 * @returns { (arrayB:!Array<T>) => boolean}
 */
const arrayDeepEq = arrayA => arrayB => {
    // If both are arrays, compare their lengths and elements
    if (Array.isArray(arrayA) && Array.isArray(arrayB)) {
        return arrayA.length === arrayB.length
            && arrayA.every((item, index) => arrayDeepEq(item)(arrayB[index]));
    }

    return arrayA === arrayB;
};

/**
 * See {@link arrayDeepEq}.
 * @template _T_
 * @param  { Array<_T_> } array
 * @return { Boolean  }
 * @example
 * [[1], [2, 3]].eq([[1], [2, 3]]); // true
 */
Array.prototype.deepEq = function(array) { return arrayDeepEq(this)(array);};
