
class ModifierRequirementSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!ModifierRequirementSingleton.singletonInstance) {
            ModifierRequirementSingleton.singletonInstance = new ModifierRequirementSingleton();
        }
        return ModifierRequirementSingleton.singletonInstance;
    }
    constructor() {
        // Map of: RequirementSetId => [ RequirementId1, RequirementId2 ]
        this.requirementSetRequirement = {};

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheData();
    }
    cacheData() {
        this.requirementSetRequirement = {};
        for (const e of GameInfo.RequirementSetRequirements) {
            const current = this.requirementSetRequirement[e.RequirementSetId] || [];
            current.push(e.RequirementId);
            this.requirementSetRequirement[e.RequirementSetId] = current;
        }
    }
    isModifierRequirementMet(modifierId) {
        // Check if the modifier has requirements
        const modifierDef = GameInfo.Modifiers.lookup(modifierId);
        return this.isRequirementSetMet(modifierDef?.OwnerRequirementSetId)
            && this.isRequirementSetMet(modifierDef?.SubjectRequirementSetId);
    }
    isRequirementSetMet(requirementSetId) {
        if (requirementSetId == null) {
            return true;
        }
        const requirementSetType = GameInfo.RequirementSets.lookup(requirementSetId)?.RequirementSetType;
        const requirements = this.requirementSetRequirement[requirementSetId];
        if (requirementSetType == "REQUIREMENTSET_TEST_ALL") {
            return requirements.every(requirementId => this.isRequirementMet(requirementId));
        } else if (requirementSetType == "REQUIREMENTSET_TEST_ANY") {
            return requirements.some(requirementId => this.isRequirementMet(requirementId));
        }
        return false;
    }
    isRequirementMet(requirementId) {
        // Skip certain requirement type check.
        const requirementType = GameInfo.Requirements.lookup(requirementId)?.RequirementType;
        switch (requirementType) {
            case "REQUIREMENT_WONDER_IS_ACTIVE":
                // Always assume the wonder is active.
                return true;
        }
        return false;
    }
}

const ModifierRequirement = ModifierRequirementSingleton.getInstance();
export { ModifierRequirement as default };