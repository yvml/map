import { debug, info } from "../utils";
import type { LocationPoint } from "./types";
import { Observable } from "../observable";
import { getConfigStore } from "../config";

export class LocationTracker extends Observable<LocationPoint> {
    constructor() {
        super();
        getConfigStore().addListener(({ key, value }) => {
            if (key === "hasGrantedLocationAccess") {
                if (value === true) {
                    debug("[LocationTracker] hasGrantedLocationAccess changed");
                    this.start();
                }
            }
        });
    }
    /**
     * start tracking via navigator.geolocation
     */
    public start = (): void => {
        if (this.watchId !== undefined) {
            return;
        }

        // TODO: call getPosition and return a boolean here
        // true: tracking began successfully
        // false: it didnt (permission denied, out of bounds, bad accuracy)
        //
        //
        this.watchId = navigator.geolocation.watchPosition(
            this.handlePosition,
            this.handleError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 2000, // TODO: see what this does
            },
        );

        debug(`[LocationTracker] watch started: ${this.watchId}`);
    };

    /**
     * end tracking based on the current watchId
     */
    public stop = (): void => {
        if (this.watchId !== undefined) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = undefined;
        }
    };

    public handleVisibilityChange = () => {
        debug("[LocationTracker] handleVisibilityChange");
        if (document.hidden) {
            this.stop();
        } else {
            if (getConfigStore().config.hasGrantedLocationAccess) {
                this.start();
            }
        }
    };

    public handlePosition = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        const bounds = getConfigStore().getBounds();
        if (bounds && !bounds.contains([latitude, longitude])) {
            info(
                "[LocationTracker] location outside bounds, stopping tracking",
                {
                    latitude,
                    longitude,
                },
            );
            this.stop();
            return;
        }

        if (accuracy > 10) {
            info(
                `[LocationTracker] accuracy above 10, not notifying: ${accuracy}`,
            );
            return;
        } // TODO: getConfig().config.minAccuracy)

        this.notify({
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
        });
    };

    // TODO: notify of stopping
    private handleError = (error: GeolocationPositionError) => {
        switch (error.code) {
            case GeolocationPositionError.PERMISSION_DENIED: {
                info("permission denied", error);
                break;
            }
            case GeolocationPositionError.POSITION_UNAVAILABLE: {
                info("position unavailable", error);
                break;
            }
            case GeolocationPositionError.TIMEOUT: {
                info("timeout", error);
                break;
            }
            default: {
                info(error);
            }
        }
    };

    private watchId: number | undefined;
}
