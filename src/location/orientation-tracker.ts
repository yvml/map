import { Observable } from "../observable/observable";
import { debug, warn } from "../utils";

export type OrientationData = {
    heading: number;
};

export class OrientationTracker extends Observable<OrientationData> {
    public requestOrientationPermission = async (): Promise<boolean> => {
        try {
            if (
                typeof window === "undefined" ||
                typeof DeviceOrientationEvent === "undefined"
            ) {
                warn(
                    "[OrientationTracker] DeviceOrientationEvent not supported in this environment",
                );
                return false;
            }

            // iOS 13+ requires explicit permission
            if (
                "requestPermission" in DeviceOrientationEvent &&
                typeof DeviceOrientationEvent.requestPermission === "function"
            ) {
                try {
                    const permission =
                        await DeviceOrientationEvent.requestPermission();
                    if (permission === "granted") {
                        this.startOrientationTracking();
                        return true;
                    }
                    return false;
                } catch (error) {
                    warn("[OrientationTracker] permission error", error);
                    return false;
                }
            } else {
                this.startOrientationTracking();
                return true;
            }
        } catch (e) {
            warn("[OrientationTracker] unexpected error", e);
            return false;
        }
    };

    private startOrientationTracking = () => {
        if (typeof window === "undefined" || this.isTracking) {
            return;
        }

        this.isTracking = true;

        if ("ondeviceorientationabsolute" in window) {
            debug(`[OrientationTracker] listening on absolute`);
            window.addEventListener(
                "deviceorientationabsolute",
                this.orientationListener,
                true,
            );
        } else if ("ondeviceorientation" in window) {
            debug(`[OrientationTracker] listening on orientation`);
            window.addEventListener(
                "deviceorientation",
                this.orientationListener,
                true,
            );
        } else {
            debug("[OrientationTracker] fellthrough");
        }
    };

    public stopOrientationTracking = () => {
        if (typeof window === "undefined") {
            return;
        }

        this.isTracking = false;

        if ("ondeviceorientationabsolute" in window) {
            window.removeEventListener(
                "deviceorientationabsolute",
                this.orientationListener,
                true,
            );
        }
        if ("ondeviceorientation" in window) {
            window.removeEventListener(
                "deviceorientation",
                this.orientationListener,
                true,
            );
        }

        if (this.animationFrame !== undefined) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = undefined;
        }
    };

    private orientationListener = ({
        absolute,
        alpha,
        webkitCompassHeading,
    }: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
        if (absolute === true && alpha !== null) {
            //debug(`[OrientationTracker] ${absolute} ${alpha}`);
            this.handleRawHeading(alpha);
        } else if (webkitCompassHeading !== undefined) {
            //debug(`[OrientationTracker] ${webkitCompassHeading}`);
            this.handleRawHeading(webkitCompassHeading);
        } else {
            debug("[OrientationTracker] emitting nothing, invalid data");
        }
    };

    /**
     * Normalizes a raw sensor reading and updates the smoothed heading target.
     * Small changes are ignored to suppress compass jitter.
     */
    private handleRawHeading = (rawHeading: number): void => {
        const normalized = OrientationTracker.normalizeHeading(rawHeading);

        if (this.currentHeading === undefined) {
            this.currentHeading = normalized;
            this.targetHeading = normalized;
            this.notify({ heading: normalized });
            return;
        }

        const delta = OrientationTracker.shortestDelta(
            this.currentHeading,
            normalized,
        );

        /**
         * only animate if its a big enough delta
         */
        if (Math.abs(delta) < 5) {
            return;
        }

        this.targetHeading = normalized;

        if (this.animationFrame === undefined) {
            this.animate();
        }
    };

    /**
     * Animates the current heading toward the latest target heading and emits
     * intermediate values for smooth map/cone rotation.
     */
    private animate = (): void => {
        if (
            this.currentHeading === undefined ||
            this.targetHeading === undefined
        ) {
            this.animationFrame = undefined;
            return;
        }

        const delta = OrientationTracker.shortestDelta(
            this.currentHeading,
            this.targetHeading,
        );

        if (Math.abs(delta) < 0.3) {
            this.currentHeading = this.targetHeading;
            this.notify({ heading: this.currentHeading });
            this.animationFrame = undefined;
            return;
        }

        const step = delta * 0.15;
        this.currentHeading = OrientationTracker.normalizeHeading(
            this.currentHeading + step,
        );
        this.notify({ heading: this.currentHeading });
        this.animationFrame = requestAnimationFrame(this.animate);
    };

    /**
     * Wraps any heading value into [0, 360).
     */
    private static normalizeHeading = (heading: number): number => {
        return ((heading % 360) + 360) % 360;
    };

    /**
     * Returns the smallest signed angular difference from `from` to `to`.
     * Result is in [-180, 180).
     */
    private static shortestDelta = (from: number, to: number): number => {
        return ((to - from + 540) % 360) - 180;
    };

    private isTracking = false;
    private currentHeading: number | undefined;
    private targetHeading: number | undefined;
    private animationFrame: number | undefined;
}
