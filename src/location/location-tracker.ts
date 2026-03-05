import { debug, info } from "../utils";
import type { LocationPoint } from "./types";
import { Observable } from "../observable";
import { getConfig } from "../config";
import L from "leaflet";

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

        this.stopSmoothing();
        this.targetPoint = undefined;
        this.currentPoint = undefined;
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
        const { latitude, longitude } = position.coords;
        if (!this.isPositionAllowed(position)) {
            return;
        }

        const nextPoint = this.toLocationPoint(position);

        // First valid fix after start: snap immediately.
        if (!this.targetPoint || !this.currentPoint) {
            this.snapTo(nextPoint);
            return;
        }

        const jumpDistanceMeters = this.distanceMeters(
            this.targetPoint,
            nextPoint,
        );

        this.targetPoint = nextPoint;

        // Large discontinuity (poor GPS/teleport): emit immediate snap.
        if (jumpDistanceMeters > this.largeJumpMeters) {
            this.snapTo(nextPoint);
            return;
        }

        this.startSmoothing();
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

    private startSmoothing = (): void => {
        if (this.frameId !== undefined) {
            return;
        }

        this.lastFrameTs = undefined;
        this.frameId = requestAnimationFrame(this.stepSmoothing);
    };

    private stopSmoothing = (): void => {
        if (this.frameId !== undefined) {
            cancelAnimationFrame(this.frameId);
            this.frameId = undefined;
        }
        this.lastFrameTs = undefined;
    };

    private stepSmoothing = (timestampMs: number): void => {
        if (!this.targetPoint || !this.currentPoint) {
            this.stopSmoothing();
            return;
        }

        const dtMs =
            this.lastFrameTs === undefined
                ? 16
                : Math.max(0, timestampMs - this.lastFrameTs);
        this.lastFrameTs = timestampMs;

        const alpha = 1 - Math.exp(-dtMs / this.tauMs);

        this.currentPoint = this.interpolatePoint(
            this.currentPoint,
            this.targetPoint,
            alpha,
        );

        this.notify(this.currentPoint);

        const remainingDistanceMeters = this.distanceMeters(
            this.currentPoint,
            this.targetPoint,
        );
        if (remainingDistanceMeters < this.snapDistanceMeters) {
            this.snapTo(this.targetPoint);
            return;
        }

        this.frameId = requestAnimationFrame(this.stepSmoothing);
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

    /**
     * Emits an immediate point and resets smoothing state.
     */
    private snapTo = (point: LocationPoint): void => {
        this.targetPoint = point;
        this.currentPoint = point;
        this.stopSmoothing();
        this.notify(point);
    };

    private interpolatePoint = (
        current: LocationPoint,
        target: LocationPoint,
        alpha: number,
    ): LocationPoint => {
        return {
            latitude:
                current.latitude + (target.latitude - current.latitude) * alpha,
            longitude:
                current.longitude +
                (target.longitude - current.longitude) * alpha,
            accuracy:
                current.accuracy + (target.accuracy - current.accuracy) * alpha,
            timestamp: Date.now(),
        };
    };

    private distanceMeters = (
        a: Pick<LocationPoint, "latitude" | "longitude">,
        b: Pick<LocationPoint, "latitude" | "longitude">,
    ): number => {
        return L.latLng(a.latitude, a.longitude).distanceTo(
            L.latLng(b.latitude, b.longitude),
        );
    };

    private watchId: number | undefined;
    private targetPoint: LocationPoint | undefined;
    private currentPoint: LocationPoint | undefined;
    // Active animation frame handle used by the smoothing loop.
    private frameId: number | undefined;
    // Previous RAF timestamp used to compute frame delta.
    private lastFrameTs: number | undefined;
    // Exponential smoothing time constant.
    private readonly tauMs = 450;
    // Stop smoothing when converged within this radius.
    private readonly snapDistanceMeters = 0.5;
    // Snap immediately for large discontinuities.
    private readonly largeJumpMeters = 25;
    // Ignore points above this reported accuracy.
    private readonly maxAccuracyMeters = 10;
}
