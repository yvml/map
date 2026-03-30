import L from "leaflet";
import { defaultFeatures } from "./default-features";
import type { Config } from "./types";

/**
 * Default app config.
 *
 * Notes:
 * - asset caching defaults through the `assetCaching` feature flag
 * - cache TTL remains local to the cache implementation, not app config
 */
export const defaultConfig = {
    features: defaultFeatures,
    bounds: L.latLngBounds(
        [34.18152307750378, -116.41490672855878], // south-west
        [34.18253355653219, -116.41373685883292], // north-east
    ),
    hasGrantedLocationAccess: false,
} as const satisfies Config;
