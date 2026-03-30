/// <reference lib="webworker" />

import {
    ASSET_CACHE_NAME,
    CACHE_TIMESTAMP_HEADER,
    CACHE_TTL_HEADER,
    getCacheableAssetPathPrefixes,
    isExpiredResponse,
} from "./cache/shared";

declare const self: ServiceWorkerGlobalScope;

const DEFAULT_TTL_HOURS = 24 * 7;

let assetCacheTtlHours = DEFAULT_TTL_HOURS;

const getBasePath = () =>
    new URL(import.meta.env.BASE_URL ?? "/", self.location.origin).pathname;

const getCache = async () => {
    return caches.open(ASSET_CACHE_NAME);
};

const buildCachedResponse = async (response: Response) => {
    const headers = new Headers(response.headers);
    headers.set(CACHE_TIMESTAMP_HEADER, String(Date.now()));
    headers.set(CACHE_TTL_HEADER, String(assetCacheTtlHours));

    return new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
};

const fetchAndCache = async (request: Request, cache: Cache) => {
    const networkResponse = await fetch(request);

    if (!networkResponse.ok) {
        return networkResponse;
    }

    const cachedResponse = await buildCachedResponse(networkResponse);
    await cache.put(request, cachedResponse);

    return networkResponse;
};

const handleAssetRequest = async (request: Request) => {
    const cache = await getCache();
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !isExpiredResponse(cachedResponse)) {
        return cachedResponse;
    }

    try {
        return await fetchAndCache(request, cache);
    } catch (error) {
        if (cachedResponse) {
            return cachedResponse;
        }

        throw error;
    }
};

self.addEventListener("install", (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
    if (event.data?.type !== "SET_ASSET_CACHE_TTL") {
        return;
    }

    const ttlHours = Number(event.data.ttlHours);

    if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
        return;
    }

    assetCacheTtlHours = ttlHours;
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);
    const basePath = getBasePath();
    const cacheablePrefixes = getCacheableAssetPathPrefixes(basePath);

    const isCacheableRequest =
        requestUrl.origin === self.location.origin &&
        cacheablePrefixes.some((prefix) => requestUrl.pathname.startsWith(prefix));

    if (!isCacheableRequest) {
        return;
    }

    event.respondWith(handleAssetRequest(event.request));
});

export {};
