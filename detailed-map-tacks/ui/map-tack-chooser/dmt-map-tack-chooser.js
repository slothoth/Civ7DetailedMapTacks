import Panel from '/core/ui/panel-support.js';
import { InterfaceMode, InterfaceModeChangedEventName } from '/core/ui/interface-modes/interface-modes.js';
import { MustGetElement } from "/core/ui/utilities/utilities-dom.js";
import FocusManager from '/core/ui/input/focus-manager.js';
import { getConstructibleEffectStrings } from '/core/ui/utilities/utilities-core-textprovider.js';
import MapTackUtils, { ConstructibleClassType, YieldTypes } from '../map-tack-core/dmt-map-tack-utils.js';
import TraitModifier from '../map-tack-core/modifier/dmt-trait-modifier.js';
// Cache constructible icons for faster panel load.
Loading.runWhenFinished(() => {
    for (const c of GameInfo.Constructibles) {
        const url = UI.getIconURL(c.ConstructibleType, c.ConstructibleClass);
        Controls.preloadImage(url, 'dmt-map-tack-chooser');
    }
});
class MapTackChooser extends Panel {
    constructor(root) {
        super(root);

        this.uniqueBuildings = [];
        this.uniqueImprovements = [];
        this.excludedConstructibles = [
            "BUILDING_PALACE", // Palace and City Hall falls under special map tacks.
            "BUILDING_CITY_HALL", // Palace and City Hall falls under special map tacks.
        ];
        this.processUniqueConstructibles();
        this.dummyConstructibles = this.getDummyItems();
        this.itemList = null;
        this.currentAge = GameInfo.Ages.lookup(Game.age).AgeType;

        // Settings items (TBD)
        this.showYield = false;

        // UI related
        this.onInterfaceModeChanged = () => {
            if (InterfaceMode.getCurrent() == "DMT_INTERFACEMODE_MAP_TACK_CHOOSER") {
                FocusManager.setFocus(this.sectionList);
                this.setHidden(false);
            } else {
                this.setHidden(true);
            }
        };
        this.requestClose = this.onRequestClose.bind(this);
        this.animateInType = this.animateOutType = 5 /* AnchorType.RelativeToLeft */;
        this.enableOpenSound = true;
        this.enableCloseSound = true;
    }
    onInitialize() {
        super.onInitialize();
        this.render();
    }
    render() {
        this.panel = MustGetElement(".map-tack-chooser-panel", this.Root);
        this.sectionList = MustGetElement(".map-tack-chooser-section-list", this.Root);

        // Add items to documentFragment first for better performance.
        const fragment = document.createDocumentFragment();
        this.populateItems(fragment);
        this.sectionList.append(fragment);
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
    onReceiveFocus() {
        if (this.sectionList) {
            FocusManager.setFocus(this.sectionList);
        }
    }
    onRequestClose() {
        super.close();
        InterfaceMode.switchToDefault();
    }
    processUniqueConstructibles() {
        // Unique buildings
        for (const e of GameInfo.Buildings) {
            if (e.TraitType) {
                if (TraitModifier.isTraitActive(e.TraitType)) {
                    this.uniqueBuildings.push(e.ConstructibleType);
                }
                if (e.TraitType != "TRAIT_LEADER_MINOR_CIV") {
                    this.excludedConstructibles.push(e.ConstructibleType);
                }
            }
        }
        // Unique improvements
        for (const e of GameInfo.Improvements) {
            if (e.TraitType) {
                if (TraitModifier.isTraitActive(e.TraitType)) {
                    this.uniqueImprovements.push(e.ConstructibleType);
                }
                if (e.TraitType != "TRAIT_LEADER_MINOR_CIV") {
                    this.excludedConstructibles.push(e.ConstructibleType);
                }
            }
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
    sortItems(filteredItemDefs) {
        return filteredItemDefs.sort((a, b) => {
            if (a.ConstructibleClass == ConstructibleClassType.BUILDING && b.ConstructibleClass == ConstructibleClassType.BUILDING) {
                // Sort by yield type for buildings.
                const aYieldType = MapTackUtils.getConstructibleDominantYieldType(a.ConstructibleType);
                const bYieldType = MapTackUtils.getConstructibleDominantYieldType(b.ConstructibleType);
                const yieldTypeDiff = YieldTypes.indexOf(aYieldType) - YieldTypes.indexOf(bYieldType);
                if (yieldTypeDiff != 0) {
                    return yieldTypeDiff;
                }
            }
            // Sort by cost by default.
            return a.Cost - b.Cost;
        });
    }
    populateItems(container) {
        // Clear all sections first.
        container.innerHTML = "";
        // Special tacks like city. (TODO more to come)
        const citySection = this.createSection("LOC_UI_RESOURCE_CITY", null, [
            GameInfo.Constructibles.lookup("BUILDING_CITY_HALL"),
            GameInfo.Constructibles.lookup("BUILDING_PALACE")
        ]);
        container.appendChild(citySection);
        this.attachDivider(container);
        // Buildings
        const uniqueBuildingDefs = this.uniqueBuildings?.map(type => GameInfo.Constructibles.lookup(type)) || [];
        const buildingSection = this.createSection("LOC_CONSTRUCTIBLE_CLASS_NAME_BUILDING", "BUILDING", uniqueBuildingDefs);
        container.appendChild(buildingSection);
        this.attachDivider(container);
        // Wonders
        const wonderSection = this.createSection("LOC_CONSTRUCTIBLE_CLASS_NAME_WONDER", "WONDER");
        container.appendChild(wonderSection);
        this.attachDivider(container);
        // Improvements
        const uniqueImprovementDefs = this.uniqueImprovements?.map(type => GameInfo.Constructibles.lookup(type)) || [];
        const improvementSection = this.createSection("LOC_CONSTRUCTIBLE_CLASS_NAME_IMPROVEMENT", "IMPROVEMENT", uniqueImprovementDefs);
        container.appendChild(improvementSection);
    }
    createSection(titleText, type, pinnedDefs = []) {
        const sectionContainer = document.createElement("div");
        sectionContainer.classList.add("map-tack-chooser-section", "mb-1");
        // Title
        const title = document.createElement("fxs-header");
        title.setAttribute("title", titleText);
        title.setAttribute("filigree-style", "h4");
        title.classList.add("text-secondary", "uppercase", "font-title-sm");
        sectionContainer.appendChild(title);
        // Pinned items
        if (pinnedDefs.length > 0) {
            const pinnedItemContainer = document.createElement("div");
            pinnedItemContainer.classList.add("map-tack-item-container", "mb-1");
            for (let itemDef of pinnedDefs) {
                const item = this.createItem(itemDef, true);
                if (item != null) {
                    pinnedItemContainer.appendChild(item);
                }
            }
            sectionContainer.appendChild(pinnedItemContainer);
        }
        // Items
        if (type != null) {
            const itemContainer = document.createElement("div");
            itemContainer.classList.add("map-tack-item-container");
            const filteredItemDefs = [];
            for (const itemDef of GameInfo.Constructibles) {
                if (type != null && type != itemDef.ConstructibleClass) {
                    continue;
                }
                if (itemDef.Discovery == true) {
                    continue;
                }
                filteredItemDefs.push(itemDef);
            }
            const sortedItemDefs = this.sortItems(filteredItemDefs);
            for (const itemDef of sortedItemDefs) {
                const item = this.createItem(itemDef, false);
                if (item != null) {
                    itemContainer.appendChild(item);
                }
            }
            sectionContainer.appendChild(itemContainer);
        }
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
        // Filter out items that don't belong to this age.
        if (itemDef.Age != null && itemDef.Age != this.currentAge) {
            return;
        }

        const iconWrapper = document.createElement("fxs-activatable");
        const iconStyles = MapTackUtils.getMapTackIconStyles(type, itemDef.ConstructibleClass);
        iconWrapper.classList.add("m-1\\.5", "size-12", "map-tack-icon-wrapper", ...iconStyles);
        iconWrapper.setAttribute("data-tooltip-content", this.createItemTooltip(itemDef));
        iconWrapper.setAttribute("data-audio-press-ref", "data-audio-select-press");
        iconWrapper.addEventListener('action-activate', () => this.mapTackClickListener(type));
        const icon = document.createElement('fxs-icon');
        icon.classList.add("size-12");
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
        container.append(header, productionCost);
        // Description
        if (itemDef.Tooltip) {
            const desc = document.createElement('div');
            desc.className = 'mt-1';
            desc.innerHTML = Locale.stylize(itemDef.Tooltip);
            container.append(desc);
        }
        // Base yield and bonus
        const { baseYield, adjacencies, effects } = getConstructibleEffectStrings(itemDef.ConstructibleType);
        const effectStrings = baseYield ? [baseYield, ...adjacencies, ...effects] : [...adjacencies, ...effects];
        const effectStr = Locale.stylize(effectStrings.map(s => Locale.compose(s)).join('[N]'));
        if (effectStr) {
            this.attachDivider(container);
            const effectContainer = document.createElement('div');
            effectContainer.innerHTML = effectStr;
            container.append(effectContainer);
        }
        return container.innerHTML;
    }
    attachDivider(container) {
        const divider = document.createElement("div");
        divider.classList.add("filigree-divider-inner-frame", "w-full");
        container.appendChild(divider);
    }
    mapTackClickListener(clickedType) {
        InterfaceMode.switchTo("DMT_INTERFACEMODE_PLACE_MAP_TACKS", { type: clickedType });
    }
}
Controls.define('dmt-map-tack-chooser', {
    createInstance: MapTackChooser,
    description: 'Map tack chooser screen.',
    styles: ['fs://game/detailed-map-tacks/ui/map-tack-chooser/dmt-map-tack-chooser.css'],
    content: ['fs://game/detailed-map-tacks/ui/map-tack-chooser/dmt-map-tack-chooser.html'],
    classNames: ['map-tack-chooser'],
    attributes: []
});
