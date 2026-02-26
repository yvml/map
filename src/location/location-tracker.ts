import L from "leaflet";
import { debug, info } from "../utils";
import { locationStoreInstance } from "./location-store";
import type { LocationPoint } from "./types";

type Listener = (point: LocationPoint) => void;

export class LocationTracker {
    /**
     * Initalize position tracker and EventListener
     */
    constructor() {
        // TODO: move this out
        this.start();

        document.addEventListener(
            "visibilitychange",
            this.handleVisibilityChange,
        );

        // Initalize map elements
        // TODO: map elements in this class feels like tight coupling
        const storedPoints = locationStoreInstance
            .getAll()
            .map(({ latitude, longitude }) => L.latLng(latitude, longitude));

        this.pathLine = L.polyline(storedPoints, {
            color: "blue",
            weight: 4,
            smoothFactor: 1.5,
        });

        this.layer = L.layerGroup([
            this.pathLine, // this one exists immediately
        ]);
    }

    public subscribe(listener: Listener) {
        this.listeners.add(listener);
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

        document.addEventListener(
            "visibilitychange",
            this.handleVisibilityChange,
        );
    };

    /**
     * end tracking based on the current watchId
     */
    public stop = (): void => {
        if (this.watchId !== undefined) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = undefined;
        }

        document.removeEventListener(
            "visibilitychange",
            this.handleVisibilityChange,
        );
    };

    /**
     * Manually redraw the location circle during map movements.
     *
     * Intended to work around iOS pinch-zoom quirks by forcing a vector
     * redraw instead of changing radius/latlng.
     */
    public zoomAnimaitonCallback = (): void => {
        if (this.locationMarker) {
            this.locationMarker.redraw();
        }
        // this could be very expensive
        this.pathLine.redraw();
    };

    private handleVisibilityChange = () => {
        if (document.hidden) {
            // TODO: subscribe and move elsewhere?
            locationStoreInstance.saveToStorage();
            this.stop();
        } else {
            this.start();
        }
    };

    private handlePosition = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;

        this.pathLine.addLatLng([latitude, longitude]);

        if (!this.locationMarker) {
            // TODO: move to  location-layer
            debug("adding locationMarker", position.coords);
            this.locationMarker = L.circle([latitude, longitude], {
                radius: accuracy, // meters
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

        const point = {
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
        };

        locationStoreInstance.maybeAdd(point);

        for (const listener of this.listeners) {
            listener(point);
        }
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
    private listeners = new Set<Listener>();
}
