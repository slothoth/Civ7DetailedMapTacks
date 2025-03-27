
import MapTackUtils from '../dmt-map-tack-utils.js';

class ConstructibleModifierSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!ConstructibleModifierSingleton.singletonInstance) {
            ConstructibleModifierSingleton.singletonInstance = new ConstructibleModifierSingleton();
        }
        return ConstructibleModifierSingleton.singletonInstance;
    }
    constructor() {
        // Map of: ModifierId => [ constructibleType1, constructibleType2 ]
        this.modifierConstructible = {};

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheData();
    }
    cacheData() {
        this.modifierConstructible = {};
        for (const e of GameInfo.ConstructibleModifiers) {
            const current = this.modifierConstructible[e.ModifierId] || [];
            current.push(e.ConstructibleType);
            this.modifierConstructible[e.ModifierId] = current;
        }
    }
    isModifierActive(modifierId) {
        const constructibles = this.modifierConstructible[modifierId] || [];
        for (const constructible of constructibles) {
            if (this.hasConstructible(constructible)) {
                return true;
            }
        }
        return false;
    }
    hasConstructible(constructible) {
        // Check map tacks.
        const allValidMapTacks = MapTackUtils.getAllValidMapTacks();
        for (const mapTack of allValidMapTacks) {
            if (mapTack.type == constructible) {
                return true;
            }
        }
        // Check existing constructibles.
        const playerConstructibles = Players.get(GameContext.localPlayerID)?.Constructibles?.getConstructibles();
        for (const playerConstructible of playerConstructibles) {
            const constructDef = GameInfo.Constructibles.lookup(playerConstructible.type);
            if (constructDef.ConstructibleType == constructible) {
                return true;
            }
        }
        return false;
    }
}

const ConstructibleModifier = ConstructibleModifierSingleton.getInstance();
export { ConstructibleModifier as default };