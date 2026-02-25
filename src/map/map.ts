import type { POI } from "../types";
import L, { TileLayer, type MapOptions } from "leaflet";
import { poiMarker } from "./components/poi-marker";
import { poiTrackerInstance } from "../points";
import { debug } from "../utils";
import { PositionTracker } from "../location/position-tracker";

type MapConfiguartion = {
    POIs: Array<POI>;
    initialLocation: [number, number];
    initialZoom: number;
    defaultLayer: TileLayer;
    layers?: Record<string, TileLayer>;
};

export const initMap = (config: MapConfiguartion) => {
    const map = L.map(
        "map",
        {
            rotate: true,
            bearing: 180, // start upside down
            touchRotate: true,
            rotateControl: undefined,
        } as unknown as MapOptions /* these come from the extension */,
    )
        .setView(config.initialLocation, config.initialZoom)
        .on("click", () => {
            // deselect the active POI when the user clicks outside on the map
            poiTrackerInstance.deselectActive();
        });

    config.defaultLayer.addTo(map);

    if (config.layers /* TODO: && buildFlag === "debug" */) {
        L.control.layers(config.layers).addTo(map);
    }

    config.POIs.forEach((POI, index) => {
        const { lattitude, longitude } = POI.location;

        L.marker([lattitude, longitude], {
            icon: poiMarker({ number: index + 1, POI }),
        })
            .addTo(map)
            .on("click", () => {
                poiTrackerInstance.select(POI);
            });
    });

    const positionTracker = new PositionTracker();

    map.addLayer(positionTracker.layer);

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
