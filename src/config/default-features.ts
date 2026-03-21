import type { FeatureConfig } from "./types";

export const defaultFeatures = {
    locationBounds: {
        name: "locationBounds",
        description: "Enable location bounds outlines around POIs",
        value: false,
    },
    console: {
        name: "console",
        description: "Enable debug console",
        value: false,
    },
    locationFollowAndRotate: {
        name: "locationFollowAndRotate",
        description:
            "Follow user location and rotate map by orientation (disable to keep map static while dot/cone still move)",
        value: false,
    },
} as const satisfies Record<string, FeatureConfig>;
