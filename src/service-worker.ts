/// <reference lib="webworker" />

import {
    ASSET_CACHE_NAME,
    CACHE_TIMESTAMP_HEADER,
    CACHE_TTL_HEADER,
    getCacheableAssetPathPrefixes,
    isExpiredResponse,
} from "./cache/shared";
import { debug } from "./utils/logger";

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker for app-hosted asset caching.
 *
 * Responsibilities:
 * - intercept same-origin requests for public assets
 * - serve fresh cached responses before TTL expiry
 * - refresh expired entries from the network
 * - fall back to stale cached responses when the network is unavailable
 *
 * Provenance:
 * - this service worker was AI-generated
 * - review request scoping, TTL behavior, and cache invalidation carefully
 */
const ASSET_CACHE_TTL_HOURS = 24 * 7;

const getBasePath = () =>
    new URL(import.meta.env.BASE_URL ?? "/", self.location.origin).pathname;

const getCache = async () => {
    return caches.open(ASSET_CACHE_NAME);
};

/** Re-wraps a response so cache metadata travels with the stored entry. */
const buildCachedResponse = async (response: Response) => {
    const headers = new Headers(response.headers);
    headers.set(CACHE_TIMESTAMP_HEADER, String(Date.now()));
    headers.set(CACHE_TTL_HEADER, String(ASSET_CACHE_TTL_HOURS));

    return new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
};

/** Fetches a fresh asset and stores it in CacheStorage when the response is usable. */
const fetchAndCache = async (request: Request, cache: Cache) => {
    debug("[asset-cache-sw] fetching from network", request.url);
    const networkResponse = await fetch(request);

    if (!networkResponse.ok) {
        debug(
            "[asset-cache-sw] network response not cached",
            request.url,
            `status=${networkResponse.status}`,
        );
        return networkResponse;
    }

    if (networkResponse.status === 206) {
        debug(
            "[asset-cache-sw] skipping cache storage for partial response",
            request.url,
        );
        return networkResponse;
    }

    const cachedResponse = await buildCachedResponse(networkResponse);
    await cache.put(request, cachedResponse);
    debug("[asset-cache-sw] stored response in cache", request.url);

    return networkResponse;
};

/** Implements cache-first reads with TTL refresh and stale-on-error fallback. */
const handleAssetRequest = async (request: Request) => {
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
        debug(
            "[asset-cache-sw] bypassing cache for byte-range request",
            request.url,
            rangeHeader,
        );
        return fetch(request);
    }

    const cache = await getCache();
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !isExpiredResponse(cachedResponse)) {
        debug(
            "[asset-cache-sw] serving cached response without network fetch",
            request.url,
        );
        return cachedResponse;
    }

    if (cachedResponse) {
        debug("[asset-cache-sw] cache entry expired, refreshing", request.url);
    } else {
        debug("[asset-cache-sw] cache miss", request.url);
    }

    try {
        return await fetchAndCache(request, cache);
    } catch (error) {
        if (cachedResponse) {
            debug(
                "[asset-cache-sw] network failed, serving stale cached response",
                request.url,
            );
            return cachedResponse;
        }

        debug(
            "[asset-cache-sw] network failed with no cached fallback",
            request.url,
            error,
        );
        throw error;
    }
};

self.addEventListener("install", (event) => {
    debug("[asset-cache-sw] install");
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
    debug("[asset-cache-sw] activate");
    event.waitUntil(self.clients.claim());
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

    debug("[asset-cache-sw] intercepting cacheable request", requestUrl.pathname);
    event.respondWith(handleAssetRequest(event.request));
});

export {};
