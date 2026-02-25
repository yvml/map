export type StorageProvider = {
    set(key: string, value: string): void;
    get(key: string): string | undefined;
    has(key: string): boolean;
    getOrThrow(key: string): string;
    clear(key?: string): void;
};
