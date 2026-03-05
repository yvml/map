import { LocalStorageProvider, StorageKeys } from "../storage";
import { debug } from "../utils";
import L, { LatLng } from "leaflet";
import type { LocationPoint } from "./types";
import type { LocationTracker } from "./location-tracker";

type LocationStoreParams = {
    locationTracker: LocationTracker;
};

export class LocationStore {
    constructor({ locationTracker }: LocationStoreParams) {
        this.data = LocationStore.readFromStorage() ?? [];
        this.previousDataLength = this.data.length;

        locationTracker.addListener(this.handleNewLocation);
    }

    private handleNewLocation = (point: LocationPoint) => {
        /**
         * only save if its a meaningful measurement
         *
         * TODO: play around with this value
         */
        if (point.accuracy > 10) {
            debug("[LocationStore] accuracy above 10, not saving");
            return;
        }
        /**
         * Only add if the location is within YVML
         */
        // TODO

        /**
         * Only add if the distance between two points is great enough
         */
        const previousPoint = this.data[this.data.length - 1];

        if (previousPoint) {
            const current = L.latLng(point.latitude, point.longitude);
            const previous = L.latLng(
                previousPoint?.latitude,
                previousPoint?.longitude,
            );

            const distanceInMeters = current.distanceTo(previous);

            //debug(
            //    `[LocationStore] distance between ${current} and ${previous} = ${distanceInMeters}`,
            //);

            if (distanceInMeters < 1) {
                // less than 1 meter
                return;
            }
        }

        this.data.push(point);
        debug(
            `[LocationStore]: ${point} added; total size: ${this.data.length}`,
        );
    };

    getAll = (): Array<LocationPoint> => {
        debug(`[LocationStore]: getAll: ${this.data}`);
        return this.data;
    };
    getAllLatLng = (): Array<LatLng> => {
        debug(`[LocationStore]: getAllLatLng: ${this.data}`);
        return this.getAll().map(({ latitude, longitude }) =>
            L.latLng(latitude, longitude),
        );
    };

    saveToStorage = () => {
        if (this.data.length === this.previousDataLength) {
            return;
        }

        this.previousDataLength = this.data.length;

        LocalStorageProvider.set(
            StorageKeys.locationHistory,
            JSON.stringify(this.data),
        );
    };

    private static readFromStorage = (): Array<LocationPoint> | undefined => {
        const localData = LocalStorageProvider.get(StorageKeys.locationHistory);

        if (!localData) {
            debug(`[LocationStore] readFromStorage: nothing in local data`);
            return undefined;
        }

        const parsedData = JSON.parse(localData);
        debug(parsedData);
        return parsedData;
    };

    private data: Array<LocationPoint> = [];
    private previousDataLength: number;
}
