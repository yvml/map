import type { POI } from "../types";
import L, { Layer, TileLayer, type MapOptions } from "leaflet";
import { poiMarker } from "./components/poi-marker";
import { POITracker } from "../points";
import { debug } from "../utils";
import type { LocationController } from "../location/location-controller";
import type { LocationTracker, OrientationTracker } from "../location";

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

        orientationTracker: OrientationTracker;
        locationTracker: LocationTracker;

        locationController: LocationController;
    };
    additionalLayers?: Layer[];
    POIs: Array<POI>;
};

export const initMap = (params: MapParameters) => {
    const { config } = params;
    const {
        poiTracker,
        locationController,
        orientationTracker,
        locationTracker,
    } = params.providers;

    const map = L.map("map", config.mapOptions).setView(
        config.initialLocation,
        config.initialZoom,
    );

    // TODO: maybe these should go elsewhere

    let lastHeading: number | undefined;
    let animationFrame: number | undefined;

    orientationTracker.addListener(({ heading }) => {
        const normalized = ((heading % 360) + 360) % 360;

        // Invert for map rotation
        const target = (360 - normalized) % 360;

        if (lastHeading === undefined) {
            debug(`[map] initial bearing ${target}`);
            lastHeading = target;
            map.setBearing(target);
            return;
        }

        // shortest angular delta (-180 → 180)
        let delta = target - lastHeading;
        delta = ((delta + 540) % 360) - 180;

        if (Math.abs(delta) < 5) {
            debug(`[map] ignored jitter delta=${delta.toFixed(2)}`);
            return;
        }

        debug(
            `[map] animating from ${lastHeading.toFixed(1)} → ${target.toFixed(
                1,
            )} (delta=${delta.toFixed(1)})`,
        );

        const start = lastHeading;
        const end = lastHeading + delta;
        const duration = 120;
        const startTime = performance.now();

        if (animationFrame !== undefined) {
            debug(`[map] cancel previous animation`);
            cancelAnimationFrame(animationFrame);
            animationFrame = undefined;
        }

        const animate = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);

            // easeOut cubic
            const eased = 1 - Math.pow(1 - t, 3);

            const current = start + delta * eased;
            const wrapped = ((current % 360) + 360) % 360;

            map.setBearing(wrapped);

            if (t < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                lastHeading = ((end % 360) + 360) % 360;
                animationFrame = undefined;
                debug(`[map] animation complete at ${lastHeading.toFixed(1)}`);
            }
        };

        animationFrame = requestAnimationFrame(animate);
    });

    locationTracker.addListener(({ latitude, longitude }) => {
        // TODO: only if the location is within the bounds -- or should that happen higher up?
        map.setView([latitude, longitude], map.getZoom(), {
            animate: true,
        });
    });
    // this conflicts with the polygons. TODO
    //.on("click", () => {
    //    // deselect the active POI when the user clicks outside on the map
    //    //poiTracker.deselectActive();
    //});

    config.defaultLayer.addTo(map);

    debug(`[map] adding additionalLayers: ${params.additionalLayers}`);
    params.additionalLayers?.forEach((layer) => map.addLayer(layer));

    // Force a redraw of the accuracy circle during map movements (especially iOS pinch-zoom).
    map.on("move", locationController.zoomAnimationCallback);

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
