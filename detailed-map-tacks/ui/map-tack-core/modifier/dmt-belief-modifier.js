
class BeliefModifierSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!BeliefModifierSingleton.singletonInstance) {
            BeliefModifierSingleton.singletonInstance = new BeliefModifierSingleton();
        }
        return BeliefModifierSingleton.singletonInstance;
    }
    constructor() {
        // Map of: ModifierId => [ beliefType1, beliefType2 ]
        this.modifierBelief = {};
        // Map of: AttachedModifierId => ModifierId
        this.attachedModifier = {};

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheData();
    }
    cacheData() {
        this.modifierBelief = {};
        for (const e of GameInfo.BeliefModifiers) {
            const current = this.modifierBelief[e.ModifierID] || [];
            current.push(e.BeliefType);
            this.modifierBelief[e.ModifierID] = current;
        }
        this.attachedModifier = {};
        for (const e of GameInfo.ModifierArguments) {
            // Belief modifiers are applied through EFFECT_ATTACH_MODIFIERS, so looking through ModifierArguments.
            if (e.Name == "ModifierId") {
                // Only cache belief related ones for now.
                if (this.modifierBelief[e.ModifierId]) {
                    this.attachedModifier[e.Value] = e.ModifierId;
                }
            }
        }
    }
    isModifierActive(modifierId) {
        const beliefModifierId = this.attachedModifier[modifierId];
        if (beliefModifierId) {
            const beliefTypes = this.modifierBelief[beliefModifierId] || [];
            for (const beliefType of beliefTypes) {
                if (this.isBeliefActive(beliefType)) {
                    return true;
                }
            }
        }
        return false;
    }
    isBeliefActive(beliefType) {
        const playerReligion = Players.get(GameContext.localPlayerID)?.Religion;
        if (!playerReligion) {
            return false;
        }
        const playerBeliefs = [...(playerReligion.getPantheons() || []), ...(playerReligion.getBeliefs() || [])];
        for (const belief of playerBeliefs) {
            if (beliefType == GameInfo.Beliefs.lookup(belief)?.BeliefType) {
                return true;
            }
        }
        return false;
    }
}

const BeliefModifier = BeliefModifierSingleton.getInstance();
export { BeliefModifier as default };