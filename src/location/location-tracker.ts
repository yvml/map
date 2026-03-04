import { debug, info } from "../utils";
import type { LocationPoint } from "./types";
import { Observable } from "../observable";

export class LocationTracker extends Observable<LocationPoint> {
    /**
     * Initialize position tracker and EventListener
     */
    constructor() {
        // TODO: move this out
        super();
        this.start();

        document.addEventListener(
            "visibilitychange",
            this.handleVisibilityChange,
        );

        // Initialize map elements
        // TODO: map elements in this class feels like tight coupling
    }

    /**
     * start tracking via navigator.geolocation
     */
    public start = (): void => {
        if (this.watchId !== undefined) {
            return;
        }

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

    private handleVisibilityChange = () => {
        debug("[LocationTracker] handleVisibilityChange");
        if (document.hidden) {
            this.stop();
        } else {
            this.start();
        }
    };

    private handlePosition = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;

        this.notify({
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
        });
    };

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
