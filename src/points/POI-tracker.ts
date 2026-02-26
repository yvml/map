import { Observable } from "../observable";
import type { POI } from "../types";
import { debug } from "../utils";

export class POITracker extends Observable<POI | undefined> {
    select(poi: POI) {
        if (poi.id === this.activePOI?.id) {
            debug("[POITracker] POI already active, returning early");
            return;
        }

        this.deselectActive();
        this.activePOI = poi;

        this.viewed.add(poi);

        this.notify(poi);
    }

    deselectActive() {
        debug("[POITracker] deselectActive");

        if (this.activePOI) {
            this.notify(undefined); // notify of deselection
        }

        this.activePOI = undefined;
    }

    private activePOI: POI | undefined = undefined;
    private viewed: Set<POI> = new Set();
}
