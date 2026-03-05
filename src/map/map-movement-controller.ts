import L from "leaflet";
import type { ConfigStore } from "../config";
import type { LocationTracker, OrientationTracker } from "../location";

type MapMovementControllerParams = {
    map: L.Map;
    locationTracker: LocationTracker;
    orientationTracker: OrientationTracker;
    configStore: ConfigStore;
};

/**
 * Keeps the map camera centered on the tracked location while smoothing
 * low-frequency GPS updates and preserving immediate jumps for discontinuities.
 */
export class MapMovementController {
    constructor({
        map,
        locationTracker,
        orientationTracker,
        configStore,
    }: MapMovementControllerParams) {
        this.map = map;
        this.locationTracker = locationTracker;
        this.orientationTracker = orientationTracker;

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
                    const nextTarget: L.LatLngTuple = [latitude, longitude];

                    // First fix after enabling follow: snap to avoid startup drift.
                    if (!this.targetLatLng || !this.currentLatLng) {
                        this.targetLatLng = nextTarget;
                        this.currentLatLng = nextTarget;
                        this.map.stop();
                        this.map.setView(nextTarget, this.map.getZoom(), {
                            animate: false,
                        });
                        this.stopFollowAnimation();
                        return;
                    }

                    const jumpDistanceMeters = L.latLng(
                        this.targetLatLng[0],
                        this.targetLatLng[1],
                    ).distanceTo(L.latLng(nextTarget[0], nextTarget[1]));
                    this.targetLatLng = nextTarget;

                    // Snap immediately on large discontinuities.
                    if (jumpDistanceMeters > this.largeJumpMeters) {
                        this.currentLatLng = nextTarget;
                        this.map.stop();
                        this.map.setView(nextTarget, this.map.getZoom(), {
                            animate: false,
                        });
                        this.stopFollowAnimation();
                        return;
                    }

                    this.startFollowAnimation();
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

        this.stopFollowAnimation();
        this.targetLatLng = undefined;
        this.currentLatLng = undefined;
    };

    /**
     * Starts the requestAnimationFrame follow loop if it is not already active.
     */
    private startFollowAnimation = (): void => {
        if (this.frameId !== undefined) {
            return;
        }

        this.lastFrameTs = undefined;
        this.frameId = requestAnimationFrame(this.stepFollowAnimation);
    };

    /**
     * Stops the requestAnimationFrame follow loop and resets frame timing.
     */
    private stopFollowAnimation = (): void => {
        if (this.frameId !== undefined) {
            cancelAnimationFrame(this.frameId);
            this.frameId = undefined;
        }
        this.lastFrameTs = undefined;
    };

    /**
     * Runs one animation frame of smooth camera follow.
     * Interpolates toward targetLatLng and re-schedules until convergence.
     */
    private stepFollowAnimation = (timestampMs: number): void => {
        if (!this.targetLatLng || !this.currentLatLng) {
            this.stopFollowAnimation();
            return;
        }

        const dtMs =
            this.lastFrameTs === undefined
                ? 16
                : Math.max(0, timestampMs - this.lastFrameTs);
        this.lastFrameTs = timestampMs;

        // Exponential smoothing using frame delta, so animation speed remains stable
        // even when requestAnimationFrame cadence varies.
        const alpha = 1 - Math.exp(-dtMs / this.tauMs);
        const [currentLat, currentLng] = this.currentLatLng;
        const [targetLat, targetLng] = this.targetLatLng;

        const nextLat = currentLat + (targetLat - currentLat) * alpha;
        const nextLng = currentLng + (targetLng - currentLng) * alpha;

        this.currentLatLng = [nextLat, nextLng];

        const remainingDistanceMeters = L.latLng(
            this.currentLatLng[0],
            this.currentLatLng[1],
        ).distanceTo(L.latLng(this.targetLatLng[0], this.targetLatLng[1]));
        if (remainingDistanceMeters < this.snapDistanceMeters) {
            this.currentLatLng = this.targetLatLng;
            this.map.panTo(this.targetLatLng, { animate: false });
            this.stopFollowAnimation();
            return;
        }

        this.map.panTo(this.currentLatLng, { animate: false });
        this.frameId = requestAnimationFrame(this.stepFollowAnimation);
    };

    private map: L.Map;
    private locationTracker: LocationTracker;
    private orientationTracker: OrientationTracker;
    private unsubscribeLocationFollow: (() => void) | undefined;
    private unsubscribeRotation: (() => void) | undefined;
    // Most recent position emitted by the location tracker.
    private targetLatLng: L.LatLngTuple | undefined;
    // Camera position currently used by the smoothing loop.
    private currentLatLng: L.LatLngTuple | undefined;
    // Active animation frame handle for the follow loop.
    private frameId: number | undefined;
    // Previous frame timestamp used to compute frame delta.
    private lastFrameTs: number | undefined;
    // Time constant for the exponential follow filter.
    private readonly tauMs = 450;
    // Stop animating once visually converged to avoid tiny endless updates.
    private readonly snapDistanceMeters = 0.5;
    // Treat larger deltas as GPS discontinuities and snap immediately.
    private readonly largeJumpMeters = 25;
}
