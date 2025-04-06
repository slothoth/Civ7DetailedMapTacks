import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';

export class DMT_PlotIconSuggestedSettlementDecorator {
    constructor(component) {
        this.componentRoot = component.Root;
    }
    beforeAttach() {
    }
    afterAttach() {
        if (InterfaceMode.getCurrent() == "DMT_INTERFACEMODE_PLACE_MAP_TACKS") {
            // Block the pointer events for the suggested settlement icon when placing map tack.
            if (this.componentRoot?.classList.contains("pointer-events-auto") ) {
                this.componentRoot.classList.remove("pointer-events-auto");
            }
        } else {
            if (!this.componentRoot?.classList.contains("pointer-events-auto") ) {
                this.componentRoot.classList.add("pointer-events-auto");
            }
        }
    }
    beforeDetach() {
    }
    afterDetach() {
    }
}
Controls.decorate('plot-icon-suggested-settlement', (component) => new DMT_PlotIconSuggestedSettlementDecorator(component));