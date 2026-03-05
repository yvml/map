import type { FeatureConfig } from "./types";

export const defaultFeatures = {
    locationBounds: {
        name: "locationBounds",
        description: "Enable location bounds outlines around POIs",
        value: true,
    },
    console: {
        name: "console",
        description: "Enable debug console",
        value: true,
    },
    locationFollowAndRotate: {
        name: "locationFollowAndRotate",
        description:
            "Follow user location and rotate map by orientation (disable to keep map static while dot/cone still move)",
        value: true,
    },
} as const satisfies Record<string, FeatureConfig>;
