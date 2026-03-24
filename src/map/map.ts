import L, { Layer, TileLayer, type MapOptions } from "leaflet";
import { POITracker } from "../points";
import { debug } from "../utils";
import type { LocationController } from "../location/location-controller";

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
        locationController: LocationController;
    };
    additionalLayers?: Layer[];
};

export const initMap = (params: MapParameters) => {
    const { config } = params;
    const { poiTracker, locationController } = params.providers;

    const map = L.map("map", config.mapOptions)
        .setView(config.initialLocation, config.initialZoom)
        .on("click", () => {
            // deselect the active POI when the user clicks outside on the map
            poiTracker.deselectActive();
        });

    config.defaultLayer.addTo(map);

    debug(`[map] adding additionalLayers: ${params.additionalLayers}`);
    params.additionalLayers?.forEach((layer) => map.addLayer(layer));

    // Force a redraw of the accuracy circle during zooming without doing extra
    // work during pan/rotate gestures on iOS.
    map.on("zoom", locationController.zoomAnimationCallback);

    // add UI widget for holding onto layers
    if (config.tileLayers /* TODO: && buildFlag === "debug" */) {
        L.control.layers(config.tileLayers).addTo(map);
    }

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

    return map;
};
