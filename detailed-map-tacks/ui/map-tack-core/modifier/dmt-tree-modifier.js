
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
        // Map of: ModifierId => [ node: TreeNodeType, ...]
        this.modifierNode = {};
        // Map of: TraditionType => [ node: TreeNodeType, ...]
        this.traditionNode = {};
        // Map of: ConstructibleType => [ node: TreeNodeType, ...]
        this.constructibleNode = {};

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.cacheData();
    }
    cacheData() {
        this.modifierNode = {};
        for (const e of GameInfo.ProgressionTreeNodeUnlocks) {
            let nodeMap;
            switch (e.TargetKind) {
                case "KIND_MODIFIER":
                    nodeMap = this.modifierNode;
                    break;
                case "KIND_TRADITION":
                    nodeMap = this.traditionNode;
                    break;
                case "KIND_CONSTRUCTIBLE":
                    nodeMap = this.constructibleNode;
                    break;
            }
            if (nodeMap) {
                const current = nodeMap[e.TargetType] || [];
                current.push(e.ProgressionTreeNodeType);
                nodeMap[e.TargetType] = current;
            }
        }
    }
    isModifierActive(modifierId) {
        const nodeTypes = this.modifierNode[modifierId] || [];
        return nodeTypes.some(nodeType => this.isNodeUnlocked(nodeType));
    }
    isTraditionUnlocked(traditionType) {
        const nodeTypes = this.traditionNode[traditionType] || [];
        return nodeTypes.some(nodeType => this.isNodeUnlocked(nodeType));
    }
    isConstructibleUnlocked(constructibleType) {
        const nodeTypes = this.constructibleNode[constructibleType] || [];
        return nodeTypes.some(nodeType => this.isNodeUnlocked(nodeType));
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