import L from "leaflet";
import { defaultFeatures } from "./default-features";
import type { Config } from "./types";

/**
 * Default app config.
 *
 * Notes:
 * - `assetCache.ttlHours` controls how long app-hosted public assets remain cached
 * - the cache-related portion of this default was AI-generated
 */
export const defaultConfig = {
    features: defaultFeatures,
    assetCache: {
        ttlHours: 24 * 7,
    },
    bounds: L.latLngBounds(
        [34.18152307750378, -116.41490672855878], // south-west
        [34.18253355653219, -116.41373685883292], // north-east
    ),
    hasGrantedLocationAccess: false,
} as const satisfies Config;
