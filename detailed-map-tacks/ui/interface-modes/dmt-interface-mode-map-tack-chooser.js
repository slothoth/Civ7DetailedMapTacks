import { InterfaceMode, InterfaceModeChangedEventName } from '/core/ui/interface-modes/interface-modes.js';
import { MustGetElement } from '/core/ui/utilities/utilities-dom.js';
import LensManager from '/core/ui/lenses/lens-manager.js';
/**
 * Handler for DMT_INTERFACEMODE_MAP_TACK_CHOOSER.
 */
class MapTackChooserInterfaceMode {
    constructor() {
        this.interfaceModeChangedListener = this.onInterfaceModeChanged.bind(this);
    }
    transitionTo(_oldMode, _newMode, _context) {
        // When transitionTo is called, the currentInterfaceMode is changed but the view is not changed yet.
        // The ViewManager.setCurrentByName(view) is called after this method, and InterfaceModeChangedEvent is dispatched after view change.
        // Hence add a listener to the InterfaceModeChangedEvent and then perform view attachment.
        window.addEventListener(InterfaceModeChangedEventName, this.interfaceModeChangedListener);
        LensManager.setActiveLens("dmt-map-tack-lens");
        WorldUI.setUnitVisibility(false);
    }
    transitionFrom(_oldMode, _newMode) {
        window.removeEventListener(InterfaceModeChangedEventName, this.interfaceModeChangedListener);
        WorldUI.setUnitVisibility(true);
    }
    onInterfaceModeChanged() {
        // Currently in this mode.
        if (InterfaceMode.getCurrent() == "DMT_INTERFACEMODE_MAP_TACK_CHOOSER") {
            // Push the chooser to an element under "placement" template screen. Use parent of panel-place-building.
            // The default "fxs-popups" will be hidden when "placement" is the current screen view. 
            this.panel = document.querySelector("dmt-map-tack-chooser");
            if (!this.panel) {
                const parentElement = MustGetElement(".panel-place-building").parentElement;
                this.panel = document.createElement("dmt-map-tack-chooser");
                parentElement.appendChild(this.panel);
            }
        }
    }
    handleInput(inputEvent) {
        if (inputEvent.detail.status != InputActionStatuses.FINISH) {
            return true;
        }
        if (inputEvent.isCancelInput() || inputEvent.detail.name == 'sys-menu') {
            InterfaceMode.switchToDefault();
            inputEvent.stopPropagation();
            inputEvent.preventDefault();
            return false;
        }
        // Block mouse-left in plot click to exit.
        if (inputEvent.detail.name == 'mousebutton-left' || inputEvent.detail.name == 'accept') {
            inputEvent.stopPropagation();
            inputEvent.preventDefault();
            return false;
        }
        return true;
    }
}
InterfaceMode.addHandler('DMT_INTERFACEMODE_MAP_TACK_CHOOSER', new MapTackChooserInterfaceMode());