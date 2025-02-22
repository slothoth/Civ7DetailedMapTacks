import Panel from '/core/ui/panel-support.js';
import { MustGetElement } from '/core/ui/utilities/utilities-dom.js';
import { InputEngineEventName } from '/core/ui/input/input-support.js';
import NavTray from '/core/ui/navigation-tray/model-navigation-tray.js';
import { Focus } from '/core/ui/input/focus-support.js';
import { getConstructibleEffectStrings, composeConstructibleDescription } from '/core/ui/utilities/utilities-core-textprovider.js';

class MapTackChooser extends Panel {
    constructor(root) {
        super(root);

        this.excludedConstructibles = [
            "BUILDING_PALACE", // Palace and City Hall falls under special map tacks.
            "BUILDING_CITY_HALL" // Palace and City Hall falls under special map tacks.
        ];
        this.dummyConstructibles = this.getDummyItems();
        this.sortedConstructibles = this.sortItems();
        this.itemList = null;
        this.cuurentAge = GameInfo.Ages.lookup(Game.age).AgeType;

        // Settings items (TBD)
        this.showAllItems = false;
        this.showYield = false;

        this.engineInputListener = (inputEvent) => { this.onEngineInput(inputEvent); };
        this.animateInType = this.animateOutType = 5 /* AnchorType.RelativeToLeft */;
        this.inputContext = InputContext.Dual;
        this.enableOpenSound = true;
        this.enableCloseSound = true;
    }
    onInitialize() {
        super.onInitialize();
        this.render();
    }
    render() {
        const subsystemPanel = MustGetElement("fxs-subsystem-frame", this.Root);
        subsystemPanel.addEventListener('subsystem-frame-close', () => { this.requestClose(null); });
        const sectionList = MustGetElement('.section-list', this.Root);
        sectionList.setAttribute('disable-focus-allowed', "true");
        this.populateItems(sectionList);
    }
    onAttach() {
        super.onAttach();
        this.Root.addEventListener(InputEngineEventName, this.engineInputListener);
    }
    onDetach() {
        this.Root.removeEventListener(InputEngineEventName, this.engineInputListener);
    }
    onReceiveFocus() {
        super.onReceiveFocus();
        const sectionList = MustGetElement('.section-list', this.Root);
        Focus.setContextAwareFocus(sectionList, this.Root);
        NavTray.clear();
        NavTray.addOrUpdateGenericBack();
    }
    onLoseFocus() {
        NavTray.clear();
        super.onLoseFocus();
    }
    requestClose(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        //This will call CM.pop() after the animation completes.
        super.close();
    }
    onEngineInput(inputEvent) {
        if (inputEvent.detail.status != InputActionStatuses.FINISH) {
            return;
        }
        if (inputEvent.isCancelInput() || inputEvent.detail.name == 'sys-menu') {
            this.requestClose(inputEvent);
        }
    }
    getDummyItems() {
        // Get dummy entries that won't even show up in Civilopedia.
        const items = new Set();
        if (GameInfo.CivilopediaPageExcludes) {
            GameInfo.CivilopediaPageExcludes.forEach((row) => {
                items.add(row.PageID);
            });
        }
        return [...items];
    }
    sortItems() {
        return [...GameInfo.Constructibles].sort((a, b) => {
            return a.Cost - b.Cost;
        });
    }
    populateItems(container) {
        // Clear all sections first.
        container.innerHTML = "";
        // Buildings
        const buildingSection = this.createSection("LOC_CONSTRUCTIBLE_CLASS_NAME_BUILDING", "BUILDING");
        container.appendChild(buildingSection);
        this.attachDivider(container);
        // Wonders
        const wonderSection = this.createSection("LOC_CONSTRUCTIBLE_CLASS_NAME_WONDER", "WONDER");
        container.appendChild(wonderSection);
        this.attachDivider(container);
        // Improvements
        const improvementSection = this.createSection("LOC_CONSTRUCTIBLE_CLASS_NAME_IMPROVEMENT", "IMPROVEMENT");
        container.appendChild(improvementSection);
        // Special tacks like city. (TODO more to come)
        const citySection = this.createSection("LOC_UI_RESOURCE_CITY", null, [
            GameInfo.Constructibles.lookup("BUILDING_CITY_HALL"),
            GameInfo.Constructibles.lookup("BUILDING_PALACE")
        ]);
        container.appendChild(citySection);
    }
    createSection(titleText, type, defs) {
        const sectionContainer = document.createElement("div");
        sectionContainer.classList.add("map-tack-chooser-section", "mb-1");
        // Title
        const title = document.createElement("fxs-header");
        title.setAttribute("title", titleText);
        title.setAttribute("filigree-style", "h4");
        title.classList.add("text-secondary", "uppercase", "font-title-sm");
        sectionContainer.appendChild(title);
        // Items
        const itemContainer = document.createElement("div");
        itemContainer.classList.add("map-tack-item-container");
        const itemsToCheck = type != null ? this.sortedConstructibles : defs;
        for (let itemDef of itemsToCheck) {
            if (type != null && type != itemDef.ConstructibleClass) {
                continue;
            }
            if (itemDef.Discovery == true) {
                continue;
            }
            const item = this.createItem(itemDef, type == null);
            if (item != null) {
                itemContainer.appendChild(item);
            }
        }
        sectionContainer.appendChild(itemContainer);
        return sectionContainer;
    }
    createItem(itemDef, skipExcludeCheck = false) {
        const type = itemDef.ConstructibleType;
        // Filter out constructibles that will be pulled out.
        if (!skipExcludeCheck && this.excludedConstructibles.includes(type)) {
            return;
        }
        // Filter out dummy constructibles.
        if (this.dummyConstructibles.includes(type)) {
            return;
        }
        // Filter out walls.
        if (itemDef.DistrictDefense && itemDef.ExistingDistrictOnly) {
            return;
        }
        // Filter out items that don't belong to this age based on a setting (TBD).
        if (this.showAllItems == false && itemDef.Age != null && itemDef.Age != this.cuurentAge) {
            return;
        }
        const iconWrapper = document.createElement("fxs-activatable");
        iconWrapper.classList.add("map-tack-icon-wrapper", "m-1");
        iconWrapper.setAttribute("data-tooltip-content", this.createItemTooltip(itemDef));
        iconWrapper.setAttribute("data-audio-press-ref", "data-audio-select-press");
        iconWrapper.addEventListener('action-activate', () => this.mapTackClickListener(type));
        const icon = document.createElement('fxs-icon');
        icon.classList.add("map-tack-icon", "size-10", "bg-contain", "bg-center", "bg-no-repeat");
        icon.setAttribute("data-icon-id", type);
        iconWrapper.appendChild(icon);
        return iconWrapper;
    }
    createItemTooltip(itemDef) {
        const container = document.createElement('fxs-tooltip');
        // Header
        const header = document.createElement('div');
        header.className = 'font-title text-secondary text-center uppercase tracking-100';
        header.setAttribute('data-l10n-id', itemDef.Name);
        // Production cost
        const productionCost = document.createElement('div');
        productionCost.innerHTML = Locale.stylize('LOC_UI_PRODUCTION_COST', itemDef.Cost);
        // Description
        const desc = document.createElement('div');
        if (itemDef.Tooltip) {
            desc.className = 'mt-1';
            desc.innerHTML = Locale.stylize(itemDef.Tooltip);
        }
        container.append(header, productionCost, desc);
        // Base yield and bonus
        const effectContainer = document.createElement('div');
        const { baseYield, adjacencies, effects } = getConstructibleEffectStrings(itemDef.ConstructibleType);
        const effectStrings = baseYield ? [baseYield, ...adjacencies, ...effects] : [...adjacencies, ...effects];
        const effectStr = Locale.compose(effectStrings.map(s => Locale.compose(s)).join('[N]'));
        if (effectStr) {
            this.attachDivider(container);
            effectContainer.innerHTML = Locale.stylize(effectStr);
        }
        container.append(effectContainer);
        return container.innerHTML;
    }
    attachDivider(container) {
        const divider = document.createElement("div");
        divider.classList.add("filigree-divider-inner-frame", "w-full");
        container.appendChild(divider);
    }
    mapTackClickListener(type) {
        console.error("DMT clicked on", type);
    }
}
Controls.define('dmt-map-tack-chooser', {
    createInstance: MapTackChooser,
    description: 'Map tack chooser screen.',
    styles: ['fs://game/detailed-map-tacks/ui/dmt/dmt-map-tack-chooser.css'],
    content: ['fs://game/detailed-map-tacks/ui/dmt/dmt-map-tack-chooser.html'],
    classNames: ['map-tack-chooser'],
    attributes: []
});