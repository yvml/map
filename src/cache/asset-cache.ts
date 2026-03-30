import { getConfigStore } from "../config";
import { info } from "../utils";
import { ASSET_CACHE_NAME } from "./shared";

/**
 * Registers the service worker that manages app-hosted asset caching.
 *
 * Provenance:
 * - this registration flow was AI-generated
 * - review service worker lifecycle and messaging behavior carefully when editing
 */
export const registerAssetCacheServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    const serviceWorkerUrl = new URL("../service-worker.ts", import.meta.url);
    const postTtlHours = (serviceWorker: ServiceWorker | null | undefined) => {
        if (!serviceWorker) {
            return;
        }

        serviceWorker.postMessage({
            type: "SET_ASSET_CACHE_TTL",
            ttlHours: getConfigStore().getAssetCache().ttlHours,
        });
    };

    try {
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
            type: "module",
        });
        postTtlHours(
            registration.active ?? registration.waiting ?? registration.installing,
        );
    } catch (error) {
        info(`[asset-cache] failed to register service worker: ${error}`);
        return;
    }

    navigator.serviceWorker.ready
        .then((registration) => {
            postTtlHours(registration.active);
        })
        .catch((error) => {
            info(`[asset-cache] service worker not ready: ${error}`);
        });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        postTtlHours(navigator.serviceWorker.controller);
    });

    getConfigStore().addListener((event) => {
        if (event.key !== "assetCache") {
            return;
        }

        postTtlHours(navigator.serviceWorker.controller);
    });
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
    localStorage.clear();

    if (!("caches" in window)) {
        return;
    }

    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter((cacheName) => cacheName === ASSET_CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
    );
};
