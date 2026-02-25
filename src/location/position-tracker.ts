import L from "leaflet";
import { debug, info } from "../utils";
import { locationStoreInstance } from "./location-store";

export class PositionTracker {
    /**
     * Initalize position tracker and EventListener
     */
    constructor() {
        this.watchId = this.startTracking();
        debug(`[PositionTracker] startTracking began -- ${this.watchId}`);

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.stopTracking();
            } else {
                this.startTracking();
            }
        });

        // Initalize map elements
        // TODO: map elements in this class feels like tight coupling
        // TODO: read from local storage
        this.pathLine = L.polyline([], {
            color: "blue",
            weight: 4,
            smoothFactor: 1.5,
        });

        this.layer = L.layerGroup([
            this.pathLine, // this one exists immediately
        ]);
    }

    /**
     * start tracking via navigator.geolocation
     */
    public startTracking = (): number => {
        return navigator.geolocation.watchPosition(
            this.handlePosition,
            this.handleError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 2000, // TODO: see what this does
            },
        );
    };

    /**
     * end tracking based on the current watchId
     */
    public stopTracking = (): void => {
        if (this.watchId !== undefined) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = undefined;
        }
    };

    private handlePosition = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;

        this.pathLine.addLatLng([latitude, longitude]);

        if (!this.locationMarker) {
            debug("adding locationMarker", position.coords);
            this.locationMarker = L.circle([0, 0], {
                radius: 0, // meters
                color: "#1e90ff",
                weight: 1,
                fillColor: "#1e90ff",
                fillOpacity: 0.15,
            });
            this.layer.addLayer(this.locationMarker);
        } else {
            this.locationMarker.setLatLng([latitude, longitude]);
            this.locationMarker.setRadius(accuracy);
        }

        locationStoreInstance.maybeAdd({
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
        });
    };

    private handleError = (error: GeolocationPositionError) => {
        switch (error.code) {
            case GeolocationPositionError.PERMISSION_DENIED: {
                info("permission denined", error);
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
    private pathLine: L.Polyline;
    private locationMarker: L.Circle | undefined;
    public layer: L.LayerGroup;
}
