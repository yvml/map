import type L from "leaflet";
import type { ConfigStore } from "../config";
import type { LocationTracker, OrientationTracker } from "../location";
import type { POITracker } from "../points";

type MapMovementControllerParams = {
    map: L.Map;
    locationTracker: LocationTracker;
    orientationTracker: OrientationTracker;
    configStore: ConfigStore;
    poiTracker: POITracker;
};

export class MapMovementController {
    constructor({
        map,
        locationTracker,
        orientationTracker,
        configStore,
        poiTracker,
    }: MapMovementControllerParams) {
        this.map = map;
        this.locationTracker = locationTracker;
        this.orientationTracker = orientationTracker;

        /**
         * center the map when a user clicks on a marker
         */
        poiTracker.addListener((activePOI) => {
            if (!activePOI) {
                return;
            }

            const poiPosition = this.map.latLngToContainerPoint([
                activePOI.location.latitude,
                activePOI.location.longitude,
            ]);
            const mapSize = this.map.getSize();
            const targetX = mapSize.x / 2 - mapSize.x * 0.1;
            const targetY = mapSize.y * 0.1;

            this.map.panBy([poiPosition.x - targetX, poiPosition.y - targetY], {
                animate: true,
            });
        });

        if (configStore.getFeature("locationFollowAndRotate").value) {
            this.enable();
        } else {
            this.disable();
        }

        configStore.addListener((event) => {
            if (event.key !== "features") {
                return;
            }

            const { key, value: isEnabled } = event.value;
            if (key !== "locationFollowAndRotate") {
                return;
            }

            if (isEnabled) {
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
                    this.map.setView(
                        [latitude, longitude],
                        this.map.getZoom(),
                        {
                            animate: true,
                        },
                    );
                },
            );
        }

        if (!this.unsubscribeRotation) {
            this.unsubscribeRotation = this.orientationTracker.addListener(
                ({ heading }) => {
                    // Invert for map rotation:
                    // when user turns left, map rotates clockwise.
                    const corrected = (360 - heading) % 360;
                    this.map.setBearing(corrected);
                },
            );
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
