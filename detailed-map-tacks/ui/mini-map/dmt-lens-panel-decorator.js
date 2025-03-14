
export class DMT_LensPanelDecorator {

    constructor(component) {
        this.component = component;
    }

    beforeAttach() {
    }

    afterAttach() {
        this.component.createLayerCheckbox("LOC_DMT_MAP_TACKS", "dmt-map-tack-layer");
    }

    beforeDetach() {
    }

    afterDetach() {
    }
}

Controls.decorate('lens-panel', (component) => new DMT_LensPanelDecorator(component));