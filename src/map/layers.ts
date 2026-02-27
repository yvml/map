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

export const tileLayers = {
    osm: osmLayer,
    satellite: satelliteLayer,
};
