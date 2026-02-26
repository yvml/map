import { mapLayers } from "./map/layers";
import { initMap } from "./map/map";
import { POIController, POIs, POITracker } from "./points";
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
 * controlls showing the popup and marking the cirlces
 */
new POIController({ poiTracker });

initMap({
    POIs,
    config: {
        initialLocation: [34.181983, -116.414443],
        initialZoom: 19,
        defaultLayer: mapLayers.satellite,
        layers: mapLayers,
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
    providers: {
        poiTracker,
        locationTracker,
    },
});

setInterval(() => {
    locationStoreInstance.saveToStorage();
}, 15000); // every 15 seconds, save location data to storage
