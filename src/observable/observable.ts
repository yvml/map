export class Observable<T> {
    addListener = (listener: (event: T) => void) => {
        this.listeners.push(listener);

        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    };

    notify = (event: T) => {
        for (const listener of this.listeners) {
            listener(event);
        }
    };

    private listeners: Array<(event: T) => void> = [];
}
