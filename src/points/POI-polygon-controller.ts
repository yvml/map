import type { POI } from "../types";
import L from "leaflet";

type POIPolygonControllerParams = {
    POIs: POI[];
};

type POIWithPolygon = POI & { polygon: NonNullable<POI["polygon"]> };

const hasPolygon = (poi: POI): poi is POIWithPolygon =>
    poi.polygon !== undefined;

const poiToPolygon = (poi: POIWithPolygon) =>
    L.polygon(poi.polygon.path, poi.polygon.options).bindTooltip(poi.title, {
        permanent: true,
        direction: "center",
        className: "polygon-label",
    });

export class POIPolygonController {
    constructor({ POIs }: POIPolygonControllerParams) {
        // TODO: attach listener

        this.layer = L.layerGroup(POIs.filter(hasPolygon).map(poiToPolygon));
    }

    public layer: L.LayerGroup;
}
