import { getConfigStore } from "../config";
import type { POI } from "../types";
import { debug } from "../utils";
import L from "leaflet";

type POIBoundsControllerParams = {
    POIs: POI[];
};

const poiToBoundsLayer = (poi: POI) =>
    L.rectangle(poi.bounds, {
        color: "#ff3b30",
        weight: 2,
        fill: false,
        interactive: false,
    });

export class POIBoundsController {
    constructor({ POIs }: POIBoundsControllerParams) {
        const configStore = getConfigStore();

        configStore.addListener((event) => {
            if (event.key !== "features") {
                return;
            }

            const { key, value: showLocationBounds } = event.value;
            if (key !== "locationBounds") {
                return;
            }

            this.updateLayer(showLocationBounds);
        });

        this.POIs = POIs;
        this.layer = L.layerGroup();

        this.updateLayer(configStore.getFeature("locationBounds").value);
    }

    private updateLayer(show: boolean): void {
        this.layer.clearLayers();

        if (!show) {
            return;
        }

        debug("[POIBoundsController] showing POI bounds");
        this.POIs.forEach((poi) => this.layer.addLayer(poiToBoundsLayer(poi)));
    }

    public layer: L.LayerGroup;
    private readonly POIs: POI[];
}
