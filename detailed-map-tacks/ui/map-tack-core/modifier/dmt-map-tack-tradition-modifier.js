
import MapTackModifierRequirement from './dmt-map-tack-modifier-requirement.js';

class MapTackTraditionModifierSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!MapTackTraditionModifierSingleton.singletonInstance) {
            MapTackTraditionModifierSingleton.singletonInstance = new MapTackTraditionModifierSingleton();
        }
        return MapTackTraditionModifierSingleton.singletonInstance;
    }
    constructor() {
        this.traditions = [];
        this.modifiers = [];

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheModifiers();
    }
    cacheModifiers() {
        this.traditions = [];
        this.modifiers = [];
    }
    isModifierActive(modifierId) {
        console.error("Tradition isModifierActive", modifierId);
        if (this.modifiers.includes(modifierId)) {
            const requirementMet = MapTackModifierRequirement.isModifierRequirementMet(modifierId);
            console.error("Tradition isModifierActive requirementMet", modifierId, requirementMet);
            return requirementMet;
        }
        return false;
    }
}

const MapTackTraditionModifier = MapTackTraditionModifierSingleton.getInstance();
export { MapTackTraditionModifier as default };