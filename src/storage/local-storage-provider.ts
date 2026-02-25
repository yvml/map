import { debug } from "../utils";
import type { StorageProvider } from "./storage-provider";

export const LocalStorageProvider: StorageProvider = {
    set(key, value) {
        debug(`[LocalStorageProvider] set ${key} to ${value}`);
        localStorage.setItem(key, value);
    },
    get(key: string): string | undefined {
        const value = localStorage.getItem(key) ?? undefined;
        debug(`[LocalStorageProvider] get ${key}: ${value}`);
        return value;
    },
    has(key: string) {
        return this.get(key) !== undefined;
    },
    getOrThrow(key: string): string {
        const entry = this.get(key);
        if (!entry) {
            throw new Error(`missing value for key: ${key}`);
        }
        return entry;
    },

    clear(key: string | undefined) {
        if (!key) {
            debug(`[LocalStorageProvider] clearing everything`);
            localStorage.clear();
        } else {
            debug(`[LocalStorageProvider] clearing data for ${key}`);
            localStorage.removeItem(key);
        }
    },
};
