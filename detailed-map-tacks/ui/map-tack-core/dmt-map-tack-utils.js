
import MapTackStore from './dmt-map-tack-store.js';

export const YieldTypes = [
    "YIELD_UNKNOWN",
    "YIELD_FOOD",
    "YIELD_PRODUCTION",
    "YIELD_GOLD",
    "YIELD_SCIENCE",
    "YIELD_CULTURE",
    "YIELD_HAPPINESS",
    "YIELD_DIPLOMACY"
];
const YieldClassNames = new Map([
    ["YIELD_FOOD", "food"],
    ["YIELD_PRODUCTION", "production"],
    ["YIELD_GOLD", "gold"],
    ["YIELD_SCIENCE", "science"],
    ["YIELD_CULTURE", "culture"],
    ["YIELD_HAPPINESS", "happiness"],
    ["YIELD_DIPLOMACY", "diplomacy"]
]);
export const DirectionNames = new Map([
    [DirectionTypes.DIRECTION_EAST, "LOC_WORLD_DIRECTION_EAST"],
    [DirectionTypes.DIRECTION_NORTHEAST, "LOC_WORLD_DIRECTION_NORTHEAST"],
    [DirectionTypes.DIRECTION_NORTHWEST, "LOC_WORLD_DIRECTION_NORTHWEST"],
    [DirectionTypes.DIRECTION_SOUTHEAST, "LOC_WORLD_DIRECTION_SOUTHEAST"],
    [DirectionTypes.DIRECTION_SOUTHWEST, "LOC_WORLD_DIRECTION_SOUTHWEST"],
    [DirectionTypes.DIRECTION_WEST, "LOC_WORLD_DIRECTION_WEST"]
]);
export const ConstructibleClassType = Object.freeze({
    WONDER: "WONDER",
    BUILDING: "BUILDING",
    IMPROVEMENT: "IMPROVEMENT"
});
export const QuarterType = {
    NO_QUARTER: 0,
    NORMAL_QUARTER: 1
    // More to be added in populateQuarterTypes
};
class MapTackUtilsSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!MapTackUtilsSingleton.singletonInstance) {
            MapTackUtilsSingleton.singletonInstance = new MapTackUtilsSingleton();
        }
        return MapTackUtilsSingleton.singletonInstance;
    }
    constructor() {
        // Plot details cache related.
        this.cachedPlotDetails = {};
        this.usePlotDetailsCache = false;
        // Yield changes - BUILDING_PALACE => [{type: YIELD_FOOD, amount: 5}, {type: YIELD_HAPPINESS, amount: 5}, {type: YIELD_PRODUCTION, amount: 5}]
        this.constructibleYieldChanges = {};
        // Type tags - BUILDING_PALACE => [GREATWORK, AGELESS, PERSISTENT]
        this.constructibleTypeTags = {};

        this.currentAge = GameInfo.Ages.lookup(Game.age).AgeType;

        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
        this.populateQuarterTypes();
        this.cacheTypeTags();
        this.cacheYieldChanges();
    }
    populateQuarterTypes() {
        let index = 2;
        for (const itemRef of GameInfo.UniqueQuarters) {
            QuarterType[itemRef.UniqueQuarterType] = index;
            index++;
        }
    }
    cacheTypeTags() {
        this.constructibleTypeTags = {};
        for (const e of GameInfo.TypeTags) {
            if (GameInfo.Constructibles.lookup(e.Type)) {
                // Only cache for constructibles
                const current = this.constructibleTypeTags[e.Type] || [];
                current.push(e.Tag);
                this.constructibleTypeTags[e.Type] = current;
            }
        }
    }
    cacheYieldChanges() {
        this.constructibleYieldChanges = {};
        for (const e of GameInfo.Constructible_YieldChanges) {
            const current = this.constructibleYieldChanges[e.ConstructibleType] || [];
            current.push({
                type: e.YieldType,
                amount: e.YieldChange
            });
            this.constructibleYieldChanges[e.ConstructibleType] = current;
        }
    }
    hasTag(constructibleType, tag) {
        const tags = this.constructibleTypeTags[constructibleType];
        return tags && tags.includes(tag);
    }
    isFullTile(type) {
        // Full tile buildings check.
        if (this.hasTag(type, "FULL_TILE")) {
            return true;
        }
        // Wonders check.
        const itemRef = GameInfo.Constructibles.lookup(type);
        if (itemRef) {
            if (itemRef.ConstructibleClass == ConstructibleClassType.WONDER) {
                return true;
            }
        }
        return false;
    }
    isAgeless(type) {
        return this.hasTag(type, "AGELESS");
    }
    isCurrentAge(type) {
        const itemRef = GameInfo.Constructibles.lookup(type);
        return itemRef.Age == GameInfo.Ages.lookup(Game.age).AgeType;
    }
    isObsolete(type) {
        const itemRef = GameInfo.Constructibles.lookup(type);
        return itemRef.Age && itemRef.Age != GameInfo.Ages.lookup(Game.age).AgeType;
    }
    getAdjacentPlots(x, y) {
        const plots = [];
        for (const direction of DirectionNames.keys()) {
            const plot = GameplayMap.getAdjacentPlotLocation({x, y}, direction);
            plots.push({ direction: direction, plot: plot });
        }
        return plots;
    }
    getAdjacentPlotDetails(x, y) {
        const plotDetails = [];
        for (const direction of DirectionNames.keys()) {
            const adjPlot = GameplayMap.getAdjacentPlotLocation({x, y}, direction);
            plotDetails.push({
                direction: direction,
                details: this.getRealizedPlotDetails(adjPlot.x, adjPlot.y)
            });
        }
        return plotDetails;
    }
    getAdjacentMapTackStructs(x, y, includeSelf = true) {
        const mapTacks = [];
        if (includeSelf) {
            mapTacks.push({
                x: x,
                y: y,
                mapTackList: MapTackStore.retrieveMapTacks(x, y)
            });
        }
        for (const direction of DirectionNames.keys()) {
            const adjPlot = GameplayMap.getAdjacentPlotLocation({x, y}, direction);
            mapTacks.push({
                x: adjPlot.x,
                y: adjPlot.y,
                mapTackList: MapTackStore.retrieveMapTacks(adjPlot.x, adjPlot.y)
            });
        }
        return mapTacks;
    }
    getValidMapTacks(x, y) {
        return MapTackStore.retrieveMapTacks(x, y)
            .filter(m => m.validStatus?.isValid);
    }
    getAllValidMapTacks() {
        return MapTackStore.getCachedMapTackStructs()
            .map(s => s.mapTackList)
            .flat()
            .filter(m => m.validStatus?.isValid);
    }
    togglePlotDetailsCache(useCache) {
        this.usePlotDetailsCache = useCache;
        this.cachedPlotDetails = {};
    }
    getCacheKey(x, y) {
        return `${x}-${y}`;
    }
    /**
     * @param {int} x 
     * @param {int} y 
     * @returns an object with these fields:
     *      biome: Biome on this plot. e.g. Grassland, Desert.
     *      terrain: Terrain of this plot.
     *      feature: Feature of this plot.
     *      resource: Resource on this plot.
     *      constructibles: Constructibles on this plot, including both map tacks and already placed constructibles.
     *      district: DistrictType of this plot. DISTRICT_CITY_CENTER, DISTRICT_URBAN, DISTRICT_WONDER, DISTRICT_RURAL, DISTRICT_WILDERNESS.
     *      isLake: Is this plot a lake or not.
     *      isNaturalWonder: Is this plot a natural wonder or not.
     *      isRiver: Does this plot have a river or not.
     *      quarterType: QuarterType of this plot.
     */
    getRealizedPlotDetails(x, y) {
        // Try reading from cache.
        if (this.usePlotDetailsCache) {
            const cacheKey = this.getCacheKey(x, y);
            const plotDetails = this.cachedPlotDetails[cacheKey];
            if (plotDetails) {
                return plotDetails;
            }
        }

        const details = {};

        // Only take valid map tacks into consideration.
        const validMapTacks = this.getValidMapTacks(x, y);

        const isPlotVisible = GameplayMap.getRevealedState(GameContext.localPlayerID, x, y) != RevealedStates.HIDDEN;
        if (isPlotVisible) {
            // Biome
            const biomeIndex = GameplayMap.getBiomeType(x, y);
            const biomeDef = GameInfo.Biomes.lookup(biomeIndex);
            details["biome"] = biomeDef?.BiomeType;
            // Terrain
            const terrainIndex = GameplayMap.getTerrainType(x, y);
            const terrainDef = GameInfo.Terrains.lookup(terrainIndex);
            details["terrain"] = terrainDef?.TerrainType;
            // Feature
            const featureIndex = GameplayMap.getFeatureType(x, y);
            if (featureIndex != FeatureTypes.NO_FEATURE) {
                const featureDef = GameInfo.Features.lookup(featureIndex);
                details["feature"] = featureDef?.FeatureType;
            }
            // Resource
            const resourceIndex = GameplayMap.getResourceType(x, y);
            if (resourceIndex != ResourceTypes.NO_RESOURCE) {
                const resourceDef = GameInfo.Resources.lookup(resourceIndex);
                details["resource"] = resourceDef?.ResourceType;
            }
            // Constructibles
            const canOverrideImprovement = validMapTacks.some(m => 
                (m.classType == ConstructibleClassType.BUILDING || m.classType == ConstructibleClassType.WONDER));
            const buildingSet = new Set();
            const improvementSet = new Set();
            // Get already placed constructibles on this plot.
            const constructibles = this.getConstructiblesAtPlot(x, y);
            for (const constructible of constructibles) {
                if (constructible.classType == ConstructibleClassType.WONDER) {
                    // If there's already a wonder, this plot will only have this constructible
                    details["constructibles"] = [constructible.type];
                } else if (constructible.classType == ConstructibleClassType.BUILDING) {
                    buildingSet.add(constructible.type);
                } else if (constructible.classType == ConstructibleClassType.IMPROVEMENT) {
                    if (!canOverrideImprovement) {
                        // Only add improvement if map tack will not override improvement.
                        improvementSet.add(constructible.type);
                    }
                }
            }
            // If already has placed buildings or map tack will override improvements, populate buildings from map tack.
            if (buildingSet.size > 0 || canOverrideImprovement) {
                for (const mapTack of validMapTacks) {
                    if (mapTack.classType == ConstructibleClassType.BUILDING || mapTack.classType == ConstructibleClassType.WONDER) {
                        buildingSet.add(mapTack.type);
                    }
                }
                details["constructibles"] = [...buildingSet];
            } else {
                // All improvements only.
                for (const mapTack of validMapTacks) {
                    if (mapTack.classType == ConstructibleClassType.IMPROVEMENT) {
                        improvementSet.add(mapTack.type);
                    }
                }
                details["constructibles"] = [...improvementSet];
            }
        } else {
            // Plot not visible, only add map tacks.
            details["constructibles"] = validMapTacks.map(m => m.type);
        }
        // District
        details["district"] = this.getRealizedDistrictType(x, y, validMapTacks);
        // Other misc
        details["isLake"] = GameplayMap.isLake(x, y);
        details["isNaturalWonder"] = GameplayMap.isNaturalWonder(x, y);
        details["isRiver"] = GameplayMap.isRiver(x, y);
        details["quarterType"] = this.getQuarterType(details["constructibles"]);

        if (this.usePlotDetailsCache) {
            const cacheKey = this.getCacheKey(x, y);
            this.cachedPlotDetails[cacheKey] = details;
        }

        return details;
    }
    getRealizedDistrictType(x, y, validMapTacks = null) {
        if (validMapTacks == null) {
            validMapTacks = this.getValidMapTacks(x, y);
        }
        let hasBuilding = false;
        let hasImprovement = false;
        // Check for existing district.
        const district = Districts.getAtLocation({x, y});
        if (district) {
            switch (district.type) {
                case DistrictTypes.CITY_CENTER:
                case DistrictTypes.WONDER:
                case DistrictTypes.URBAN:
                    // If district is city center or is wonder or is already urban, return it directly.
                    return GameInfo.Districts.lookup(district.type)?.DistrictType;
                case DistrictTypes.RURAL:
                    hasImprovement = true;
                    break;
            }
        }
        // Check for map tacks.
        for (const mapTack of validMapTacks) {
            if (GameInfo.Buildings.lookup(mapTack.type)?.CityCenterPriority) {
                return "DISTRICT_CITY_CENTER";
            }
            switch (mapTack.classType) {
                case ConstructibleClassType.WONDER:
                    return "DISTRICT_WONDER";
                case ConstructibleClassType.BUILDING:
                    hasBuilding = true;
                    break;
                case ConstructibleClassType.IMPROVEMENT:
                    hasImprovement = true;
                    break;
            }
        }
        if (hasBuilding) {
            return "DISTRICT_URBAN";
        } else if (hasImprovement) {
            return "DISTRICT_RURAL";
        } else {
            return "DISTRICT_WILDERNESS";
        }
    }
    /**
     * @param {string} type constructible type
     * @returns class type of given constructible type.
     */
    getConstructibleClassType(type) {
        const constructibleDef = GameInfo.Constructibles.lookup(type);
        if (constructibleDef) {
            return constructibleDef.ConstructibleClass;
        }
        return;
    }
    /**
     * @param {string} type feature type
     * @returns class type of given feature type.
     */
    getFeatureClassType(type) {
        if (type) {
            const featureDef = GameInfo.Features.lookup(type);
            if (featureDef) {
                return featureDef.FeatureClassType;
            }
        }
        return;
    }
    /**
     * @param {int} x 
     * @param {int} y
     * @returns an array of objects with these fields:
     *      type: Constructible type
     *      classType: Constructible class type
     */
    getConstructiblesAtPlot(x, y) {
        const constructibles = [];
        const constructibleComponentIds = MapConstructibles.getHiddenFilteredConstructibles(x, y);
        for (const componentId of constructibleComponentIds) {
            const instance = Constructibles.getByComponentID(componentId);
            if (instance) {
                const constructibleDef = GameInfo.Constructibles.lookup(instance.type);
                if (constructibleDef) {
                    constructibles.push({
                        type: constructibleDef.ConstructibleType,
                        classType: constructibleDef.ConstructibleClass
                    });
                }
            }
        }
        return constructibles;
    }
    isAdjacentToLake(x, y) {
        const adjacentPlots = this.getAdjacentPlots(x, y);
        for (const { plot } of adjacentPlots) {
            if (GameplayMap.isLake(plot.x, plot.y)) {
                return true;
            }
        }
        return false;
    }
    isAdjacentToDistrict(x, y, districtType) {
        const adjacentPlots = this.getAdjacentPlots(x, y);
        for (const { plot } of adjacentPlots) {
            const realizedDistrictType = this.getRealizedDistrictType(plot.x, plot.y);
            if (districtType == realizedDistrictType) {
                return true;
            } else if (districtType == "DISTRICT_URBAN" && realizedDistrictType == "DISTRICT_CITY_CENTER") {
                // Special check for wonder's urban requirement. City center is considered as valid urban.
                return true;
            }
        }
        return false;
    }
    isAdjacentToTerrain(x, y, terrainType) {
        const adjacentPlots = this.getAdjacentPlots(x, y);
        for (const { plot } of adjacentPlots) {
            const adjTerrainIndex = GameplayMap.getTerrainType(plot.x, plot.y);
            const adjTerrainDef = GameInfo.Terrains.lookup(adjTerrainIndex);
            if (terrainType == adjTerrainDef?.TerrainType) {
                return true;
            }
        }
        return false;
    }
    getQuarterType(constructibles) {
        if (constructibles) {
            const validConstructibles = constructibles.filter(c => !this.isObsolete(c));
            if (validConstructibles.length >= 2) {
                // Unique quarter check
                for (const uniqueQuarterDef of GameInfo.UniqueQuarters) {
                    const uniqueQuarterConstructibles = [uniqueQuarterDef.BuildingType1, uniqueQuarterDef.BuildingType2];
                    // Sort both arrays
                    validConstructibles.sort();
                    uniqueQuarterConstructibles.sort();
                    if (JSON.stringify(validConstructibles) == JSON.stringify(uniqueQuarterConstructibles)) {
                        return QuarterType[uniqueQuarterDef.UniqueQuarterType];
                    }
                }
                return QuarterType.NORMAL_QUARTER;;
            }
            for (const c of validConstructibles) {
                if (this.hasTag(c, "FULL_TILE")) {
                    return QuarterType.NORMAL_QUARTER;
                }
            }
        }
        return QuarterType.NO_QUARTER;
    }
    getConstructibleYieldChanges(type) {
        return this.constructibleYieldChanges[type] || [];
    }
    getConstructibleDominantYieldType(type) {
        const yields = this.constructibleYieldChanges[type];
        if (yields) {
            let maxAmount = -Infinity;
            let maxType = "YIELD_UNKNOWN";
            let hasDuplicateMax = false;
            for (const { type, amount } of yields) {
                if (amount > maxAmount) {
                    maxAmount = amount;
                    maxType = type;
                    hasDuplicateMax = false;
                } else if (amount === maxAmount) {
                    hasDuplicateMax = true;
                }
            }
            if (!hasDuplicateMax) {
                return maxType;
            }
        }
        return "YIELD_UNKNOWN";
    }
    // START - UI related
    getMapTackIconStyles(type, classType) {
        // Get shape based on class type.
        const classes = [];
        switch (classType) {
            case ConstructibleClassType.WONDER:
                classes.push("square");
                break;
            case ConstructibleClassType.IMPROVEMENT:
                classes.push("diamond");
                break;
            case ConstructibleClassType.BUILDING:
            default:
                classes.push("round");
                break;
        }
        // Get color based on type.
        const yieldType = this.getConstructibleDominantYieldType(type);
        if (yieldType != "YIELD_UNKNOWN") {
            const colorClass = YieldClassNames.get(yieldType);
            classes.push(colorClass);
        }
        return classes;
    }
    getYieldFragment(yieldDetails, includeDivider = true) {
        const container = document.createElement('fragment');
        const totalYieldStr = this.getTotalYieldString(yieldDetails);
        if (totalYieldStr) {
            const yieldContainer = document.createElement('div');
            yieldContainer.innerHTML = Locale.stylize(`[B]${totalYieldStr}[/B]`);
            container.appendChild(yieldContainer);
        }
        if (includeDivider) {
            // Divider
            const divider = document.createElement("div");
            divider.classList.add("filigree-divider-inner-frame", "w-full");
            container.appendChild(divider);
        }
        // Base yields
        const baseYieldStr = this.getBaseYieldString(yieldDetails["base"]);
        if (baseYieldStr) {
            const yieldContainer = document.createElement('div');
            yieldContainer.innerHTML = Locale.stylize(baseYieldStr);
            container.appendChild(yieldContainer);
        }
        // Adjacency yields
        const adjYieldStr = this.getAdjacencyYieldString(yieldDetails["adjacencies"]);
        if (adjYieldStr) {
            const yieldContainer = document.createElement('div');
            yieldContainer.innerHTML = Locale.stylize(adjYieldStr);
            container.appendChild(yieldContainer);
        }
        return container;
    }
    getYieldString(yieldDetails, short = false, separator = ' ') {
        if (!yieldDetails || yieldDetails.length == 0) {
            return;
        }
        yieldDetails.sort((a, b) => YieldTypes.indexOf(a.type) - YieldTypes.indexOf(b.type));
        let yieldStr;
        if (short) {
            yieldStr = yieldDetails.map(yieldDetail => `+${yieldDetail.amount}[icon:${yieldDetail.type}]`).join(separator);
        } else {
            yieldStr = yieldDetails.map(yieldDetail => {
                const itemDef = GameInfo.Yields.lookup(yieldDetail.type);
                return Locale.compose("LOC_UI_POS_YIELD", yieldDetail.amount, itemDef.Name);
            }).join(separator);
        }
        return Locale.compose(yieldStr);
    }
    getTotalYieldString(yieldDetails, short = false) {
        const totalMap = new Map();
        const subYieldDetails = Object.values(yieldDetails).flat();
        if (!subYieldDetails || subYieldDetails.length == 0) {
            return;
        }
        for (const subYieldDetail of subYieldDetails) {
            const currentTotal = totalMap.get(subYieldDetail.type) || 0;
            totalMap.set(subYieldDetail.type, currentTotal + subYieldDetail.amount);
        }
        const totalYieldDetails = Array.from(totalMap, ([type, amount]) => ({type, amount}));
        totalYieldDetails.sort((a, b) => YieldTypes.indexOf(a.type) - YieldTypes.indexOf(b.type));
        if (short) {
            return this.getYieldString(totalYieldDetails, true, "[N]");
        } else {
            return Locale.compose("LOC_DMT_TOTAL_YIELD", this.getYieldString(totalYieldDetails));
        }
    }
    getBaseYieldString(baseYieldDetails) {
        if (!baseYieldDetails || baseYieldDetails.length == 0) {
            return;
        }
        return Locale.compose("LOC_UI_PRODUCTION_BASE_YIELD", this.getYieldString(baseYieldDetails));
    }
    getAdjacencyYieldString(adjYieldDetails) {
        // Adjacency Bonus: +6 Food + 6 Production
        //      - +2 Food from adjacent XXX (xxx, xxx)
        //      - +2 Food from adjacent YYY (yyy, yyy)
        //      ...
        if (!adjYieldDetails || adjYieldDetails.length == 0) {
            return;
        }
        // Sort adjacencies by type.
        adjYieldDetails.sort((a, b) => YieldTypes.indexOf(a.type) - YieldTypes.indexOf(b.type));
        
        const adjacencyStrings = [];
        const sumMap = new Map();
        for (const yieldDetail of adjYieldDetails) {
            // Populate sum.
            const currentSum = sumMap.get(yieldDetail.type) || 0;
            sumMap.set(yieldDetail.type, currentSum + yieldDetail.amount);
            // Add sub adjacency strings
            adjacencyStrings.push(`[LI] ${Locale.compose(yieldDetail.text)}`);
        }
        // Add summary
        const sumYieldDetails = Array.from(sumMap, ([type, amount]) => ({type, amount}));
        const sumString = Locale.compose("LOC_DMT_ADJACENCY_YIELD", this.getYieldString(sumYieldDetails));
        return Locale.compose(`${sumString}[N][BLIST]${adjacencyStrings.join("")}[/LIST]`);
    }
    // END - UI related
}

const MapTackUtils = MapTackUtilsSingleton.getInstance();
export { MapTackUtils as default };