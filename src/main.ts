import { tileLayers } from "./map/layers";
import { initMap } from "./map/map";
import {
    POIController,
    POIPolygonController,
    POIs,
    POITracker,
} from "./points";
import { SettingsMenu } from "./settings";
import { locationStoreInstance, LocationTracker } from "./location";
import { ConsoleTracker } from "./console";

import "./styles.css"; // TODO: remove tailwind and import normally

import "leaflet-rotate";

import "leaflet.offline"; // temp

new ConsoleTracker();
new SettingsMenu();

const poiTracker = new POITracker();
const locationTracker = new LocationTracker();

/**
 * controlls showing the popup and marking the circles
 */
new POIController({ poiTracker });

/**
 * controlls showing the polygons for POIs
 */
const polygonController = new POIPolygonController({ POIs });

initMap({
    POIs,
    config: {
        initialLocation: [34.181983, -116.414443],
        initialZoom: 19,
        defaultLayer: tileLayers.satellite,
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
    additionalLayers: [locationTracker.layer, polygonController.layer],
    providers: {
        poiTracker,
        locationTracker,
    },
});

setInterval(() => {
    locationStoreInstance.saveToStorage();
}, 15000); // every 15 seconds, save location data to storage
