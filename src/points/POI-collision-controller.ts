import type { LocationPoint, LocationTracker } from "../location";
import type { POI } from "../types";
import L from "leaflet";
import { debug } from "../utils";
import type { POITracker } from "./POI-tracker";

type POICollisionControllerParams = {
    POIs: POI[];
    locationTracker: LocationTracker;
    poiTracker: POITracker;
    deselectOnExit?: boolean;
    minCheckDistanceMeters?: number;
};

export class POICollisionController {
    /**
     * Stores POIs with prebuilt bounds and subscribes to live location updates.
     * Collision checks then run through `LatLngBounds.contains()` only.
     */
    constructor({
        POIs,
        locationTracker,
        poiTracker,
        deselectOnExit = false,
        minCheckDistanceMeters = 0.75,
    }: POICollisionControllerParams) {
        this.POIs = POIs;
        this.poiById = new Map(POIs.map((poi) => [poi.id, poi]));
        this.poiTracker = poiTracker;
        this.deselectOnExit = deselectOnExit;
        this.minCheckDistanceMeters = minCheckDistanceMeters;

        locationTracker.addListener(this.handleLocation);
    }

    /**
     * Handles each location point, skips tiny movements, and emits POI enter/exit
     * transitions. `select()` is called only when entering a different POI.
     */
    private handleLocation = ({ latitude, longitude }: LocationPoint): void => {
        const currentPoint = { latitude, longitude };

        if (this.lastCheckedPoint) {
            // Ignore tiny movement to avoid collision checks on GPS noise.
            const distance = L.latLng(
                this.lastCheckedPoint.latitude,
                this.lastCheckedPoint.longitude,
            ).distanceTo(L.latLng(latitude, longitude));
            if (distance < this.minCheckDistanceMeters) {
                debug(
                    "[POICollisionController] distance not great enough, returning early",
                );
                return;
            }
        }

        this.lastCheckedPoint = currentPoint;

        // Determine which POI currently contains this location.
        const containingPOI = this.findContainingPOI(latitude, longitude);

        if (containingPOI) {
            // Still in the same POI, so don't fire duplicate select events.
            if (containingPOI.id === this.activeCollisionPOIId) {
                return;
            }

            debug(
                `[POICollisionController] entered ${containingPOI.id}, selecting`,
            );
            this.activeCollisionPOIId = containingPOI.id;
            if (!this.poiTracker.hasViewed(containingPOI)) {
                this.poiTracker.select(containingPOI);
            }
            return;
        }

        // Not inside any POI and no active collision POI means no transition.
        if (!this.activeCollisionPOIId) {
            return;
        }

        debug(
            `[POICollisionController] exited ${this.activeCollisionPOIId}, clearing active collision`,
        );
        this.activeCollisionPOIId = undefined;

        if (this.deselectOnExit) {
            this.poiTracker.deselectActive();
        }
    };

    /**
     * Finds which POI contains the point using `LatLngBounds.contains()`.
     *
     * Fast path: check the currently active POI first.
     */
    private findContainingPOI(
        latitude: number,
        longitude: number,
    ): POI | undefined {
        if (this.activeCollisionPOIId) {
            const active = this.poiById.get(this.activeCollisionPOIId);
            // Fast path: user commonly remains in the current POI.
            if (active && active.bounds.contains([latitude, longitude])) {
                return active;
            }
        }

        for (const poi of this.POIs) {
            if (poi.id === this.activeCollisionPOIId) {
                // Already tested in the fast path above.
                continue;
            }
            // Bounds-only collision check.
            if (poi.bounds.contains([latitude, longitude])) {
                return poi;
            }
        }

        return undefined;
    }

    private readonly POIs: POI[];
    private readonly poiById: Map<string, POI>;
    private readonly poiTracker: POITracker;
    private readonly deselectOnExit: boolean;
    private readonly minCheckDistanceMeters: number;

    private activeCollisionPOIId: string | undefined;
    private lastCheckedPoint:
        | Pick<LocationPoint, "latitude" | "longitude">
        | undefined;
}
