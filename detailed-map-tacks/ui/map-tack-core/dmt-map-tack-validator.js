
import MapTackStore from './dmt-map-tack-store.js';
import MapTackUtils from './dmt-map-tack-utils.js';
import MapTackGenerics from './dmt-map-tack-generics.js';
import { ConstructibleClassType } from './dmt-map-tack-constants.js';

const MAX_COUNT_PER_PLOT = 2;
class MapTackValidatorSingleton {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!MapTackValidatorSingleton.singletonInstance) {
            MapTackValidatorSingleton.singletonInstance = new MapTackValidatorSingleton();
        }
        return MapTackValidatorSingleton.singletonInstance;
    }
    constructor() {
        engine.whenReady.then(() => { this.onReady(); });
    }
    onReady() {
    }
    /**
     * Check if the given map tack is valid.
     * @param {int} x x-coordinate of the plot
     * @param {int} y y-coordinate of the plot
     * @param {String} type type of the map tack
     * @param {boolean} isAdditive should the type be considered as an additional map tack.
     * @returns an object with these fields:
     *      isValid: is the map tack valid here.
     *      preventPlacement: should the placement here be prevented.
     *      reasons: an array of strings with reasons if it cannot be placed here.
     */
    isValid(x, y, type, isAdditive = true) {
        let isValid = true;
        let preventPlacement = false;
        const reasons = new Set();

        if (isAdditive) {
            const mapTackList = MapTackStore.retrieveMapTacks(x, y);
            // START - Conditions that prevent placing map tacks.
            // 1. Max number of map tacks per plot check.
            if (mapTackList.length >= MAX_COUNT_PER_PLOT) {
                isValid = isValid && false;
                preventPlacement = preventPlacement || true;
                reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_REACHED_LIMIT"));
            }
            // 2. Max number of map tacks per plot check for full tile constructibles, like wonders and rail stations.
            if (mapTackList.length > 0) {
                const uniqueTypesUnderCheck = [type, ...mapTackList.map(mapTack => mapTack.type)];
                for (const typeUnderCheck of uniqueTypesUnderCheck) {
                    if (MapTackUtils.isFullTile(typeUnderCheck)) {
                        isValid = isValid && false;
                        preventPlacement = preventPlacement || true;
                        reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_FULL_TILE"));
                        break;
                    }
                }
            }
            // 3. Same map tack check. Only apply to non-generic map tacks.
            if (!MapTackGenerics.isGenericMapTack(type)) {
                const hasSameType = mapTackList.some(mapTack => mapTack.type == type);
                if (hasSameType) {
                    isValid = isValid && false;
                    preventPlacement = preventPlacement || true;
                    reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_DUPLICATE"));
                }
            }
            // END - Conditions that prevent placing map tacks.
        }

        const plotDetails = MapTackUtils.getRealizedPlotDetails(x, y);
        const classType = MapTackUtils.getConstructibleClassType(type);

        // START - Common conditions.
        // 1. Biome check.
        if (plotDetails["biome"]) {
            const canPlaceOnBiome = this.canPlaceOnBiome(type, plotDetails["biome"]);
            if (canPlaceOnBiome == false) {
                isValid = isValid && false;
                const name = GameInfo.Biomes.lookup(plotDetails["biome"])?.Name;
                reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_CANNOT_PLACE_ON_X", name));
            }
        }
        // 2. Terrain check.
        if (plotDetails["terrain"]) {
            const canPlaceOnTerrain = this.canPlaceOnTerrain(type, plotDetails["terrain"]);
            if (canPlaceOnTerrain == false) {
                isValid = isValid && false;
                const name = GameInfo.Terrains.lookup(plotDetails["terrain"])?.Name;
                reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_CANNOT_PLACE_ON_X", name));
            }
        }
        // 3. Feature check.
        if (plotDetails["feature"]) {
            const isNaturalWonder = GameplayMap.isNaturalWonder(x, y);
            const canPlaceOnFeature = this.canPlaceOnFeature(type, classType, plotDetails["feature"], isNaturalWonder);
            if (canPlaceOnFeature == false) {
                isValid = isValid && false;
                const name = GameInfo.Features.lookup(plotDetails["feature"])?.Name;
                reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_CANNOT_PLACE_ON_X", name));
            }
        }
        // 4. Resource check.
        if (plotDetails["resource"]) {
            const canPlaceOnResource = this.canPlaceOnResource(type, classType, plotDetails["resource"]);
            if (canPlaceOnResource == false) {
                isValid = isValid && false;
                const name = GameInfo.Resources.lookup(plotDetails["resource"])?.Name;
                reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_CANNOT_PLACE_ON_X", name));
            }
        }
        // 5. Adjacent check.
        const itemDef = GameInfo.Constructibles.lookup(type);
        if (itemDef?.AdjacentRiver && GameplayMap.isAdjacentToRivers(x, y, 1) == false) {
            isValid = isValid && false;
            reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_ADJACENT_X", "LOC_RIVER_NAME"));
        }
        if (itemDef?.AdjacentLake && MapTackUtils.isAdjacentToLake(x, y) == false) {
            isValid = isValid && false;
            reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_ADJACENT_X", "LOC_DMT_LAKE_NAME"));
        }
        if (itemDef?.AdjacentDistrict && MapTackUtils.isAdjacentToDistrict(x, y, itemDef.AdjacentDistrict) == false) {
            isValid = isValid && false;
            const name = GameInfo.Districts.lookup(itemDef.AdjacentDistrict)?.Name;
            reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_ADJACENT_X", name));
        }
        if (itemDef?.AdjacentTerrain && MapTackUtils.isAdjacentToTerrain(x, y, itemDef.AdjacentTerrain) == false) {
            isValid = isValid && false;
            const name = GameInfo.Terrains.lookup(itemDef.AdjacentTerrain)?.Name;
            reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_ADJACENT_X", name));
        }
        // 6. More improvement check.
        if (classType == ConstructibleClassType.IMPROVEMENT && this.canPlaceImprovement(type, x, y) == false) {
            isValid = isValid && false;
            const name = GameInfo.Constructibles.lookup(type)?.Name;
            reasons.add(Locale.compose("LOC_DMT_INVALID_REASON_CANNOT_PLACE_X", name));
        }

        // 7. Invalid adjacent biome check.

        // TODO: Further checks.

        // END - Common conditions.

        return { isValid: isValid, preventPlacement: preventPlacement, reasons: [...reasons] };
    }
    canPlaceOnBiome(mapTackType, biomeType) {
        let hasRequirement = false;
        for (const row of GameInfo.Constructible_ValidBiomes) {
            if (row.ConstructibleType == mapTackType) {
                if (row.BiomeType == biomeType) {
                    return true;
                }
                hasRequirement = true;
            }
        }
        if (hasRequirement) {
            return false;
        }
        // return true by default.
        return true;
    }
    canPlaceOnTerrain(mapTackType, terrainType) {
        let hasRequirement = false;
        for (const row of GameInfo.Constructible_ValidTerrains) {
            if (row.ConstructibleType == mapTackType) {
                if (row.TerrainType == terrainType) {
                    return true;
                }
                hasRequirement = true;
            }
        }
        if (hasRequirement) {
            return false;
        }
        // return true by default.
        return true;
    }
    canPlaceOnFeature(mapTackType, mapTackClassType, featureType, isNaturalWonder) {
        // Assume building and wonder cannot be placed on natural wonders.
        if (isNaturalWonder && mapTackClassType != ConstructibleClassType.IMPROVEMENT) {
            return false;
        }
        let hasRequirement = false;
        // Required feature class check
        for (const row of GameInfo.Constructible_RequiredFeatureClasses) {
            if (row.ConstructibleType == mapTackType) {
                if (row.FeatureClassType == MapTackUtils.getFeatureClassType(featureType)) {
                    return true;
                }
                hasRequirement = true;
            }
        }
        // Required feature check (TODO: This table is currently empty)
        // Valid feature check
        for (const row of GameInfo.Constructible_ValidFeatures) {
            if (row.ConstructibleType == mapTackType) {
                if (row.FeatureType == featureType) {
                    return true;
                }
                hasRequirement = true;
            }
        }
        if (hasRequirement) {
            return false;
        }
        // return true by default.
        return true;
    }
    canPlaceOnResource(mapTackType, mapTackClassType, resourceType) {
        // Assume building and wonder cannot be placed on resources.
        if (mapTackClassType != ConstructibleClassType.IMPROVEMENT) {
            return false;
        }
        const resourceMapTackType = mapTackType + "_RESOURCE";
        let hasRequirement = false;
        for (const row of GameInfo.Constructible_ValidResources) {
            if (row.ConstructibleType == mapTackType || row.ConstructibleType == resourceMapTackType) {
                if (row.ResourceType == resourceType) {
                    return true;
                }
                hasRequirement = true;
            }
        }
        if (hasRequirement) {
            return false;
        }
        // return false by default.
        return false;
    }
    canPlaceImprovement(mapTackType, x, y) {
        const plotDetails = MapTackUtils.getRealizedPlotDetails(x, y);
        let hasRequirement = false;
        for (const entry of GameInfo.District_FreeConstructibles) {
            if (entry?.ConstructibleType == mapTackType) {
                if (entry.FeatureType && entry.FeatureType == plotDetails["feature"]) {
                    return true;
                }
                if (entry.ResourceType && entry.ResourceType == plotDetails["resource"]) {
                    return true;
                }
                if (entry.TerrainType && entry.TerrainType == plotDetails["terrain"]) {
                    return true;
                }
                if (entry.RiverType == "RIVER_NAVIGABLE" && GameplayMap.getRiverType(x, y) == RiverTypes.RIVER_NAVIGABLE) {
                    return true;
                }
                hasRequirement = true;
            }
        }
        if (hasRequirement) {
            return false;
        }
        // TODO: Must be appealing check.
        // return true by default.
        return true;
    }
}

const MapTackValidator = MapTackValidatorSingleton.getInstance();
export { MapTackValidator as default };