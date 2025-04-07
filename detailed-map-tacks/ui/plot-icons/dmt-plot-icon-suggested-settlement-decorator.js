import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';

export class DMT_PlotIconSuggestedSettlementDecorator {
    constructor(component) {
        this.componentRoot = component.Root;
    }
    beforeAttach() {
    }
    afterAttach() {
        // Block the pointer events for the suggested settlement icon when placing map tack.
        if (InterfaceMode.getCurrent() == "DMT_INTERFACEMODE_PLACE_MAP_TACKS") {
            this.componentRoot?.classList.remove("pointer-events-auto");
        } else {
            this.componentRoot?.classList.add("pointer-events-auto");
        }
    }
    beforeDetach() {
    }
    afterDetach() {
    }
}
Controls.decorate('plot-icon-suggested-settlement', (component) => new DMT_PlotIconSuggestedSettlementDecorator(component));