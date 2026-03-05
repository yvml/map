import { debug, getElementOrThrow, info } from "../utils";
import type { LocationTracker } from "./location-tracker";
import type {
    OrientationTracker,
    OrientationData,
} from "./orientation-tracker";
import type { LocationPoint } from "./types";
import L, { LatLng } from "leaflet";

type LocationControllerParams = {
    locationTracker: LocationTracker;
    orientationTracker: OrientationTracker;
    initialPoints?: LatLng[];
};
export class LocationController {
    private static readonly headingIconSrc = `${import.meta.env.BASE_URL}icons/location-arrow.svg`;

    constructor({
        locationTracker,
        orientationTracker,
        initialPoints,
    }: LocationControllerParams) {
        this.pathLine = L.polyline(initialPoints ?? [], {
            color: "black",
            weight: 20,
            smoothFactor: 2,
            opacity: 0.5,
            //dashArray: "20 40", // dash length, gap length (in pixels)
        });

        this.layer = L.layerGroup([this.pathLine]);

        getElementOrThrow({ id: "locate-button" }).addEventListener(
            "click",
            () => {
                debug(
                    `[LocationController] locate button clicked, begin tracking`,
                );

                // TODO: this will return a boolean
                // true: tracking began successfully
                // false: it didnt (permission denied, out of bounds, bad accuracy)
                //
                //on false, show error based on reason
                //dont track orientation
                locationTracker.start();

                orientationTracker
                    .requestOrientationPermission()
                    .then((result) => {
                        info(
                            `[OrientationTracker] requestOrientationPermission: ${result}`,
                        );
                    });
            },
        );

        locationTracker.addListener(this.handleNewLocation);
        orientationTracker.addListener(this.handleNewOrientation);
    }

    private handleNewLocation = ({
        latitude,
        longitude,
        accuracy,
    }: LocationPoint) => {
        debug("[LocationController] new location added");
        this.pathLine.addLatLng([latitude, longitude]);

        this.updateLocationMarker({ latitude, longitude, accuracy });

        this.updateHeadingMarker();
    };

    private updateLocationMarker = ({
        latitude,
        longitude,
        accuracy,
    }: Pick<LocationPoint, "latitude" | "longitude" | "accuracy">): void => {
        this.latestLocation = L.latLng(latitude, longitude);
        if (!this.locationMarker) {
            debug(`adding locationMarker ${latitude}) ${longitude}`);
            this.locationMarker = L.circle(this.latestLocation, {
                radius: accuracy, // meters
                color: "#1e90ff",
                weight: 1,
                fillColor: "#1e90ff",
                fillOpacity: 0.15,
            });
            this.layer.addLayer(this.locationMarker);
        } else {
            debug("[LocationController] updating existing locationMarker");
            this.locationMarker.setLatLng(this.latestLocation);
            this.locationMarker.setRadius(accuracy);
        }
    };

    private handleNewOrientation = ({ heading }: OrientationData) => {
        //debug("[LocationController] new orientation heading received", heading);
        this.latestHeading = heading;
        this.updateHeadingMarker();
    };

    /**
     * Creates or updates the heading icon once both location and heading
     * are available.
     */
    private updateHeadingMarker = (): void => {
        if (!this.latestLocation || this.latestHeading === undefined) {
            return;
        }

        if (!this.headingMarker) {
            this.headingMarker = L.marker(this.latestLocation, {
                icon: L.divIcon({
                    className: "location-heading-marker",
                    // TODO: explore not using raw html here
                    html: `<img src="${LocationController.headingIconSrc}" alt="" aria-hidden="true" class="location-heading-icon" />`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                }),
                interactive: false,
            });
            this.layer.addLayer(this.headingMarker);
        } else {
            this.headingMarker.setLatLng(this.latestLocation);
        }

        const markerElement = this.headingMarker.getElement();
        if (markerElement) {
            markerElement.style.setProperty(
                "--heading-deg",
                `${this.latestHeading}deg`,
            );
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
        // TODO: this could be very expensive
        this.pathLine.redraw();
    };

    private pathLine: L.Polyline;
    private locationMarker: L.Circle | undefined;
    private headingMarker: L.Marker | undefined;
    private latestHeading: number | undefined;
    private latestLocation: LatLng | undefined;
    public layer: L.LayerGroup;
}
