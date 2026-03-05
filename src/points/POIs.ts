import type { POI } from "../types";
import L from "leaflet";

const toBounds = (
    southWest: [number, number],
    northEast: [number, number],
): L.LatLngBounds => L.latLngBounds(southWest, northEast);

export const POIs: Array<POI> = [
    {
        title: "Parking Lot",
        id: "parking-lot",
        location: {
            latitude: 34.181922,
            longitude: -116.414579,
        },
        bounds: toBounds(
            [34.18185729296687, -116.41472454348615],
            [34.182094622489586, -116.41450200483872],
        ),
    },
    {
        title: "Quonset",
        id: "quonset",
        imageName: "quonset.jpg",
        audioName: "quonset.m4a",
        location: {
            latitude: 34.181792,
            longitude: -116.414532,
        },
        bounds: toBounds(
            [34.181731186291074, -116.41474302362288],
            [34.181857341939576, -116.41455151407415],
        ),
    },
    {
        title: "Foundry",
        id: "foundry",
        imageName: "foundry.jpg",
        audioName: "foundry.m4a",
        location: {
            latitude: 34.181725,
            longitude: -116.414696,
        },
        bounds: toBounds(
            [34.181655132362465, -116.4147494965721],
            [34.18173109206944, -116.41460110990985],
        ),
    },
    {
        title: "Outdoor Shower & Concrete Cubes",
        id: "outdoor-shower",
        audioName: "shower-cubes.m4a",
        location: {
            latitude: 34.181759,
            longitude: -116.414433,
        },
        bounds: toBounds(
            [34.18166709583605, -116.41454714486598],
            [34.18174220253442, -116.41440244876229],
        ),
    },
    {
        title: "Airstream Trailer",
        id: "airstream",
        imageName: "airstream.jpg",
        audioName: "airstream.m4a",
        location: {
            latitude: 34.181665,
            longitude: -116.414396,
        },
        bounds: toBounds(
            [34.181601377419895, -116.41445280868105],
            [34.18166298843657, -116.41433222859455],
        ),
    },
    {
        title: "Sleeping Library",
        imageName: "sleeping-library.jpg",
        id: "library",
        location: {
            latitude: 34.18181,
            longitude: -116.41425,
        },
        bounds: toBounds(
            [34.18173924986043, -116.41432222340295],
            [34.18182081096805, -116.41421015485214],
        ),
    },
    {
        title: "Concrete Fountain",
        id: "fountain",
        location: {
            latitude: 34.1819,
            longitude: -116.414152,
        },
        bounds: toBounds(
            [34.181898031161424, -116.41414366231699],
            [34.181961843046764, -116.4140153677009],
        ),
    },
    {
        title: "Lazy Eye Gallery",
        id: "gallery",
        imageName: "gallery.jpg",
        location: {
            latitude: 34.181959,
            longitude: -116.414309,
        },
        bounds: toBounds(
            [34.181946263053746, -116.41435342834002],
            [34.18197782734275, -116.41431391031226],
        ),
    },
    {
        title: "Heidi & Derek's Studio",
        audioName: "studio.m4a",
        id: "heidi-derek-studio",
        imageName: "studios.jpg",
        location: {
            latitude: 34.181909,
            longitude: -116.414384,
        },
        bounds: toBounds(
            [34.18185618019119, -116.41443368225006],
            [34.18193809508155, -116.41433231420858],
        ),
    },
    {
        title: "Recording Studio",
        id: "recording-studio",
        location: {
            latitude: 34.181869,
            longitude: -116.414445,
        },
        bounds: toBounds(
            [34.181866566899046, -116.41448876636669],
            [34.181935947919285, -116.414435739735],
        ),
    },
    {
        title: "Sculpture Garden",
        id: "sculpture-garden",
        location: {
            latitude: 34.182357,
            longitude: -116.41468,
        },
        bounds: toBounds(
            [34.18213373726893, -116.41487250880826],
            [34.18247085313864, -116.4144989562793],
        ),
    },
    {
        title: "Chicken Wire Dinosaur",
        id: "chicken-wire-dinosaur",
        audioName: "dinosaur.m4a",
        location: {
            latitude: 34.182057,
            longitude: -116.413928,
        },
        bounds: toBounds(
            [34.1819312413371, -116.41401924444384],
            [34.18210211321292, -116.4138544847798],
        ),
    },
];
