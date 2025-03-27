
class TreeModifierSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!TreeModifierSingleton.singletonInstance) {
            TreeModifierSingleton.singletonInstance = new TreeModifierSingleton();
        }
        return TreeModifierSingleton.singletonInstance;
    }
    constructor() {
        // Map of: ModifierId => { node: TreeNodeType, requiredTrait: TraitType }
        this.modifierNode = {};
        // Map of: TraditionType => { node: TreeNodeType, requiredTrait: TraitType }
        this.traditionNode = {};

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheData();
    }
    cacheData() {
        this.modifierNode = {};
        for (const e of GameInfo.ProgressionTreeNodeUnlocks) {
            const obj = {
                node: e.ProgressionTreeNodeType,
                requiredTrait: e.RequiredTraitType
            };
            switch (e.TargetKind) {
                case "KIND_MODIFIER":
                    this.modifierNode[e.TargetType] = obj;
                    break;
                case "KIND_TRADITION":
                    this.traditionNode[e.TargetType] = obj;
                    break;
            }
        }
    }
    isModifierActive(modifierId) {
        const nodeType = this.modifierNode[modifierId]?.node;
        return this.isNodeUnlocked(nodeType);
    }
    isTraditionUnlocked(traditionType) {
        const nodeType = this.traditionNode[traditionType]?.node;
        return this.isNodeUnlocked(nodeType);
    }
    isNodeUnlocked(nodeType) {
        if (!nodeType) {
            return false;
        }
        const nodeState = Game.ProgressionTrees.getNodeState(GameContext.localPlayerID, nodeType);
        return nodeState == ProgressionTreeNodeState.NODE_STATE_FULLY_UNLOCKED;
    }
}

const TreeModifier = TreeModifierSingleton.getInstance();
export { TreeModifier as default };