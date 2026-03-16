import { debug, info } from "../utils";
import type { LocationPoint } from "./types";
import { Observable } from "../observable";
import { getConfig } from "../config";

type StartResult =
    | {
          status: "success";
          initialLocation: LocationPoint;
      }
    | {
          status: "failure";
          reason:
              | "out-of-bounds"
              | "permission-denied"
              | "unknown"
              | "position-unavailable"
              | "timeout"
              | "already-tracking";
      };

const errorToResult = (error: unknown): StartResult => {
    const reason = (() => {
        if (!(error instanceof GeolocationPositionError)) {
            return "unknown";
        }
        switch (error.code) {
            case GeolocationPositionError.PERMISSION_DENIED: {
                return "permission-denied";
            }
            case GeolocationPositionError.POSITION_UNAVAILABLE: {
                return "position-unavailable";
            }
            case GeolocationPositionError.TIMEOUT: {
                return "timeout";
            }
            default: {
                return "unknown";
            }
        }
    })();

    return {
        status: "failure",
        reason,
    };
};

export class LocationTracker extends Observable<LocationPoint> {
    /**
     * Initialize EventListener
     */
    constructor() {
        super();

        // TODO: move this out
        document.addEventListener(
            "visibilitychange",
            this.handleVisibilityChange,
        );
    }

    /**
     * Start tracking via navigator.geolocation and return the initial location or an error.
     */
    public start = async (): Promise<StartResult> => {
        if (this.watchId !== undefined) {
            return {
                status: "failure",
                reason: "already-tracking",
            };
        }

        try {
            // grab intiial location
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 2000,
                    });
                },
            );

            const initialLocation = {
                ...position.coords,
                timestamp: Date.now(),
            };

            if (!this.isWithinBounds(initialLocation)) {
                return {
                    status: "failure",
                    reason: "out-of-bounds",
                };
            }

            const watchError = await new Promise((_, reject) => {
                this.watchId = navigator.geolocation.watchPosition(
                    this.handlePosition,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 2000, // TODO: see what this does
                    },
                );
            });

            if (watchError) {
                return errorToResult(watchError);
            }

            debug(`[LocationTracker] watch started: ${this.watchId}`);
            return {
                status: "success",
                initialLocation: initialLocation,
            };
        } catch (error) {
            const result = errorToResult(error);
            //this.notify(result);
            return result;
        }
    };

    private isWithinBounds = ({
        latitude,
        longitude,
    }: Pick<LocationPoint, "latitude" | "longitude">) => {
        const bounds = getConfig().getBounds();
        if (bounds && !bounds.contains([latitude, longitude])) {
            info("[LocationTracker] location outside bounds", {
                latitude,
                longitude,
            });
            return false;
        }
        return true;
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
            // TODO: only if the user has hit the locate button
            this.start();
        }
    };

    private handlePosition = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (!this.isWithinBounds(position.coords)) {
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

    private watchId: number | undefined;
}
