import L from "leaflet";
import type { POI } from "../types";
import { getElementOrThrow } from "../utils";
import type { POITracker } from "./POI-tracker";
import { markerIdForPOI, poiMarker } from "./poi-marker";

/**
 * Owns the Leaflet marker layer for POIs.
 *
 * Responsibilities:
 * - create the on-map POI markers
 * - translate marker clicks into POITracker selections
 * - apply persistent selected-marker styling when POITracker changes
 */
export class POIMarkerController {
    constructor({ poiTracker, POIs }: { poiTracker: POITracker; POIs: POI[] }) {
        this.layer = L.layerGroup(
            POIs.map((POI, index) => {
                const { latitude, longitude } = POI.location;

                return L.marker([latitude, longitude], {
                    icon: poiMarker({ number: index + 1, POI }),
                }).on("click", () => {
                    poiTracker.select(POI);
                });
            }),
        );

        poiTracker.addListener((activePOI) => {
            if (activePOI) {
                const nextMarker = getElementOrThrow({
                    id: markerIdForPOI(activePOI),
                });
                nextMarker.style.opacity = "0.7";
            }
        });
    }

    public layer: L.LayerGroup;
}
