import MapTackUtils from '../../map-tack-core/dmt-map-tack-utils.js';
import LensManager, { LensActivationEventName } from '/core/ui/lenses/lens-manager.js';
import BuildingPlacementManager from '/base-standard/ui/building-placement/building-placement-manager.js';
import { InterfaceMode, InterfaceModeChangedEventName } from '/core/ui/interface-modes/interface-modes.js';
import { OVERLAY_PRIORITY } from '/base-standard/ui/utilities/utilities-overlay.js';

class MapTackLensLayer {
    constructor() {
        this.cityCenterRadiusOverlayList = new Map();
    }
    onGameLoaded() {
        LensManager.enableLayer("dmt-map-tack-layer"); // Enable map tack layer by default.
    }
    initLayer() {
        window.addEventListener("user-interface-loaded-and-ready", this.onGameLoaded.bind(this));
        window.addEventListener('layer-hotkey', this.onLayerHotkey.bind(this));
        window.addEventListener(LensActivationEventName, this.onActiveLensChanged.bind(this));
        window.addEventListener(InterfaceModeChangedEventName, this.onInterfaceModeChanged.bind(this));
        engine.on("RemoveMapTackRequest", this.onMapTackRemoved.bind(this));

        this.mapTackModelGroup = WorldUI.createModelGroup("MapTackModelGroup");
        // City center radius overlay
        this.cityCenterRadiusOverlayGroup = WorldUI.createOverlayGroup("cityCenterRadiusOverlayGroup", OVERLAY_PRIORITY.CULTURE_BORDER);
        this.cityCenterRadiusOverlayStyle = {
            style: "CultureBorder_CityState_Open",
            primaryColor: UI.Player.getPrimaryColorValueAsHex(GameContext.localPlayerID),
            secondaryColor: UI.Player.getSecondaryColorValueAsHex(GameContext.localPlayerID)
        };
    }
    applyLayer() {
        window.dispatchEvent(new Event("ui-show-map-tack-icons"));
    }
    removeLayer() {
        window.dispatchEvent(new Event("ui-hide-map-tack-icons"));
    }
    onMapTackRemoved(mapTackData) {
        if (MapTackUtils.isCityCenter(mapTackData.type)) {
            // Clear this city center radius.
            const key = this.getKey(mapTackData.x, mapTackData.y);
            this.clearCityCenterRadius(key);
        }
    }
    onLayerHotkey(hotkey) {
        if (hotkey.detail?.name == "toggle-map-tack-layer") {
            LensManager.toggleLayer("dmt-map-tack-layer");
        }
    }
    onActiveLensChanged(event) {
        // Building placement lens.
        if (event.detail?.activeLens == "fxs-building-placement-lens") {
            // Highlight corresponding plots.
            const type = BuildingPlacementManager?.currentConstructible?.ConstructibleType;
            if (type) {
                const plotCoords = MapTackUtils.getMapTackTypePlots(type) || [];
                this.highlightMapTackPlot(plotCoords);
            }
        } else {
            this.clearHiglights();
        }
        // Settler lens.
        if (event.detail?.activeLens == "fxs-settler-lens") {
            // Enable map tack layer in settler lens by default.
            if (!LensManager.isLayerEnabled("dmt-map-tack-layer")) {
                LensManager.enableLayer("dmt-map-tack-layer");
            }
            // Highlight city center plots.
            const plotCoords = MapTackUtils.getCityCenterMapTackPlots() || [];
            this.highlightMapTackPlot(plotCoords);
        }
    }
    onInterfaceModeChanged() {
        if (InterfaceMode.getCurrent() == "DMT_INTERFACEMODE_MAP_TACK_CHOOSER" || InterfaceMode.getCurrent() == "DMT_INTERFACEMODE_PLACE_MAP_TACKS") {
            this.showCityCenterRadius();
        } else {
            this.clearCityCenterRadius();
        }
    }
    showCityCenterRadius() {
        this.clearCityCenterRadius();
        const cityCenterPlots = MapTackUtils.getCityCenterMapTackPlots() || [];
        for (const cityCenterPlot of cityCenterPlots) {
            const cityPlotIndices = GameplayMap.getPlotIndicesInRadius(cityCenterPlot.x, cityCenterPlot.y, 3);
            const borderOverlay = this.cityCenterRadiusOverlayGroup.addBorderOverlay(this.cityCenterRadiusOverlayStyle);
            borderOverlay.setPlotGroups(cityPlotIndices, 0);
            const key = this.getKey(cityCenterPlot.x, cityCenterPlot.y);
            this.cityCenterRadiusOverlayList.set(key, borderOverlay);
        }
    }
    clearCityCenterRadius(key = null) {
        if (key) {
            // Clear single one
            const overlay = this.cityCenterRadiusOverlayList.get(key);
            if (overlay) {
                overlay.clear();
                this.cityCenterRadiusOverlayList.delete(key);
            }
        } else {
            // Clear all
            for (const overlay of this.cityCenterRadiusOverlayList.values()) {
                overlay.clear();
            }
            this.cityCenterRadiusOverlayList.clear();
        }
    }
    highlightMapTackPlot(plotCoords = []) {
        this.clearHiglights();
        for (const plotCoord of plotCoords) {
            this.mapTackModelGroup?.addVFXAtPlot("VFX_3dUI_Tut_SelectThis_01", plotCoord, { x: 0, y: 0, z: 0 });
            this.mapTackModelGroup?.addVFXAtPlot("VFX_3dUI_Unit_Selected_01", plotCoord, { x: 0, y: 0, z: 0 });
        }
    }
    clearHiglights() {
        this.mapTackModelGroup?.clear();
    }
    getKey(x, y) {
        return `${x}-${y}`;
    }
}
LensManager.registerLensLayer("dmt-map-tack-layer", new MapTackLensLayer());