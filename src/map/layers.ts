import { tileLayer } from "leaflet";

const baseAttributes = {
    maxZoom: 30,
    maxNativeZoom: 17,
};

const osmLayer = tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        ...baseAttributes,
        attribution: "© OpenStreetMap contributors",
    },
);

const satelliteLayer = tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        ...baseAttributes,
        attribution: "Tiles &copy; Esri", // &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
);

const droneLayer = tileLayer(
    `${import.meta.env.BASE_URL}tiles/{z}/{x}/{y}.jpg`,
    {
        minZoom: 18,
        maxZoom: 23,
        maxNativeZoom: 23,
        tileSize: 256,
        errorTileUrl: `${import.meta.env.BASE_URL}/images/logo.png`, // TODO
        detectRetina: true,
    },
);

export const tileLayers = {
    osm: osmLayer,
    satellite: satelliteLayer,
    drone: droneLayer,
};
