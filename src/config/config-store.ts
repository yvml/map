import { Observable } from "../observable";
import { LocalStorageProvider, StorageKeys } from "../storage";
import { debug } from "../utils";
import { defaultConfig } from "./default-config";
import {
    type AssetCacheConfig,
    type Config,
    type ConfigEvent,
    type FeaturesConfig,
    type FeatureConfig,
    type FeatureKey,
} from "./types";
import type L from "leaflet";

export class ConfigStore extends Observable<ConfigEvent> {
    constructor(public readonly config: Config) {
        super();
    }

    getFeature(key: FeatureKey): FeatureConfig {
        return this.config.features[key];
    }

    getBounds(): L.LatLngBounds | undefined {
        return this.config.bounds;
    }

    setFeature(key: FeatureKey, value: boolean) {
        debug(`setting ${key} to ${value}`);
        this.config.features[key].value = value;
        this.persist();

        this.notify({
            key: "features",
            value: {
                key,
                value,
            },
        });
    }

    setBounds(bounds: L.LatLngBounds) {
        this.config.bounds = bounds;
        this.notify({ key: "bounds", value: bounds });
    }

    getAssetCache(): AssetCacheConfig {
        return this.config.assetCache;
    }

    setAssetCache(value: AssetCacheConfig) {
        this.config.assetCache = value;
        this.persist();
        this.notify({ key: "assetCache", value });
    }

    private persist() {
        const persistedConfig: PersistedConfig = {
            features: Object.fromEntries(
                Object.entries(this.config.features).map(([key, feature]) => [
                    key,
                    feature.value,
                ]),
            ) as PersistedFeatureValues,
            assetCache: this.config.assetCache,
            hasGrantedLocationAccess: this.config.hasGrantedLocationAccess,
        };

        LocalStorageProvider.set(
            StorageKeys.appConfig,
            JSON.stringify(persistedConfig),
        );
    }
}

let configStore: ConfigStore | undefined = undefined;

type PersistedFeatureValues = Record<FeatureKey, boolean>;

type PersistedConfig = {
    features?: Partial<PersistedFeatureValues>;
    assetCache?: Partial<AssetCacheConfig>;
    hasGrantedLocationAccess?: boolean;
};

const readPersistedConfig = (): Partial<Config> & {
    features?: Record<FeatureKey, FeatureConfig>;
} => {
    const persistedConfig = LocalStorageProvider.get(StorageKeys.appConfig);

    if (!persistedConfig) {
        return {};
    }

    let parsedConfig: PersistedConfig;

    try {
        parsedConfig = JSON.parse(persistedConfig) as PersistedConfig;
    } catch (error) {
        debug(`[ConfigStore] failed to parse persisted config: ${error}`);
        LocalStorageProvider.clear(StorageKeys.appConfig);
        return {};
    }

    return {
        hasGrantedLocationAccess:
            parsedConfig.hasGrantedLocationAccess ??
            defaultConfig.hasGrantedLocationAccess,
        assetCache: {
            ...defaultConfig.assetCache,
            ...parsedConfig.assetCache,
        },
        features: Object.fromEntries(
            Object.entries(defaultConfig.features).map(([key, feature]) => [
                key,
                {
                    ...feature,
                    value:
                        parsedConfig.features?.[key as FeatureKey] ??
                        feature.value,
                },
            ]),
        ) as Record<FeatureKey, FeatureConfig>,
    };
};

export const initConfig = (
    config?: Partial<Config> & {
        features?: Partial<FeaturesConfig>;
    },
) => {
    const persistedConfig = readPersistedConfig();

    configStore = new ConfigStore({
        ...defaultConfig,
        ...persistedConfig,
        ...config,
        features: {
            ...defaultConfig.features,
            ...(persistedConfig.features ?? {}),
            ...(config?.features ?? {}),
        },
        assetCache: {
            ...defaultConfig.assetCache,
            ...(persistedConfig.assetCache ?? {}),
            ...(config?.assetCache ?? {}),
        },
    });
};

export const getConfigStore = () => {
    if (!configStore) {
        throw Error("missing config store");
    }
    return configStore;
};
