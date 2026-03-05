import { Observable } from "../observable";
import { debug } from "../utils";
import { defaultConfig } from "./default-config";
import {
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
}

let configStore: ConfigStore | undefined = undefined;

export const initConfig = (
    config?: Partial<Config> & {
        features?: Partial<FeaturesConfig>;
    },
) => {
    configStore = new ConfigStore({
        ...defaultConfig,
        ...config,
        features: {
            ...defaultConfig.features,
            ...(config?.features ?? {}),
        },
    });
};

export const getConfig = () => {
    if (!configStore) {
        throw Error("missing config store");
    }
    return configStore;
};
