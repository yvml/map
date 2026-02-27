import type { POI } from "../types";
import L from "leaflet";
import { debug } from "../utils";

type POIPolygonControllerParams = {
    POIs: POI[];
};
export class POIPolygonController {
    constructor({ POIs }: POIPolygonControllerParams) {
        // TODO: attach listener

        type POIPolygon = {
            path: L.LatLngTuple[];
            color: string;
        };
        // initalize layer

        const polygons = POIs.map<POIPolygon | undefined>((poi) => poi.polygon)
            .filter((polygon) => polygon !== undefined) // TODO: make polygon non optional
            .map(({ path, color }) => L.polygon(path, { color }));

        debug(polygons);
        this.layer = L.layerGroup(polygons);
    }

    public layer: L.LayerGroup;
}
