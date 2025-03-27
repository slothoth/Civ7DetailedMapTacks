
class TraditionModifierSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!TraditionModifierSingleton.singletonInstance) {
            TraditionModifierSingleton.singletonInstance = new TraditionModifierSingleton();
        }
        return TraditionModifierSingleton.singletonInstance;
    }
    constructor() {
        // Map of: ModifierId => [ traditionType1, traditionType2 ]
        this.modifierTradition = {};

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheData();
    }
    cacheData() {
        this.modifierTradition = {};
        for (const e of GameInfo.TraditionModifiers) {
            const current = this.modifierTradition[e.ModifierId] || [];
            current.push(e.TraditionType);
            this.modifierTradition[e.ModifierId] = current;
        }
    }
    isModifierActive(modifierId) {
        const traditions = this.modifierTradition[modifierId] || [];
        for (const t of traditions) {
            if (this.isTraditionActive(t)) {
                return true;
            }
        }
        return false;
    }
    isTraditionActive(traditionType) {
        const playerCulture = Players.get(GameContext.localPlayerID)?.Culture;
        if (!playerCulture) {
            return false;
        }
        const traditionHash = Database.makeHash(traditionType);
        return playerCulture.isTraditionActive(traditionHash);
    }
}

const TraditionModifier = TraditionModifierSingleton.getInstance();
export { TraditionModifier as default };