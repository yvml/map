import { mapLayers } from "./map/layers";
import { initMap } from "./map/map";
import { POIs } from "./points";

import "./styles.css";

import "leaflet-rotate";
import "leaflet.offline"; // temp
import { initSettingsMenu } from "./settings";
import { locationStoreInstance } from "./location";

initSettingsMenu();

initMap({
    POIs,
    initialLocation: [34.181983, -116.414443],
    initialZoom: 19,
    defaultLayer: mapLayers.satellite,
    layers: mapLayers,
});

setInterval(() => {
    locationStoreInstance.saveToStorage();
}, 15000); // every 15 seconds, save location data to storage
