
import MapTackUtils from './dmt-map-tack-utils.js';
import MapTackTraitModifier from './modifier/dmt-map-tack-trait-modifier.js';

const SUPPORTED_COLLECTIONS = [
    "COLLECTION_PLAYER_CITIES",
    "COLLECTION_PLAYER_CAPITAL_CITY"
];

const SUPPORTED_EFFECTS = [
    "EFFECT_CITY_ACTIVATE_CONSTRUCTIBLE_ADJACENCY",
    "EFFECT_CITY_ADJUST_ADJACENCY_FLAT_AMOUNT"
];

const ModifierType = Object.freeze({
    TRAIT: "TRAIT",
    TRADITION: "TRADITION",
    BELIEF: "BELIEF",
    TREE: "TREE"
});
class MapTackModifierSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!MapTackModifierSingleton.singletonInstance) {
            MapTackModifierSingleton.singletonInstance = new MapTackModifierSingleton();
        }
        return MapTackModifierSingleton.singletonInstance;
    }
    constructor() {
        // ModifierId => [ {name, value}, {name, value}, ... ]
        this.modifierArguments = {};
        // Stores modifier map. < ModifierId, ModifierObject >
        // ModifierObject contains the following fields:
        //      collection: CollectionType
        //      effect: EffectType
        //      args: [ { name, value }, {name, value}, ... ]
        //      ownerReqSet: OwnerRequirementSetId
        //      subjectReqSet: SubjectRequirementSetId
        this.modifiers = {};
        // AdjacencyId => ModifierId (Assume one id can only be mapped to one modifier for now)
        this.adjacencyModifiers = {};

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheModifierArguments();
        this.cacheModifiers();
        // The above must be executed first.
        this.cacheAdjacencyModifiers();
    }
    cacheModifierArguments() {
        this.modifierArguments = {};
        for (const e of GameInfo.ModifierArguments) {
            const current = this.modifierArguments[e.ModifierId] || [];
            current.push({
                name: e.Name,
                value: e.Value
            });
            this.modifierArguments[e.ModifierId] = current;
        }
    }
    cacheModifiers() {
        this.modifiers = {};
        for (const e of GameInfo.DynamicModifiers) {
            if (SUPPORTED_COLLECTIONS.includes(e.CollectionType) && SUPPORTED_EFFECTS.includes(e.EffectType)) {
                const modifierType = e.ModifierType;
                if (modifierType.endsWith("_TYPE")) {
                    const modifierId = modifierType.slice(0, -5);
                    // Create ModifierObject
                    const modifierDef = GameInfo.Modifiers.lookup(modifierId);
                    this.modifiers[modifierId] = {
                        collection: e.CollectionType,
                        effect: e.EffectType,
                        args: this.modifierArguments[modifierId],
                        ownerReqSet: modifierDef?.OwnerRequirementSetId,
                        subjectReqSet: modifierDef?.SubjectRequirementSetId
                    };
                }
            }
        }
    }
    cacheAdjacencyModifiers() {
        this.adjacencyModifiers = {};
        for (const [modifierId, modifierObject] of Object.entries(this.modifiers)) {
            const args = modifierObject.args;
            for (const arg of args) {
                if (arg.name == "ConstructibleAdjacency") {
                    this.adjacencyModifiers[arg.value] = modifierId;
                }
            }
        }
    }
    isAdjacencyUnlocked(adjacencyId) {
        const modifierId = this.adjacencyModifiers[adjacencyId];
        if (modifierId) {
            return MapTackTraitModifier.isModifierActive(modifierId);
        }
        return false;
    }
}

const MapTackModifier = MapTackModifierSingleton.getInstance();
export { MapTackModifier as default };