import "../../../kolibri/util/array.js"
import { Observable } from "../../../kolibri/observable.js";

export { HotspotController }

/**
 * @typedef HotspotModelType
 * @property { () => IPartition } getHotspot
 * @property { (IPartition) => void } setHotspot
 * @property { (cb: ValueChangeCallback<IPartition>) => void } onHotspotChanged
 */

/**
 * @return { HotspotModelType }
 * @constructor
 */
const HotspotModel = () => {
    const elementOnHotspot = Observable(undefined);

    return {
        getHotspot:        elementOnHotspot.getValue,
        setHotspot:        elementOnHotspot.setValue,
        onHotspotChanged:  elementOnHotspot.onChange
    }
};

/**
 * @typedef HotspotControllerType
 * @property { () => IPartition } getHotspot
 * @property { (IPartition) => void } setHotspot
 * @property { (cb: ValueChangeCallback<IPartition>) => void } onHotspotChanged
 */
/**
 *
 * @return { HotspotControllerType }
 * @constructor
 */
const HotspotController = () => {
    const model = HotspotModel();

    return {
        getHotspot:        model.getHotspot,
        setHotspot:        model.setHotspot,
        onHotspotChanged:  model.onHotspotChanged
    }
};
