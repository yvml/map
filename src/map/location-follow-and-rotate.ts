import type L from "leaflet";
import type { FeatureFlagProvider } from "../feature-flags";
import type { LocationTracker, OrientationTracker } from "../location";
import { rotateMap } from "./rotate-map";

type InitLocationFollowAndRotateParams = {
    map: L.Map;
    locationTracker: LocationTracker;
    orientationTracker: OrientationTracker;
    featureFlagProvider: FeatureFlagProvider;
};

export const initLocationFollowAndRotate = ({
    map,
    locationTracker,
    orientationTracker,
    featureFlagProvider,
}: InitLocationFollowAndRotateParams) => {
    let unsubscribeLocationFollow: (() => void) | undefined;
    let unsubscribeRotation: (() => void) | undefined;

    const enable = () => {
        if (!unsubscribeLocationFollow) {
            unsubscribeLocationFollow = locationTracker.addListener(
                ({ latitude, longitude }) => {
                    // TODO: only if the location is within the bounds -- or should that happen higher up?
                    map.setView([latitude, longitude], map.getZoom(), {
                        animate: true,
                    });
                },
            );
        }

        if (!unsubscribeRotation) {
            unsubscribeRotation = rotateMap({
                orientationTracker,
                setBearing: (bearing) => map.setBearing(bearing),
            });
        }
    };

    const disable = () => {
        if (unsubscribeLocationFollow) {
            unsubscribeLocationFollow();
            unsubscribeLocationFollow = undefined;
        }
        if (unsubscribeRotation) {
            unsubscribeRotation();
            unsubscribeRotation = undefined;
        }
    };

    if (featureFlagProvider.get("locationFollowAndRotate").value) {
        enable();
    } else {
        disable();
    }

    featureFlagProvider.addListener(({ key, value }) => {
        if (key !== "locationFollowAndRotate") {
            return;
        }

        if (value) {
            enable();
        } else {
            disable();
        }
    });
};
