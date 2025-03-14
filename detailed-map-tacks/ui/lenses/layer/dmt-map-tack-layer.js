import LensManager from '/core/ui/lenses/lens-manager.js';

class MapTackLensLayer {
    constructor() {
    }
    onGameLoaded() {
        LensManager.enableLayer("dmt-map-tack-layer"); // Enable map tack layer by default.
    }
    initLayer() {
        window.addEventListener("user-interface-loaded-and-ready", this.onGameLoaded.bind(this));
    }
    applyLayer() {
        window.dispatchEvent(new Event("ui-show-map-tack-icons"));
    }
    removeLayer() {
        window.dispatchEvent(new Event("ui-hide-map-tack-icons"));
    }
}
LensManager.registerLensLayer("dmt-map-tack-layer", new MapTackLensLayer());