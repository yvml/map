import type { ConfigStore } from "../config";
import { debug, info } from "../utils";
import { ASSET_CACHE_NAME } from "./shared";

const getServiceWorkerUrl = () => {
    return import.meta.env.DEV
        ? new URL("../service-worker.ts", import.meta.url)
        : new URL(
              `${import.meta.env.BASE_URL}service-worker.js`,
              window.location.origin,
          );
};

const getServiceWorkerScope = () => import.meta.env.BASE_URL;

const getAssetCacheRegistrations = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const serviceWorkerScope = new URL(
        getServiceWorkerScope(),
        window.location.origin,
    ).href;

    return registrations.filter(
        (registration) => registration.scope === serviceWorkerScope,
    );
};

/**
 * Registers the service worker that manages app-hosted asset caching.
 *
 * Provenance:
 * - this registration flow was AI-generated
 * - review service worker lifecycle and messaging behavior carefully when editing
 */
export const registerAssetCacheServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
        debug("[asset-cache] service workers are not supported in this browser");
        return;
    }

    const serviceWorkerUrl = getServiceWorkerUrl();
    const serviceWorkerScope = getServiceWorkerScope();
    debug(
        `[asset-cache] registering service worker at ${serviceWorkerUrl.pathname} with scope ${serviceWorkerScope}`,
    );

    try {
        const registration = await navigator.serviceWorker.register(
            serviceWorkerUrl,
            {
                type: "module",
                scope: serviceWorkerScope,
            },
        );
        debug(
            `[asset-cache] service worker registered with scope ${registration.scope}`,
        );
    } catch (error) {
        info(`[asset-cache] failed to register service worker: ${error}`);
    }
};

/**
 * Disables asset caching by unregistering the active service worker for this
 * app scope and clearing app-managed cache entries.
 */
export const unregisterAssetCacheServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    const registrations = await getAssetCacheRegistrations();
    debug(
        `[asset-cache] unregistering ${registrations.length} asset-cache service worker registrations`,
    );

    await Promise.all(
        registrations.map((registration) => registration.unregister()),
    );
    await clearAssetCache();
};

/**
 * Clears all app-managed browser persistence.
 *
 * Responsibilities:
 * - clear `localStorage`
 * - clear the app-owned network asset cache
 *
 * Provenance:
 * - this clearing behavior was AI-generated
 * - keep it aligned with the Settings "Clear Local Storage" semantics
 */
export const clearAppStorage = async () => {
    debug("[asset-cache] clearing localStorage");
    localStorage.clear();

    await clearAssetCache();
};

/**
 * Keeps asset-cache service worker state synchronized with the `assetCaching`
 * feature flag in config.
 *
 * Provenance:
 * - this controller wiring was AI-generated
 * - review feature-toggle and service worker lifecycle interactions carefully
 */
export class AssetCacheController {
    constructor(params: { configStore: ConfigStore }) {
        this.configStore = params.configStore;

        this.syncAssetCaching(this.configStore.getFeature("assetCaching").value);

        this.configStore.addListener(({ key, value }) => {
            if (key !== "features" || value.key !== "assetCaching") {
                return;
            }

            debug(`[asset-cache] assetCaching feature changed to ${value.value}`);
            this.syncAssetCaching(value.value);
        });
    }

    private configStore: ConfigStore;

    private syncAssetCaching(enabled: boolean) {
        if (enabled) {
            void registerAssetCacheServiceWorker();
            return;
        }

        void unregisterAssetCacheServiceWorker();
    }
}

const clearAssetCache = async () => {
    if (!("caches" in window)) {
        debug("[asset-cache] CacheStorage is not available in this browser");
        return;
    }

    const cacheNames = await caches.keys();
    debug(`[asset-cache] found ${cacheNames.length} cache storage entries`);

    const deletedCacheNames = cacheNames.filter(
        (cacheName) => cacheName === ASSET_CACHE_NAME,
    );

    await Promise.all(
        deletedCacheNames.map((cacheName) => caches.delete(cacheName)),
    );
    debug(
        `[asset-cache] cleared ${deletedCacheNames.length} app-managed cache entries`,
    );
};
