import { tileLayers } from "./map/layers";
import { initMap } from "./map/map";
import {
    POIController,
    POIPolygonController,
    POIs,
    POITracker,
} from "./points";
import { SettingsMenu } from "./settings";
import { LocationStore, LocationTracker, OrientationTracker } from "./location";
import { ConsoleTracker } from "./console";
import { initFeatureFlagProvider } from "./feature-flags";

import "./styles.css"; // TODO: remove tailwind and import normally

import "leaflet-rotate"; // allows map rotation

import "leaflet.offline"; // TODO: remove

import "leaflet-edgebuffer"; // prevents tile flashing

import { debug, info } from "./utils";
import { LocationController } from "./location/location-controller";

initFeatureFlagProvider();

new ConsoleTracker();
new SettingsMenu();

const poiTracker = new POITracker();
const locationTracker = new LocationTracker();
const orientationTracker = new OrientationTracker();

// TODO: move this to the location button on the UI
orientationTracker.requestOrientationPermission().then((result) => {
    info(`orentation request result`, result);
});

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
 * controlls showing the polygons for POIs
 */
const polygonController = new POIPolygonController({ POIs, poiTracker });

initMap({
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
            edgeBufferTiles: 4,
        },
    },
    // TODO: baseclass for exposing a layer?
    additionalLayers: [locationController.layer, polygonController.layer],
    providers: {
        poiTracker,
        locationController,
    },
});

setInterval(() => {
    locationStore.saveToStorage();
}, 15000); // every 15 seconds, save location data to storage

document.addEventListener("visibilitychange", () => {
    debug("[main] handleVisibilityChange");
    // save location when the user minimizes
    locationStore.saveToStorage();
});

window.addEventListener("beforeunload", () => {
    orientationTracker.stopOrientationTracking();
});
