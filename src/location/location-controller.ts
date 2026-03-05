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

        this.layer = L.layerGroup([
            this.pathLine, // this one exists immediately
        ]);

        getElementOrThrow({ id: "locate-button" }).addEventListener(
            "click",
            () => {
                debug(
                    `[LocationController] locate button clicked, begin tracking`,
                );

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

        this.updateOrientationCone();
    };

    private handleNewOrientation = ({ heading }: OrientationData) => {
        debug("[LocationController] new orientation heading received", heading);
        this.latestHeading = heading;
        this.updateOrientationCone();
    };

    /**
     * Creates or updates the directional cone once both location and heading
     * are available.
     */
    private updateOrientationCone = (): void => {
        if (!this.latestLocation || this.latestHeading === undefined) {
            return;
        }

        const points = this.buildConePolygon({
            center: this.latestLocation,
            heading: this.latestHeading,
            radiusMeters: 5,
            spreadDegrees: 90,
            arcSegments: 12,
        });

        if (!this.orientationCone) {
            this.orientationCone = L.polygon(points, {
                color: "#1e90ff",
                weight: 1,
                fillColor: "#1e90ff",
                fillOpacity: 0.25,
                interactive: false,
            });
            this.layer.addLayer(this.orientationCone);
            return;
        }

        this.orientationCone.setLatLngs(points);
    };

    private buildConePolygon = ({
        center,
        heading,
        radiusMeters,
        spreadDegrees,
        arcSegments,
    }: {
        center: LatLng;
        heading: number;
        radiusMeters: number;
        spreadDegrees: number;
        arcSegments: number;
    }): Array<LatLng> => {
        // Start at the cone's left edge based on current heading.
        const startBearing = heading - spreadDegrees / 2;
        // Include center first so the polygon is anchored at user position.
        const points: Array<LatLng> = [center];

        // Sample points across the arc from left edge to right edge.
        for (let segment = 0; segment <= arcSegments; segment += 1) {
            const bearing =
                startBearing + (spreadDegrees * segment) / arcSegments;
            points.push(
                this.destinationPoint({
                    center,
                    bearingDegrees: bearing,
                    distanceMeters: radiusMeters,
                }),
            );
        }

        // Close the shape back to center to form a cone/sector polygon.
        points.push(center);
        return points;
    };

    private destinationPoint = ({
        center,
        bearingDegrees,
        distanceMeters,
    }: {
        center: LatLng;
        bearingDegrees: number;
        distanceMeters: number;
    }): LatLng => {
        const EARTH_RADIUS_METERS = 6371000;
        const toRadians = Math.PI / 180;
        const toDegrees = 180 / Math.PI;

        // Convert input coordinates and bearing to radians.
        const latitude = center.lat * toRadians;
        const longitude = center.lng * toRadians;
        const bearing = bearingDegrees * toRadians;
        const angularDistance = distanceMeters / EARTH_RADIUS_METERS;

        // Solve next latitude on a sphere for the given bearing + distance.
        const nextLatitude = Math.asin(
            Math.sin(latitude) * Math.cos(angularDistance) +
                Math.cos(latitude) *
                    Math.sin(angularDistance) *
                    Math.cos(bearing),
        );

        // Solve next longitude paired with the computed latitude.
        const nextLongitude =
            longitude +
            Math.atan2(
                Math.sin(bearing) *
                    Math.sin(angularDistance) *
                    Math.cos(latitude),
                Math.cos(angularDistance) -
                    Math.sin(latitude) * Math.sin(nextLatitude),
            );

        // Convert back to degrees and normalize longitude into [-180, 180].
        return L.latLng(
            nextLatitude * toDegrees,
            ((nextLongitude * toDegrees + 540) % 360) - 180,
        );
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
        if (this.orientationCone) {
            this.orientationCone.redraw();
        }
        // TODO: this could be very expensive
        this.pathLine.redraw();
    };

    private pathLine: L.Polyline;
    private locationMarker: L.Circle | undefined;
    private orientationCone: L.Polygon | undefined;
    private latestHeading: number | undefined;
    private latestLocation: LatLng | undefined;
    public layer: L.LayerGroup;
}
