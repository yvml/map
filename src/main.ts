import { initConfig, getConfigStore } from "./config";
import { ConsoleTracker } from "./console";
import {
    LocationTracker,
    OrientationTracker,
    LocationStore,
    LocationController,
} from "./location";
import { initMap, tileLayers, MapMovementController } from "./map";
import { registerAssetCacheServiceWorker } from "./cache";
import {
    POITracker,
    POIPopupController,
    POIMarkerController,
    POIs,
    POICollisionController,
    POIBoundsController,
} from "./points";
import { SettingsMenu } from "./settings";
import { debug } from "./utils";

import "./styles.css"; // TODO: remove tailwind and import normally

import "leaflet-rotate"; // allows map rotation

import "leaflet.offline"; // TODO: remove

import "leaflet-edgebuffer"; // prevents tile flashing

initConfig();
const configStore = getConfigStore();
void registerAssetCacheServiceWorker();

new ConsoleTracker();
new SettingsMenu();

const poiTracker = new POITracker();
const locationTracker = new LocationTracker();
const orientationTracker = new OrientationTracker();

/**
 * store locations to the database
 */
const locationStore = new LocationStore({ locationTracker });

/**
 * controls showing walking path and current location dot
 */
const locationController = new LocationController({
    locationTracker,
    orientationTracker,
    initialPoints: locationStore.getAllLatLng(),
});

/**
 * popup/audio controller for the currently active POI
 */
new POIPopupController({ poiTracker });

/**
 * on-map marker layer for POIs
 */
const poiMarkerController = new POIMarkerController({ poiTracker, POIs });

/**
 * controls collision between live user location and POI bounds
 */
new POICollisionController({
    POIs,
    locationTracker,
    poiTracker,
});

/**
 * controls showing location bounds for POIs
 */
const boundsController = new POIBoundsController({ POIs });

const map = initMap({
    config: {
        initialLocation: [34.181922, -116.414579],
        initialZoom: 21,
        defaultLayer: tileLayers.newDrone,
        tileLayers,
        mapOptions: {
            rotate: true,
            bearing: 180, // start upside down
            touchRotate: true,
            zoomControl: false,
            rotateControl: undefined,
            zoomAnimation: true,
            markerZoomAnimation: true,
            preferCanvas: true,
        },
    },
    // TODO: baseclass for exposing a layer?
    additionalLayers: [
        locationController.layer,
        boundsController.layer,
        poiMarkerController.layer,
    ],
    providers: {
        poiTracker,
        locationController,
    },
});

poiMarkerController.updateForZoom(map.getZoom());
map.on("zoomend", () => {
    poiMarkerController.updateForZoom(map.getZoom());
});

new MapMovementController({
    map,
    locationTracker,
    orientationTracker,
    configStore,
    poiTracker,
});

setInterval(() => {
    locationStore.saveToStorage();
}, 15000); // every 15 seconds, save location data to storage

document.addEventListener("visibilitychange", () => {
    debug("[main] handleVisibilityChange");
    // save location when the user minimizes
    locationStore.saveToStorage();

    orientationTracker.handleVisibilityChange();
    locationTracker.handleVisibilityChange();
});

window.addEventListener("beforeunload", () => {
    orientationTracker.stopOrientationTracking();
});
