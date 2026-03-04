import { debug } from "../utils";
import type { LocationTracker } from "./location-tracker";
import type { LocationPoint } from "./types";
import L, { LatLng } from "leaflet";

type LocationControllerParams = {
    locationTracker: LocationTracker;
    initialPoints?: LatLng[];
};
export class LocationController {
    constructor({ locationTracker, initialPoints }: LocationControllerParams) {
        this.pathLine = L.polyline(initialPoints ?? [], {
            color: "blue",
            weight: 4,
            smoothFactor: 1.5,
        });

        this.layer = L.layerGroup([
            this.pathLine, // this one exists immediately
        ]);

        locationTracker.addListener(this.handleNewLocation);
    }

    private handleNewLocation = ({
        latitude,
        longitude,
        accuracy,
    }: LocationPoint) => {
        debug("[LocationController] new location added");
        this.pathLine.addLatLng([latitude, longitude]);

        // TODO: compass

        if (!this.locationMarker) {
            debug(`adding locationMarker ${latitude}) ${longitude}`);
            this.locationMarker = L.circle([latitude, longitude], {
                radius: accuracy, // meters
                color: "#1e90ff",
                weight: 1,
                fillColor: "#1e90ff",
                fillOpacity: 0.15,
            });
            this.layer.addLayer(this.locationMarker);
        } else {
            debug("[LocationController] updating existing locationMarker");
            this.locationMarker.setLatLng([latitude, longitude]);
            this.locationMarker.setRadius(accuracy);
        }
    };

    /**
     * Manually redraw the location circle during map movements.
     *
     * Intended to work around iOS pinch-zoom quirks by forcing a vector
     * redraw instead of changing radius/latlng.
     */
    public zoomAnimationCallback = (): void => {
        if (this.locationMarker) {
            this.locationMarker.redraw();
        }
        // this could be very expensive
        this.pathLine.redraw();
    };

    private pathLine: L.Polyline;
    private locationMarker: L.Circle | undefined;
    public layer: L.LayerGroup;
}
