import type { defaultFeatures } from "./default-features";
import type L from "leaflet";

export type FeatureConfig = {
    name: string;
    description: string;
    value: boolean;
};

export type FeaturesConfig = typeof defaultFeatures;
export type FeatureKey = keyof FeaturesConfig;

export type Config = {
    features: Record<FeatureKey, FeatureConfig>;
    bounds?: L.LatLngBounds;
    hasGrantedLocationAccess: boolean;
};

export type FeatureUpdateEvent = {
    key: "features";
    value: {
        key: FeatureKey;
        value: boolean;
    };
};

export type BoundsUpdateEvent = {
    key: "bounds";
    value: L.LatLngBounds;
};

export type LocationPermissionUpdateEvent = {
    key: "hasGrantedLocationAccess";
    value: boolean;
};

export type ConfigEvent =
    | FeatureUpdateEvent
    | BoundsUpdateEvent
    | LocationPermissionUpdateEvent;
