import type { POI } from "../types";
import L, { Layer, TileLayer, type MapOptions } from "leaflet";
import { poiMarker } from "./components/poi-marker";
import { POITracker } from "../points";
import { debug } from "../utils";
import { LocationTracker } from "../location";

type MapConfiguration = {
    initialLocation: [number, number];
    initialZoom: number;
    defaultLayer: TileLayer;
    tileLayers?: Record<string, TileLayer>;
    mapOptions: MapOptions & {
        /* from leaflet-rotate */
        rotate: boolean;
        bearing: number;
        touchRotate: boolean;
        rotateControl: unknown;
    };
};

type MapParameters = {
    config: MapConfiguration;
    providers: {
        poiTracker: POITracker;
        locationTracker: LocationTracker;
    };
    additionalLayers?: Layer[];
    POIs: Array<POI>;
};

export const initMap = (params: MapParameters) => {
    const { config } = params;
    const { poiTracker, locationTracker } = params.providers;

    const map = L.map("map", config.mapOptions)
        .setView(config.initialLocation, config.initialZoom)
        .on("click", () => {
            // deselect the active POI when the user clicks outside on the map
            poiTracker.deselectActive();
        });

    config.defaultLayer.addTo(map);

    debug(`[map] adding additionalLayers: ${params.additionalLayers}`);
    params.additionalLayers?.forEach((layer) => map.addLayer(layer));

    // Force a redraw of the accuracy circle during map movements (especially iOS pinch-zoom).
    map.on("move", locationTracker.zoomAnimationCallback);

    // add UI widget for holding onto layers
    if (config.tileLayers /* TODO: && buildFlag === "debug" */) {
        L.control.layers(config.tileLayers).addTo(map);
    }

    // TODO: move this into a layer exposed on the POIControlller
    params.POIs.forEach((POI, index) => {
        const { latitude, longitude } = POI.location;

        L.marker([latitude, longitude], {
            icon: poiMarker({ number: index + 1, POI }),
        })
            .addTo(map)
            .on("click", () => {
                poiTracker.select(POI);
            });
    });

    // Safari (macOS/iOS) can change viewport when the location permission dialog
    // appears or closes, so Leaflet’s cached size becomes wrong. Recompute it.
    const recomputeMapSize = () => {
        debug("[map] recomputeMapSize called");
        map.invalidateSize();
    };

    // Fallback: fix size on first user interaction (e.g. first tap/click) in case
    // the permission dialog didn’t fire or viewport settled later (Safari).
    const onFirstInteraction = () => {
        recomputeMapSize();
        map.off("click", onFirstInteraction);
    };
    map.on("click", onFirstInteraction);

    // Safari often resizes viewport after the permission dialog; recalc after a delay.
    const delayedFix = () => {
        recomputeMapSize();
    };
    setTimeout(delayedFix, 400);
    setTimeout(delayedFix, 1200);
};
