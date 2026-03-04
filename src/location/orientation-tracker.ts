import { Observable } from "../observable/observable";
import { debug, warn } from "../utils";

export type OrientationData = {
    heading: number;
};

export class OrientationTracker extends Observable<OrientationData> {
    constructor() {
        super();
    }

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
        // not in the standard lib
        if ("ondeviceorientationabsolute" in (window as object)) {
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
    };

    private orientationListener = ({
        absolute,
        alpha,
        webkitCompassHeading,
    }: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
        if (absolute === true && alpha !== null) {
            debug(`[OrientationTracker] ${absolute} ${alpha}`);
            this.notify({
                heading: alpha,
            });
        } else if (webkitCompassHeading !== undefined) {
            debug(`[OrientationTracker] ${webkitCompassHeading}`);
            this.notify({
                heading: webkitCompassHeading,
            });
        } else {
            debug("[OrientationTracker] emitting nothing, invalid data");
        }
    };
}
