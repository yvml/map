import type L from "leaflet";
import type { FeatureFlagProvider } from "../feature-flags";
import type { LocationTracker, OrientationTracker } from "../location";
import { rotateMap } from "./rotate-map";

type MapMovementControllerParams = {
    map: L.Map;
    locationTracker: LocationTracker;
    orientationTracker: OrientationTracker;
    featureFlagProvider: FeatureFlagProvider;
};

export class MapMovementController {
    constructor({
        map,
        locationTracker,
        orientationTracker,
        featureFlagProvider,
    }: MapMovementControllerParams) {
        this.map = map;
        this.locationTracker = locationTracker;
        this.orientationTracker = orientationTracker;

        if (featureFlagProvider.get("locationFollowAndRotate").value) {
            this.enable();
        } else {
            this.disable();
        }

        featureFlagProvider.addListener(({ key, value }) => {
            if (key !== "locationFollowAndRotate") {
                return;
            }

            if (value) {
                this.enable();
            } else {
                this.disable();
            }
        });
    }

    private enable = () => {
        if (!this.unsubscribeLocationFollow) {
            this.unsubscribeLocationFollow = this.locationTracker.addListener(
                ({ latitude, longitude }) => {
                    // TODO: only if the location is within the bounds -- or should that happen higher up?
                    this.map.setView([latitude, longitude], this.map.getZoom(), {
                        animate: true,
                    });
                },
            );
        }

        if (!this.unsubscribeRotation) {
            this.unsubscribeRotation = rotateMap({
                orientationTracker: this.orientationTracker,
                setBearing: (bearing) => this.map.setBearing(bearing),
            });
        }
    };

    private disable = () => {
        if (this.unsubscribeLocationFollow) {
            this.unsubscribeLocationFollow();
            this.unsubscribeLocationFollow = undefined;
        }
        if (this.unsubscribeRotation) {
            this.unsubscribeRotation();
            this.unsubscribeRotation = undefined;
        }
    };

    private map: L.Map;
    private locationTracker: LocationTracker;
    private orientationTracker: OrientationTracker;
    private unsubscribeLocationFollow: (() => void) | undefined;
    private unsubscribeRotation: (() => void) | undefined;
}
