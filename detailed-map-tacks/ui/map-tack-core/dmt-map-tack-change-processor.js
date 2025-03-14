
import MapTackStore from './dmt-map-tack-store.js';
import MapTackUtils from './dmt-map-tack-utils.js';
import MapTackValidator from './dmt-map-tack-validator.js';
import MapTackYield from './dmt-map-tack-yield.js';

class MapTackChangeProcessorSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!MapTackChangeProcessorSingleton.singletonInstance) {
            MapTackChangeProcessorSingleton.singletonInstance = new MapTackChangeProcessorSingleton();
        }
        return MapTackChangeProcessorSingleton.singletonInstance;
    }
    constructor() {
        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        engine.on("AddMapTackRequest", this.onAddMapTackRequest, this);
        engine.on("RemoveMapTackRequest", this.onRemoveMapTackRequest, this);
        // Game update events
        engine.on("ConstructibleAddedToMap", this.onConstructibleChanged, this);
        engine.on("ConstructibleRemovedFromMap", this.onConstructibleChanged, this);
        engine.on("PlotVisibilityChanged", this.onPlotVisibilityChanged, this);
    }
    onAddMapTackRequest(mapTackData) {
        console.error("ChangeProcessor onAddMapTackRequest", JSON.stringify(mapTackData));
        MapTackStore.addMapTack(mapTackData);
        this.triggerMapTackUIUpdate(mapTackData.x, mapTackData.y);
    }
    onRemoveMapTackRequest(mapTackData) {
        console.error("ChangeProcessor onRemoveMapTackRequest", JSON.stringify(mapTackData));
        MapTackStore.removeMapTack(mapTackData);
        this.triggerMapTackUIUpdate(mapTackData.x, mapTackData.y);
    }
    onConstructibleChanged(data) {
        this.triggerMapTackUIUpdate(data.location.x, data.location.y);
    }
    onPlotVisibilityChanged(data) {
        this.triggerMapTackUIUpdate(data.location.x, data.location.y);
    }
    triggerMapTackUIUpdate(x, y) {
        // Check for updates near the changed plot.
        const plotsUpdated = this.updateAdjacentMapTacks(x, y, true);
        // Make sure the changed plot is added.
        plotsUpdated.add(this.getMapTackKey(x, y));
        const mapTackStructList = this.getMapTackStructList(plotsUpdated);
        engine.trigger("MapTackUIUpdated", mapTackStructList);
    }
    updateAdjacentMapTacks(x, y, includeSelf) {
        const plotsUpdated = new Set();
        const additionalPlotCenterToUpdate = new Set();
        const adjacentMapTacks = MapTackUtils.getAdjacentMapTacks(x, y, includeSelf);
        for (const { x: adjX, y: adjY, mapTackList } of adjacentMapTacks) {
            const newMapTackList = [];
            for (const mapTack of mapTackList) {
                const newValidStatus = MapTackValidator.isValid(mapTack.x, mapTack.y, mapTack.type, false);
                if (mapTack.validStatus.isValid != newValidStatus.isValid) {
                    // If the valid status of a plot has changed, queue it as a center to cascade the update.
                    additionalPlotCenterToUpdate.add(this.getMapTackKey(mapTack.x, mapTack.y));
                }
                newMapTackList.push({
                    x: mapTack.x,
                    y: mapTack.y,
                    type: mapTack.type,
                    classType: mapTack.classType,
                    validStatus: newValidStatus,
                    yieldDetails: MapTackYield.getYieldDetails(mapTack.x, mapTack.y, mapTack.type)
                });
            }
            if (JSON.stringify(newMapTackList) != JSON.stringify(mapTackList)) {
                MapTackStore.updateMapTacks(adjX, adjY, newMapTackList);
                plotsUpdated.add(this.getMapTackKey(adjX, adjY));
            }
        }
        if (additionalPlotCenterToUpdate.size > 0) {
            for (const plotCenterKey of additionalPlotCenterToUpdate) {
                const [plotCenterX, plotCenterY] = plotCenterKey.split('-').map(Number);
                const subUpdates = this.updateAdjacentMapTacks(plotCenterX, plotCenterY);
                subUpdates.forEach(plot => plotsUpdated.add(plot));
            }
        }
        return plotsUpdated;
    }
    getMapTackStructList(plotKeys) {
        const mapTackStructList = [];
        for (const plotKey of plotKeys) {
            const [x, y] = plotKey.split('-').map(Number);
            mapTackStructList.push({
                x: x,
                y: y,
                mapTackList: MapTackStore.retrieveMapTacks(x, y)
            });
        }
        return mapTackStructList;
    }
    getMapTackKey(x, y) {
        return `${x}-${y}`;
    }
}

const MapTackChangeProcessor = MapTackChangeProcessorSingleton.getInstance();
export { MapTackChangeProcessor as default };