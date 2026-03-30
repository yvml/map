export const ASSET_CACHE_NAME = "yvml-asset-cache-v1";
export const CACHE_TIMESTAMP_HEADER = "x-yvml-cached-at";
export const CACHE_TTL_HEADER = "x-yvml-cache-ttl-hours";

const CACHEABLE_ASSET_PATHS = [
    "audio/",
    "images/sites/",
    "images/sites/thumbnails/",
    "tiles/",
    "new-tiles/",
] as const;

export const getCacheableAssetPathPrefixes = (basePath: string) => {
    return CACHEABLE_ASSET_PATHS.map((path) => `${basePath}${path}`);
};

export const isCacheableAssetRequest = (url: URL, basePath: string) => {
    if (url.origin !== self.location.origin) {
        return false;
    }

    return getCacheableAssetPathPrefixes(basePath).some((prefix) =>
        url.pathname.startsWith(prefix),
    );
};

export const getCachedAt = (response: Response) => {
    const cachedAtValue = response.headers.get(CACHE_TIMESTAMP_HEADER);
    const cachedAt = cachedAtValue ? Number(cachedAtValue) : Number.NaN;

    return Number.isFinite(cachedAt) ? cachedAt : undefined;
};

export const getTtlHours = (response: Response) => {
    const ttlValue = response.headers.get(CACHE_TTL_HEADER);
    const ttlHours = ttlValue ? Number(ttlValue) : Number.NaN;

    return Number.isFinite(ttlHours) ? ttlHours : undefined;
};

export const isExpiredResponse = (
    response: Response,
    now: number = Date.now(),
) => {
    const cachedAt = getCachedAt(response);
    const ttlHours = getTtlHours(response);

    if (cachedAt === undefined || ttlHours === undefined) {
        return true;
    }

    return now - cachedAt > ttlHours * 60 * 60 * 1000;
};
