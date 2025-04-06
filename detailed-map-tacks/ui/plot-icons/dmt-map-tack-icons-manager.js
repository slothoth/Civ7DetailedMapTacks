// Modified from plot-icons-manager.js.

export const MapTackIconRootUpdateEventName = "map-tack-icons-root-update";
class MapTackIconRootUpdateEvent extends CustomEvent {
    constructor(mapTackStructList) {
        super(MapTackIconRootUpdateEventName, { detail: { mapTackStructList } });
    }
}
class MapTackIconsManagerSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!MapTackIconsManagerSingleton.singletonInstance) {
            MapTackIconsManagerSingleton.singletonInstance = new MapTackIconsManagerSingleton();
        }
        return MapTackIconsManagerSingleton.singletonInstance;
    }
    constructor() {
        /** The icon root component used to sent events too */
        this.iconRoot = null;
        /** Queue of custom events used to cache events before the root component is alive */
        this.eventQueue = [];
        /** Lookup for map-tack-icons based on location hash */
        this.perPlotMap = new Map();
        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        engine.on("MapTackUIUpdated", this.onMapTackUIUpdated, this);
    }
    onMapTackUIUpdated(mapTackStructList) {
        this.updateMapTackIconRoot(mapTackStructList);
    }
    rootAttached(root) {
        // Once we have our root sent any queued events
        this.eventQueue.forEach((event) => {
            root.dispatchEvent(event);
        });
        // Cache our root and clear the queue
        this.eventQueue = [];
        this.iconRoot = root;
    }
    /**
     * @description Called by a map-tack-icon to let manager directly access it's instance. i.e. let manager know it has been created.
     * @param {MapTackIcons} stack - map-tack-icons which manager created.
     */
    addStackForTracking(stack) {
        const x = parseInt(stack.Root.getAttribute('x') ?? '-1');
        const y = parseInt(stack.Root.getAttribute('y') ?? '-1');
        if (x != -1 && y != -1) {
            const key = this.getMapTackKey(x, y);
            if (this.perPlotMap.has(key)) {
                return;
            }
            this.perPlotMap.set(key, stack);
        }
    }
    removeStackForTracking(stack) {
        const x = parseInt(stack.Root.getAttribute('x') ?? '-1');
        const y = parseInt(stack.Root.getAttribute('y') ?? '-1');
        if (x != -1 && y != -1) {
            const key = this.getMapTackKey(x, y);
            if (!this.perPlotMap.has(key)) {
                return;
            }
            this.perPlotMap.delete(key);
        }
    }
    updateMapTackIconRoot(mapTackStructList) {
        const event = new MapTackIconRootUpdateEvent(mapTackStructList);
        if (this.iconRoot) {
            this.iconRoot.dispatchEvent(event);
        }
        else {
            this.eventQueue.push(event);
        }
    }
    getMapTackIcon(x, y) {
        const key = this.getMapTackKey(x, y);
        return this.perPlotMap.get(key);
    }
    getMapTackKey(x, y) {
        return `${x}-${y}`;
    }
}
const MapTackIconsManager = MapTackIconsManagerSingleton.getInstance();
export { MapTackIconsManager as default };