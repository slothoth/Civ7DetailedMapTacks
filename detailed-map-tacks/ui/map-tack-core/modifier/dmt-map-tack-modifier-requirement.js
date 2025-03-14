
class MapTackModifierRequirementSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!MapTackModifierRequirementSingleton.singletonInstance) {
            MapTackModifierRequirementSingleton.singletonInstance = new MapTackModifierRequirementSingleton();
        }
        return MapTackModifierRequirementSingleton.singletonInstance;
    }
    constructor() {
        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheModifiers();
    }
    cacheModifiers() {
        // Get traits for the leader.
        for (const e of GameInfo.Modifiers) {
            if (e.LeaderType == leaderType) {
                this.traits.push(e.TraitType);
            }
        }
        // Get modifiers for all traits.
        for (const e of GameInfo.TraitModifiers) {
            if (this.traits.includes(e.TraitType)) {
                this.modifiers.push(e.ModifierId);
            }
        }
    }
    isModifierRequirementMet(modifierId) {
        // Check if the modifier has requirements
        const modifierDef = GameInfo.Modifiers.lookup(modifierId);
        if (modifierDef?.OwnerRequirementSetId == null && modifierDef?.SubjectRequirementSetId == null) {
            // No requirements
            return true;
        }
        // TODO: return false by default.
        return false;
    }
}

const MapTackModifierRequirement = MapTackModifierRequirementSingleton.getInstance();
export { MapTackModifierRequirement as default };