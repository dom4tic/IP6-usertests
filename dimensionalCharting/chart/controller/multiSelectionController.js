import "../../../kolibri/util/array.js"
import {Observable} from "../../../kolibri/observable.js";

export { MultiSelectionController }

/**
 * @typedef MultiSelectionModelType
 * @property { () => [IPartition] } getSelection
 * @property { ([IPartition]) => void } setSelection
 * @property { (cb: ValueChangeCallback<IPartition>) => void } onSelectionChanged
 * @property { () => void } clearSelection
 */

/**
 * @return { MultiSelectionModelType }
 * @constructor
 */
const MultiSelectionModel = () => {
    const selection = Observable([]);

    return {
        getSelection:       selection.getValue,
        setSelection:       selection.setValue,
        onSelectionChanged: selection.onChange,
        clearSelection:     () => selection.setValue([]),
    }
};

/**
 * @typedef MultiSelectionControllerType
 * @property { (IPartition) => void } select
 * @property { (IPartition) => void } unselect
 * @property { () => [IPartition] } getSelection
 * @property { (IPartition) => boolean } isSelected
 * @property { (cb: ValueChangeCallback<IPartition>) => void } onSelectionChanged
 * @property { () => void } clearSelection
 */
/**
 *
 * @return { MultiSelectionControllerType }
 * @constructor
 */
const MultiSelectionController = () => {
    const model = MultiSelectionModel();

    const contains = item => model.getSelection().map(i => i.getKey()).includes(item.getKey());

    const add = item => {
        if (!contains(item)) {
            const selectionCopy = [...model.getSelection()];
            selectionCopy.push(item);
            model.setSelection(selectionCopy);
        }
    };

    const del = item => {
        const selectionCopy = [...model.getSelection()];
        const index = selectionCopy.findIndex(i => i.getKey() === item.getKey());
        selectionCopy.removeAt(index);
        model.setSelection(selectionCopy);
    };

    const isSelected = s => contains(s);

    // TODO: support Toggle

    return {
        select:             add,
        unselect:           del,
        getSelection:       model.getSelection,
        isSelected:         isSelected,
        onSelectionChanged: model.onSelectionChanged,
        clearSelection:     () => model.setSelection([]),
    }
};
