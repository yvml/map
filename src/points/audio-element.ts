import { LocalStorageProvider } from "../storage";
import type { POI } from "../types";
import { debug, info } from "../utils";

type AudioEventName =
    | "ended"
    | "loadedmetadata"
    | "pause"
    | "play"
    | "timeupdate";

const getTimestampKey = (poi: POI) => {
    return `${poi.id}-timestamp`;
};

/**
 * Wraps the backing HTMLAudioElement used by the POI popup.
 *
 * Audio stack breakdown:
 * - POIController decides when popup audio should be shown for an active POI.
 * - AudioController owns the custom player UI inside the popup.
 * - AudioElement wraps the backing HTML audio node and handles media lifecycle.
 *
 * Responsibilities:
 * - load and unload the active POI audio source
 * - restore and persist playback position per POI
 * - expose low-level playback and seeking methods
 * - proxy media events for the UI controller layer
 *
 * Provenance:
 * - this class and its surrounding custom-player integration were AI-generated
 * - the backing media element uses the id `poi-popup-audio-media`
 * - keep the behavior under review when changing popup audio UX or persistence
 */
export class AudioElement {
    constructor(params: { mediaElement: HTMLAudioElement }) {
        this.mediaElement = params.mediaElement;
    }

    configure(poi: POI) {
        if (this.activePoi?.id !== poi.id) {
            this.saveCurrentTime();
        }

        this.activePoi = poi;
        this.mediaElement.pause();

        const timestampKey = getTimestampKey(poi);
        const savedTime = LocalStorageProvider.has(timestampKey)
            ? Number(JSON.parse(LocalStorageProvider.getOrThrow(timestampKey)))
            : 0;

        if (!LocalStorageProvider.has(timestampKey)) {
            debug("AudioElement: no timestampKey found, will start at 0");
        }

        this.mediaElement.src = `${import.meta.env.BASE_URL}audio/${poi.audioName}`;
        this.mediaElement.load();

        const applyResumePosition = () => {
            this.mediaElement.currentTime = savedTime;
            this.mediaElement.removeEventListener(
                "loadedmetadata",
                applyResumePosition,
            );
        };

        this.mediaElement.addEventListener(
            "loadedmetadata",
            applyResumePosition,
        );
    }

    async play() {
        await this.mediaElement.play();
    }

    pause() {
        this.mediaElement.pause();
    }

    async togglePlayPause() {
        if (this.mediaElement.paused) {
            await this.mediaElement.play();
            return;
        }

        this.mediaElement.pause();
    }

    seekBySeconds(seconds: number) {
        if (!Number.isFinite(this.mediaElement.duration)) {
            if (seconds < 0) {
                this.mediaElement.currentTime = Math.max(
                    this.mediaElement.currentTime + seconds,
                    0,
                );
            }
            return;
        }

        this.mediaElement.currentTime = Math.min(
            Math.max(this.mediaElement.currentTime + seconds, 0),
            this.mediaElement.duration,
        );
    }

    /** Seeks to an absolute playback time, clamped to the media duration. */
    setCurrentTime(timeInSeconds: number) {
        if (!Number.isFinite(this.mediaElement.duration)) {
            this.mediaElement.currentTime = Math.max(timeInSeconds, 0);
            return;
        }

        this.mediaElement.currentTime = Math.min(
            Math.max(timeInSeconds, 0),
            this.mediaElement.duration,
        );
    }

    getCurrentTime() {
        return this.mediaElement.currentTime;
    }

    getDuration() {
        return this.mediaElement.duration;
    }

    /** Returns whether the backing media element is currently paused. */
    isPaused() {
        return this.mediaElement.paused;
    }

    /** Persists the current playback time for the active POI, if one exists. */
    saveCurrentTime() {
        if (!this.activePoi) {
            return;
        }

        LocalStorageProvider.set(
            getTimestampKey(this.activePoi),
            JSON.stringify(this.mediaElement.currentTime),
        );
    }

    /**
     * Registers a media event listener and returns a cleanup function that
     * removes the exact listener later.
     */
    on(eventName: AudioEventName, listener: EventListener) {
        this.mediaElement.addEventListener(eventName, listener);

        return () => {
            this.mediaElement.removeEventListener(eventName, listener);
        };
    }

    /**
     * Saves the current timestamp, pauses playback, and clears the media source
     * so the next POI starts from a clean element state.
     */
    teardown() {
        if (!this.activePoi) {
            return;
        }

        info(`AudioElement: teardown on ${this.activePoi.title}`);

        if (!this.mediaElement.paused) {
            debug("AudioElement: audio wasn't paused, calling pause");
            this.mediaElement.pause();
        }

        this.saveCurrentTime();
        this.mediaElement.removeAttribute("src");
        this.mediaElement.load();
        this.activePoi = undefined;
    }

    private activePoi?: POI;

    private mediaElement: HTMLAudioElement;
}
