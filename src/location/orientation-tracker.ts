export class OrientationTracker {
    constructor() {}

    public requestOrientationPermission = async (): Promise<boolean> => {
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
            // Android and older browsers
            this.startOrientationTracking();
            return true;
        }
    };

    private startOrientationTracking() {}
}
