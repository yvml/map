import L from "leaflet";

export type POI = {
    id: string;
    title: string;
    location: {
        latitude: number;
        longitude: number;
    };
    bounds: L.LatLngBounds; // southWest -> northEast
    imageName?: string;
    // TODO: non-optional
    audioName?: string;
};
