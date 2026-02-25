import type { POI } from "../types";
import L, { TileLayer, type MapOptions } from "leaflet";
import { poiMarker } from "./components/poi-marker";
import { poiTrackerInstance } from "../points";
import { debug } from "../utils";
import { locationStoreInstance } from "../location/location-store";

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

    // TODO: orient map vertically

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

    // Safari (macOS/iOS) can change viewport when the location permission dialog
    // appears or closes, so Leaflet’s cached size becomes wrong. Recompute it.
    const recomputeMapSize = () => {
        debug("[map] recomputeMapSize called");
        map.invalidateSize();
    };

    map.locate({
        /* watch: true */
        // enableHighAccuracy ?
    });

    map.on("locationerror", (e) => {
        console.error(e);
        recomputeMapSize();
    });
    map.on("locationfound", (e) => {
        // TODO: remove previous circle, get orientation
        const radius = e.accuracy;

        L.circle(e.latlng, { radius }).addTo(map);
        // TODO: on first locationfound, should we center and recompute?

        const [latitude, longitude] = [e.latlng.lat, e.latlng.lng];

        locationStoreInstance.add({
            latitude: latitude,
            longitude: longitude,
            accuracy: e.accuracy,
            timestamp: Date.now(),
        });
        //recomputeMapSize();
    });

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
