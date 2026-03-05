import { debug, info } from "../utils";
import type { LocationPoint } from "./types";
import { Observable } from "../observable";
import { getConfig } from "../config";
import { LocationSmoother } from "./location-smoother";

/**
 * Produces a single, stabilized location stream for all consumers.
 *
 * Raw geolocation fixes are validated, then either:
 * - emitted immediately (first fix / large discontinuity), or
 * - interpolated with an RAF-based exponential smoothing loop.
 */
export class LocationTracker extends Observable<LocationPoint> {
    /**
     * Initialize position tracker and EventListener
     */
    constructor() {
        // TODO: move this out
        super();
        this.smoother = new LocationSmoother({
            tauMs: this.tauMs,
            maxFrameDeltaMs: this.maxFrameDeltaMs,
            snapDistanceMeters: this.snapDistanceMeters,
            largeJumpMeters: this.largeJumpMeters,
        });

        document.addEventListener(
            "visibilitychange",
            this.handleVisibilityChange,
        );
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

        this.smoother.reset();
    };

    private handleVisibilityChange = () => {
        debug("[LocationTracker] handleVisibilityChange");
        if (document.hidden) {
            this.stop();
        } else {
            // TODO: only if the user has hit the locate button
            this.start();
        }
    };

    private handlePosition = (position: GeolocationPosition) => {
        if (!this.isPositionAllowed(position)) {
            return;
        }

        const nextPoint = this.toLocationPoint(position);
        this.smoother.ingest(nextPoint, this.notify);
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

    /**
     * Validates bounds and accuracy requirements for incoming geolocation fixes.
     */
    private isPositionAllowed = (position: GeolocationPosition): boolean => {
        const { latitude, longitude, accuracy } = position.coords;
        const bounds = getConfig().getBounds();
        if (bounds && !bounds.contains([latitude, longitude])) {
            info(
                "[LocationTracker] location outside bounds, stopping tracking",
                {
                    latitude,
                    longitude,
                },
            );
            this.stop();
            return false;
        }

        if (accuracy > this.maxAccuracyMeters) {
            info(
                `[LocationTracker] accuracy above ${this.maxAccuracyMeters}, not notifying: ${accuracy}`,
            );
            return false;
        }

        return true;
    };

    /**
     * Converts browser geolocation payload to the app-level location event.
     */
    private toLocationPoint = (
        position: GeolocationPosition,
    ): LocationPoint => {
        const { latitude, longitude, accuracy } = position.coords;
        return {
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
        };
    };

    private watchId: number | undefined;
    private smoother: LocationSmoother;
    // Exponential smoothing time constant. Higher is smoother/slower.
    private readonly tauMs = 1200;
    // Caps frame delta used for smoothing to avoid large single-frame jumps.
    private readonly maxFrameDeltaMs = 100;
    // Stop smoothing when converged within this radius.
    private readonly snapDistanceMeters = 0.5;
    // Snap immediately for large discontinuities.
    private readonly largeJumpMeters = 25;
    // Ignore points above this reported accuracy.
    private readonly maxAccuracyMeters = 10;
}
