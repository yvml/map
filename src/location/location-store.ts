import { LocalStorageProvider, StorageKeys } from "../storage";
import { debug } from "../utils";
import L from "leaflet";

type LocationPoint = {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
};

class LocationStore {
    constructor() {
        this.data = LocationStore.readFromStorage() ?? [];
        this.previousDataLength = this.data.length;
    }
    /**
     * Only add if the distance between two points is great enough
     */
    maybeAdd = (point: LocationPoint) => {
        const previousPoint = this.data[this.data.length - 1];

        if (previousPoint) {
            let current = L.latLng(point.latitude, point.longitude);
            let previous = L.latLng(
                previousPoint?.latitude,
                previousPoint?.longitude,
            );

            let distanceInMeters = current.distanceTo(previous);

            debug(
                `[LocationStore] distance between ${current} and ${previous} = ${distanceInMeters}`,
            );

            if (distanceInMeters < 1) {
                // less than 1 meter
                debug(
                    `[LocationStore] distance not great enough, returning early.`,
                );
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

    saveToStorage = () => {
        if (this.data.length === this.previousDataLength) {
            debug(
                `[LocationStore] saveToStorage: length unchanged, not saving`,
            );
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

export const locationStoreInstance = new LocationStore();
