
class TraitModifierSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!TraitModifierSingleton.singletonInstance) {
            TraitModifierSingleton.singletonInstance = new TraitModifierSingleton();
        }
        return TraitModifierSingleton.singletonInstance;
    }
    constructor() {
        this.leaderTraits = [];
        this.civilizationTraits = [];
        this.modifiers = [];

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheData();
    }
    cacheData() {
        this.leaderTraits = [];
        this.civilizationTraits = [];
        this.modifiers = [];
        // Only cache for local player's traits.
        const player = Players.get(GameContext.localPlayerID);
        // Get leader traits.
        const leaderTypeIndex = player.leaderType;
        const leaderType = GameInfo.Leaders.lookup(leaderTypeIndex)?.LeaderType;
        // Get traits for the leader.
        for (const e of GameInfo.LeaderTraits) {
            if (e.LeaderType == leaderType) {
                this.leaderTraits.push(e.TraitType);
            }
        }
        // Get civilization traits.
        const civilizationTypeIndex = player.civilizationType;
        const civilizationType = GameInfo.Civilizations.lookup(civilizationTypeIndex)?.CivilizationType;
        // Get traits for the civilization.
        for (const e of GameInfo.CivilizationTraits) {
            if (e.CivilizationType == civilizationType) {
                this.civilizationTraits.push(e.TraitType);
            }
        }
        // Get modifiers for all traits.
        for (const e of GameInfo.TraitModifiers) {
            if (this.leaderTraits.includes(e.TraitType) || this.civilizationTraits.includes(e.TraitType)) {
                this.modifiers.push(e.ModifierId);
            }
        }
    }
    isModifierActive(modifierId) {
        return this.modifiers.includes(modifierId);
    }
    isTraitActive(traitType) {
        return this.leaderTraits.includes(traitType) || this.civilizationTraits.includes(traitType);
    }
}

const TraitModifier = TraitModifierSingleton.getInstance();
export { TraitModifier as default };