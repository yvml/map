import { tileLayers } from "./map/layers";
import { initMap } from "./map/map";
import {
    POIBoundsController,
    POICollisionController,
    POIController,
    POIs,
    POITracker,
} from "./points";
import { SettingsMenu } from "./settings";
import { LocationStore, LocationTracker, OrientationTracker } from "./location";
import { ConsoleTracker } from "./console";
import { getConfigStore, initConfig } from "./config";

import "./styles.css"; // TODO: remove tailwind and import normally

import "leaflet-rotate"; // allows map rotation

import "leaflet.offline"; // TODO: remove

import "leaflet-edgebuffer"; // prevents tile flashing

import { debug } from "./utils";
import { LocationController } from "./location/location-controller";
import { MapMovementController } from "./map/map-movement-controller";

initConfig();
const configStore = getConfigStore();

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
 * controls showing the popup and marking the circles
 */
new POIController({ poiTracker });

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
    POIs,
    config: {
        initialLocation: [34.181922, -116.414579],
        initialZoom: 21,
        defaultLayer: tileLayers.drone,
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
    additionalLayers: [locationController.layer, boundsController.layer],
    providers: {
        poiTracker,
        locationController,
    },
});

new MapMovementController({
    map,
    locationTracker,
    orientationTracker,
    configStore,
});

//const bounds = configStore.getBounds();
//// TODO: temporary -- maybe setBounds
//if (bounds) {
//    L.rectangle(bounds, {
//        color: "#ff3b30",
//        weight: 2,
//        fill: false,
//        interactive: false,
//    }).addTo(map);
//}

setInterval(() => {
    locationStore.saveToStorage();
}, 15000); // every 15 seconds, save location data to storage

document.addEventListener("visibilitychange", () => {
    debug("[main] handleVisibilityChange");
    // save location when the user minimizes
    locationStore.saveToStorage();

    locationTracker.handleVisibilityChange();
});

window.addEventListener("beforeunload", () => {
    orientationTracker.stopOrientationTracking();
});
