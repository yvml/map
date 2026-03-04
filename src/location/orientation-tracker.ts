import { Observable } from "../observable";
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
                    console.error("Orientation permission error:", error);
                    return false;
                }
            } else {
                this.startOrientationTracking();
                return true;
            }
        } catch (e) {
            warn(e);
            return false;
        }
    };

    private startOrientationTracking = () => {
        if ("ondeviceorientationabsolute" in window) {
            /**
             * neweer android devices/chrome will return a north aligned alpha on this event
             */
            window.addEventListener(
                "deviceorientationabsolute",
                this.orientationListener,
                true,
            );
        }
        if ("ondeviceorientation" in window) {
            /**
             * iOS will return a non-standard `webkitCompassHeading` on this event which is north aligned
             */
            window.addEventListener(
                "deviceorientation",
                this.orientationListener,
                true,
            );
        } else {
            throw new Error(
                "orientation tracking not supported on this browser",
            );
        }
    };

    private orientationListener = ({
        absolute,
        alpha,
        webkitCompassHeading,
    }: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
        if (absolute === true && alpha !== null) {
            debug(
                `[OrientationTracker] absolute event, alpha non null, emitting alpha ${alpha}`,
            );
            this.notify({
                heading: alpha,
            });
        } else if (webkitCompassHeading !== undefined) {
            debug(
                `[OrientationTracker] webkitCompassHeading ${webkitCompassHeading}`,
            );
            this.notify({
                heading: webkitCompassHeading,
            });
        } else {
            warn(
                `[OrientationTracker] non device heading emitted, not notifying ${alpha} ${absolute} ${webkitCompassHeading}`,
            );
        }
    };
}
