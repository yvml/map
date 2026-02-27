import type { POI } from "../types";

// TODO: lint and sort based on keys
export const POIs: Array<POI> = [
    {
        title: "Parking Lot",
        id: "parking-lot",
        location: {
            latitude: 34.181922,
            longitude: -116.414579,
        },
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
        polygon: {
            path: [
                [34.18182171466778, -116.41471859312617],
                [34.18182095282987, -116.41468405872263],
                [34.18182666660839, -116.414680375053],
                [34.181822476504735, -116.41458183688783],
                [34.181734103353975, -116.41459657156686],
                [34.18174438816544, -116.41470017477754],
                [34.181758482163474, -116.41470063523644],
                [34.181763815027026, -116.41472734184187],
                [34.18182133374884, -116.41471813266753],
            ],
            options: {
                color: "blue",
            },
        },
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
    },
    {
        title: "Outdoor Shower & Concrete Cubes",
        id: "outdoor-shower",
        audioName: "shower-cubes.m4a",
        location: {
            latitude: 34.181759,
            longitude: -116.414433,
        },
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
    },
    {
        title: "Sleeping Library",
        imageName: "sleeping-library.jpg",
        id: "library",
        location: {
            latitude: 34.18181,
            longitude: -116.41425,
        },
    },
    {
        title: "Concrete Fountain",
        id: "fountain",
        location: {
            latitude: 34.1819,
            longitude: -116.414152,
        },
    },
    {
        title: "Lazy Eye Gallery",
        id: "gallery",
        imageName: "gallery.jpg",
        location: {
            latitude: 34.181959,
            longitude: -116.414309,
        },
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
    },
    {
        title: "Recording Studio",
        id: "recording-studio",
        location: {
            latitude: 34.181869,
            longitude: -116.414445,
        },
    },
    {
        title: "Sculpture Garden",
        id: "sculpture-garden",
        location: {
            latitude: 34.182357,
            longitude: -116.41468,
        },
    },
    {
        title: "Chicken Wire Dinosaur",
        id: "chicken-wire-dinosaur",
        audioName: "dinosaur.m4a",
        location: {
            latitude: 34.182057,
            longitude: -116.413928,
        },
    },
];
