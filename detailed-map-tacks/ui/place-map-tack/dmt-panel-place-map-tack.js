import { InterfaceMode, InterfaceModeChangedEventName } from '/core/ui/interface-modes/interface-modes.js';
import { MustGetElement } from "/core/ui/utilities/utilities-dom.js";
import Panel from '/core/ui/panel-support.js';
import MapTackUIUtils from '../map-tack-core/dmt-map-tack-ui-utils.js';
import MapTackGenerics from '../map-tack-core/dmt-map-tack-generics.js';

class PlaceMapTackPanel extends Panel {
    constructor(root) {
        super(root);
        // UI related
        this.onInterfaceModeChanged = () => {
            if (InterfaceMode.getCurrent() == "DMT_INTERFACEMODE_PLACE_MAP_TACKS") {
                this.setHidden(false);
            } else {
                this.setHidden(true);
            }
        };
        this.requestClose = this.onRequestClose.bind(this);
        this.animateInType = this.animateOutType = 5 /* AnchorType.RelativeToLeft */;
    }
    onInitialize() {
        super.onInitialize();
        this.render();
    }
    render() {
        this.Root.setAttribute("tabindex", "-1");
        this.panel = MustGetElement(".panel-place-map-tack-panel", this.Root);
    }
    setHidden(hidden) {
        this.panel.classList.toggle("animate-in-left", !hidden);
        this.Root.classList.toggle("hidden", hidden);
    }
    onAttach() {
        super.onAttach();
        window.addEventListener(InterfaceModeChangedEventName, this.onInterfaceModeChanged);
        this.panel.addEventListener('subsystem-frame-close', this.requestClose);
    }
    onDetach() {
        window.removeEventListener(InterfaceModeChangedEventName, this.onInterfaceModeChanged);
        this.panel.removeEventListener('subsystem-frame-close', this.requestClose);
        super.onDetach();
    }
    onAttributeChanged(name, oldValue, newValue) {
        switch (name) {
            case 'item-type':
                this.populateItemDetails(newValue);
                break;
            case 'placement-details':
                if (oldValue != newValue) {
                    this.updatePlacementDetails(newValue);
                }
                break;
            default:
                break;
        }
    }
    onReceiveFocus() {
    }
    onRequestClose() {
        super.close();
        InterfaceMode.switchTo("DMT_INTERFACEMODE_MAP_TACK_CHOOSER");
    }
    populateItemDetails(type) {
        if (MapTackGenerics.isGenericMapTack(type)) {
            this.populateItemDetailsHelper(type, MapTackGenerics.getName(type), MapTackGenerics.getTooltipString(type));
        } else if (type.includes(',')) {
            this.populateQuarterDetailsHelper(type);
        }
        else {
            const itemDef = GameInfo.Constructibles.lookup(type);
            this.populateItemDetailsHelper(type, itemDef.Name, itemDef.Tooltip);
        }
    }
    populateItemDetailsHelper(type, name, tooltip) {
        // Title
        const header = this.panel.querySelector("#panel-place-map-tack-name");
        header.setAttribute('data-l10n-id', name);
        // Icon
        const icon = this.panel.querySelector("#panel-place-map-tack-icon");
        icon.style.backgroundImage = MapTackUIUtils.getMapTackIconBgImage(type);
        // Description
        const desc = this.panel.querySelector("#panel-place-map-tack-desc");
        if (tooltip) {
            desc.innerHTML = Locale.stylize(tooltip);
            desc.classList.remove("hidden");
        } else {
            desc.classList.add("hidden");
        }
        // Effects
        const { baseYield, adjacencies, effects } = MapTackUIUtils.getEffectStrings(type);
        const effectStrings = baseYield ? [baseYield, ...adjacencies, ...effects] : [...adjacencies, ...effects];
        const effectStr = Locale.compose(effectStrings.map(s => Locale.compose(s)).join('[N]'));
        const effectsContainer = this.panel.querySelector("#panel-place-map-tack-effects");
        if (effectStr) {
            effectsContainer.innerHTML = Locale.stylize(effectStr);
            effectsContainer.classList.remove("hidden");
        } else {
            effectsContainer.innerHTML = "";
            effectsContainer.classList.add("hidden");
        }
    }

    populateQuarterDetailsHelper(type) {
        let agg_name = ''
        let agg_tooltip = ''
        let effectStrings
        const itemList = type.split(',');
        for (const e of itemList) {
            agg_name = agg_name + MapTackGenerics.getName(e)
            agg_tooltip = agg_tooltip + MapTackGenerics.getTooltipString(e)
            const { baseYield, adjacencies, effects } = MapTackUIUtils.getEffectStrings(type);
            effectStrings = baseYield ? [baseYield, ...adjacencies, ...effects] : [...adjacencies, ...effects];
        }

        // Title
        const header = this.panel.querySelector("#panel-place-map-tack-name");
        header.setAttribute('data-l10n-id', name);
        // Icon
        const icon = this.panel.querySelector("#panel-place-map-tack-icon");
        icon.style.backgroundImage = MapTackUIUtils.getMapTackIconBgImage('DMT_BUILDING_UNIQUE_QUARTER');
        // Description
        const desc = this.panel.querySelector("#panel-place-map-tack-desc");
        if (agg_tooltip !== '') {
            desc.innerHTML = Locale.stylize(agg_tooltip);
            desc.classList.remove("hidden");
        } else {
            desc.classList.add("hidden");
        }
        // Effects
        const effectStr = Locale.compose(effectStrings.map(s => Locale.compose(s)).join('[N]'));
        const effectsContainer = this.panel.querySelector("#panel-place-map-tack-effects");
        if (effectStr) {
            effectsContainer.innerHTML = Locale.stylize(effectStr);
            effectsContainer.classList.remove("hidden");
        } else {
            effectsContainer.innerHTML = "";
            effectsContainer.classList.add("hidden");
        }
    }

    updatePlacementDetails(placementDetailsStr) {
        let hasContent = false;
        const placementDetailsContainer = this.panel.querySelector("#panel-place-map-tack-placement-details-container");
        const placementDetails = JSON.parse(placementDetailsStr);
        if (placementDetails) {
            // Update yield details.
            let hasYieldDetails = false;
            const yieldDetailsContainer = this.panel.querySelector("#panel-place-map-tack-yield-details");
            const yieldDetails = placementDetails.yieldDetails;
            if (yieldDetails) {
                yieldDetailsContainer.innerHTML = MapTackUIUtils.getYieldFragment(yieldDetails, false).innerHTML;
                hasYieldDetails = yieldDetailsContainer.innerHTML != "";
            }
            yieldDetailsContainer.classList.toggle("hidden", !hasYieldDetails);
            hasContent = hasContent || hasYieldDetails;
            // Update valid status.
            let hasValidStatus = false;
            const validStatusContainer = this.panel.querySelector("#panel-place-map-tack-valid-status");
            const validStatus = placementDetails.validStatus;
            if (validStatus.isValid == false && validStatus.reasons.length > 0) {
                const validStatusStr = validStatus.reasons.map(s => `[LI] ${Locale.compose(s)}`).join("");
                validStatusContainer.innerHTML = Locale.stylize(`[BLIST]${validStatusStr}[/LIST]`);
                hasValidStatus = true;
            }
            validStatusContainer.classList.toggle("hidden", !hasValidStatus);
            hasContent = hasContent || hasValidStatus;
            // Divider between
            const divider = this.panel.querySelector("#panel-place-map-tack-placement-details-divider");
            divider.classList.toggle("hidden", !hasYieldDetails || !hasValidStatus);
        }
        placementDetailsContainer.classList.toggle("hidden", !hasContent);
    }
}
Controls.define('dmt-panel-place-map-tack', {
    createInstance: PlaceMapTackPanel,
    description: 'Place map tack panel.',
    styles: ['fs://game/detailed-map-tacks/ui/place-map-tack/dmt-panel-place-map-tack.css'],
    content: ['fs://game/detailed-map-tacks/ui/place-map-tack/dmt-panel-place-map-tack.html'],
    classNames: ['panel-place-map-tack'],
    attributes: [
        { name: 'item-type' },
        { name: 'placement-details' },
    ]
});
