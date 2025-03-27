import LensManager, { LensActivationEventName } from '/core/ui/lenses/lens-manager.js';

class MapTackLensLayer {
    constructor() {
    }
    onGameLoaded() {
        LensManager.enableLayer("dmt-map-tack-layer"); // Enable map tack layer by default.
    }
    initLayer() {
        window.addEventListener("user-interface-loaded-and-ready", this.onGameLoaded.bind(this));
        // window.addEventListener(LensActivationEventName, this.onActiveLensChanged.bind(this));
    }
    applyLayer() {
        window.dispatchEvent(new Event("ui-show-map-tack-icons"));
    }
    removeLayer() {
        window.dispatchEvent(new Event("ui-hide-map-tack-icons"));
    }
    onActiveLensChanged(event) {
        if (event.detail?.activeLens == "fxs-building-placement-lens") {
            // Enable the layer when placing buildings.
            if (!LensManager.isLayerEnabled("dmt-map-tack-layer")) {
                LensManager.enableLayer("dmt-map-tack-layer");
            }
        }
    }
}
LensManager.registerLensLayer("dmt-map-tack-layer", new MapTackLensLayer());