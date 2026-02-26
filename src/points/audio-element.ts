import { LocalStorageProvider } from "../storage";
import type { POI } from "../types";
import { debug, info } from "../utils";

const getTimestampKey = (entry: POI) => {
    return `${entry.id}-timestamp`;
};

export const AudioElement = {
    /**
     * setup HTMLAudioElement
     *
     * 1. pull timestamp from local storage
     * 2. load media
     * 3. add event listener
     */
    setup: ({
        entry,
        element,
        pauseCallback,
    }: {
        entry: POI;
        element: HTMLAudioElement;
        pauseCallback: () => void;
    }) => {
        element.pause();

        const timestampKey = getTimestampKey(entry);
        const savedTime = LocalStorageProvider.has(timestampKey)
            ? Number(JSON.parse(LocalStorageProvider.getOrThrow(timestampKey)))
            : 0;

        if (!LocalStorageProvider.has(timestampKey)) {
            debug("AudioElement: no timestampKey found, will start at 0");
        }

        element.src = `${import.meta.env.BASE_URL}audio/${entry.audioName}`;
        element.load();

        /*
         * Safari (and WebKit) ignores currentTime set before src/load(); set it
         * after metadata is loaded so resume works correctly.
         */
        const applyResumePosition = () => {
            element.currentTime = savedTime;
            element.removeEventListener("loadedmetadata", applyResumePosition);
        };
        element.addEventListener("loadedmetadata", applyResumePosition);

        /*
         * save audio timestamp whenever the audio is paused
         */
        // TODO: maybe break this out into a 'save' function and that will maintian the lifecycle
        const pauseEventListener = () => {
            debug(`AudioElement: pause selected on ${entry.id}`);
            LocalStorageProvider.set(
                timestampKey,
                JSON.stringify(element.currentTime),
            );
            pauseCallback();
        };

        element.addEventListener("pause", pauseEventListener);

        return pauseEventListener;
    },

    /**
     * teardown HTMLAudioElement
     *
     * 1. save timestamp to local storage
     * 2. pause media
     * 3. remove event listener
     */
    teardown: ({
        element,
        pauseListener: listener,
        entry,
    }: {
        element: HTMLAudioElement;
        pauseListener: () => void;
        entry: POI;
    }) => {
        info(`AudioElement: teardown on ${entry.title}`);

        if (!element.paused) {
            debug("AudioElement: audio wasn't paused, calling pause");
            element.pause();
        }

        LocalStorageProvider.set(
            getTimestampKey(entry),
            JSON.stringify(element.currentTime),
        );

        element.removeEventListener("pause", listener);
    },
};
