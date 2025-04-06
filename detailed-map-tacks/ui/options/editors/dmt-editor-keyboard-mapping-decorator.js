
export class DMT_EditorKeyboardMappingDecorator {

    constructor(component) {
        this.component = component;
    }

    beforeAttach() {
        this.addAction("open-map-tack-panel", InputContext.World);
        this.addAction("toggle-map-tack-layer", InputContext.World);
    }

    afterAttach() {
    }

    beforeDetach() {
    }

    afterDetach() {
    }
    // Taken from original addActionsForContext function.
    addAction(actionIdString, inputContext) {
        const actionId = Input.getActionIdByName(actionIdString);
        if (!actionId) {
            return;
        }
        if (this.component.mappingDataMap.has(actionId)) {
            // This action has already been added. Skip it!
            return;
        }
        if (!Input.hasGesture(actionId, 0, inputContext) && !Input.hasGesture(actionId, 1, inputContext)) {
            // This action has no gestures in this context. Skip it!
            return;
        }
        this.component.actionContainer.appendChild(this.component.createActionEntry(actionId, inputContext));
    }
}

Controls.decorate('editor-keyboard-mapping', (component) => new DMT_EditorKeyboardMappingDecorator(component));