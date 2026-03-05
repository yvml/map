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
            [34.18185729296687, -116.41471854348615],
            [34.182094622489586, -116.41449600483872],
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
            [34.18173197459987, -116.4147442253696],
            [34.18185378495963, -116.41455888112023],
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
            [34.181655132362465, -116.4147434965721],
            [34.18173109206944, -116.41459510990985],
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
            [34.1816505930839, -116.41448915310552],
            [34.18173995911545, -116.41433735721739],
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
            [34.18161268955937, -116.41444910880557],
            [34.18164889823784, -116.41432944149489],
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
            [34.18174588524302, -116.41428649510485],
            [34.181814284907105, -116.41422099357649],
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
            [34.181898031161424, -116.41413766231699],
            [34.181961843046764, -116.4140093677009],
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
            [34.18194635629578, -116.4143479090959],
            [34.181977840945066, -116.41430709212386],
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
            [34.18186030022349, -116.41442919864701],
            [34.18194803363956, -116.41432963844129],
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
            [34.181866566899046, -116.41448276636669],
            [34.181935947919285, -116.414429739735],
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
            [34.18209838159339, -116.41483646038394],
            [34.182348859861435, -116.41451922531695],
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
            [34.18204386947605, -116.4139641090556],
            [34.182114353896296, -116.41388163727397],
        ),
    },
];
