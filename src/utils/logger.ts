export type LogLevel = "debug" | "info" | "warn";
type Subscriber = (level: LogLevel, messages: unknown[]) => void;

const subscribers = new Set<Subscriber>();

const emit = (level: LogLevel, messages: unknown[]) => {
    subscribers.forEach((fn) => fn(level, messages));
};

export const logger = {
    subscribe: (fn: Subscriber) => {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
    },
};

export const debug = (...messages: unknown[]) => {
    console.debug(...messages);
    emit("debug", messages);
};

export const info = (...messages: unknown[]) => {
    console.info(...messages);
    emit("info", messages);
};

export const warn = (...messages: unknown[]) => {
    console.warn(...messages);
    emit("warn", messages);
};
