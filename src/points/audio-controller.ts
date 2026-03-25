import type { POI } from "../types";
import { debug, getElementOrThrow } from "../utils";
import { AudioElement } from "./audio-element";

const SEEK_INTERVAL_SECONDS = 15;
const PLAY_SYMBOL = "▶︎";
const PAUSE_SYMBOL = "⏸︎";

const formatRemainingTime = (currentTime: number, duration: number) => {
    if (!Number.isFinite(duration)) {
        return "--:--";
    }

    const remainingSeconds = Math.max(Math.ceil(duration - currentTime), 0);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `-${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getMediaSessionArtwork = (imageName?: string): MediaImage[] => {
    if (!imageName) {
        return [];
    }

    const imageBaseName = imageName.replace(/\.[^.]+$/, "");

    return [256, 512, 1024].map((size) => ({
        src: `${import.meta.env.BASE_URL}images/artwork/${imageBaseName}-${size}.jpg`,
        sizes: `${size}x${size}`,
        type: "image/jpeg",
    }));
};

/**
 * Owns the custom POI audio player UI.
 *
 * Audio stack breakdown:
 * - POIPopupController decides when popup audio should be shown for an active POI.
 * - AudioController owns the custom player UI inside the popup.
 * - AudioElement wraps the backing HTML audio node and handles media lifecycle.
 *
 * Responsibilities:
 * - find the player-specific DOM nodes inside the popup
 * - bind button interactions for play/pause and +/-15 second seeking
 * - translate media events into UI updates for the progress bar and time left
 * - delegate raw media lifecycle work to AudioElement
 *
 * Provenance:
 * - this controller and its companion UI were AI-generated
 * - the backing media element uses the id `poi-popup-audio-media`
 * - treat it as generated code that should be reviewed when modifying behavior
 */
export class AudioController {
    constructor() {
        this.elements = {
            mediaElement: getElementOrThrow({ id: "poi-popup-audio-media" }),
            container: getElementOrThrow({ id: "poi-popup-audio" }),
            backButton: getElementOrThrow({ id: "poi-popup-audio-back" }),
            playPauseButton: getElementOrThrow({ id: "poi-popup-audio-toggle" }),
            forwardButton: getElementOrThrow({ id: "poi-popup-audio-forward" }),
            progressTrackElement: getElementOrThrow({
                id: "poi-popup-audio-progress-track",
            }),
            progressElement: getElementOrThrow({
                id: "poi-popup-audio-progress",
            }),
            timeRemainingElement: getElementOrThrow({
                id: "poi-popup-audio-time",
            }),
        };
        this.audioPlayback = new AudioElement({
            mediaElement: this.elements.mediaElement,
        });
    }

    setup({ poi }: { poi: POI }) {
        this.teardownUi();

        this.audioPlayback.configure(poi);
        this.updateMediaSessionMetadata(poi);
        this.elements.container.classList.remove("hidden");
        this.renderLoadingState();

        const backClickListener = () => {
            this.audioPlayback.seekBySeconds(-SEEK_INTERVAL_SECONDS);
            this.renderTime();
            this.renderPlaybackState();
        };

        const playPauseClickListener = () => {
            void this.audioPlayback.togglePlayPause().catch((error: unknown) => {
                debug(`[AudioController] togglePlayPause failed: ${error}`);
            });
        };

        const forwardClickListener = () => {
            this.audioPlayback.seekBySeconds(SEEK_INTERVAL_SECONDS);
            this.renderTime();
            this.renderPlaybackState();
        };

        const progressTrackClickListener = (event: MouseEvent) => {
            const duration = this.audioPlayback.getDuration();
            if (!Number.isFinite(duration) || duration <= 0) {
                return;
            }

            const trackBounds =
                this.elements.progressTrackElement.getBoundingClientRect();
            const clickOffset = event.clientX - trackBounds.left;
            const clickRatio = Math.min(
                Math.max(clickOffset / trackBounds.width, 0),
                1,
            );

            this.audioPlayback.setCurrentTime(duration * clickRatio);
            this.renderTime();
            this.renderPlaybackState();
        };

        this.elements.backButton.addEventListener("click", backClickListener);
        this.elements.playPauseButton.addEventListener(
            "click",
            playPauseClickListener,
        );
        this.elements.forwardButton.addEventListener(
            "click",
            forwardClickListener,
        );
        this.elements.progressTrackElement.addEventListener(
            "click",
            progressTrackClickListener,
        );

        this.cleanups.push(() => {
            this.elements.backButton.removeEventListener(
                "click",
                backClickListener,
            );
            this.elements.playPauseButton.removeEventListener(
                "click",
                playPauseClickListener,
            );
            this.elements.forwardButton.removeEventListener(
                "click",
                forwardClickListener,
            );
            this.elements.progressTrackElement.removeEventListener(
                "click",
                progressTrackClickListener,
            );
        });

        this.cleanups.push(
            this.audioPlayback.on("loadedmetadata", () => {
                this.renderPlaybackState();
                this.renderTime();
            }),
        );
        this.cleanups.push(
            this.audioPlayback.on("timeupdate", () => {
                this.renderTime();
                this.renderProgress();
            }),
        );
        this.cleanups.push(
            this.audioPlayback.on("play", () => {
                this.renderPlaybackState();
            }),
        );
        this.cleanups.push(
            this.audioPlayback.on("pause", () => {
                this.audioPlayback.saveCurrentTime();
                this.renderPlaybackState();
                this.renderTime();
            }),
        );
        this.cleanups.push(
            this.audioPlayback.on("ended", () => {
                this.renderPlaybackState();
                this.renderTime();
            }),
        );
    }

    teardown() {
        this.teardownUi();
        this.audioPlayback.teardown();
        this.clearMediaSessionMetadata();
        this.elements.container.classList.add("hidden");
        this.renderLoadingState();
    }

    private audioPlayback: AudioElement;

    private cleanups: Array<() => void> = [];

    private elements: {
        mediaElement: HTMLAudioElement;
        container: HTMLElement;
        backButton: HTMLButtonElement;
        playPauseButton: HTMLButtonElement;
        forwardButton: HTMLButtonElement;
        progressTrackElement: HTMLElement;
        progressElement: HTMLElement;
        timeRemainingElement: HTMLElement;
    };

    /** Resets the visible player UI before metadata is available. */
    private renderLoadingState() {
        this.elements.playPauseButton.textContent = PLAY_SYMBOL;
        this.elements.playPauseButton.setAttribute("aria-label", "Play audio");
        this.elements.timeRemainingElement.textContent = "--:--";
        this.elements.progressElement.style.width = "0%";
    }

    /** Syncs the play/pause button state and progress bar with the media state. */
    private renderPlaybackState() {
        this.elements.playPauseButton.textContent = this.audioPlayback.isPaused()
            ? PLAY_SYMBOL
            : PAUSE_SYMBOL;
        this.elements.playPauseButton.setAttribute(
            "aria-label",
            this.audioPlayback.isPaused() ? "Play audio" : "Pause audio",
        );
        this.renderProgress();
    }

    /** Formats and renders the time remaining label from the current media time. */
    private renderTime() {
        this.elements.timeRemainingElement.textContent = formatRemainingTime(
            this.audioPlayback.getCurrentTime(),
            this.audioPlayback.getDuration(),
        );
    }

    /** Fills the progress bar based on currentTime / duration. */
    private renderProgress() {
        const duration = this.audioPlayback.getDuration();
        const currentTime = this.audioPlayback.getCurrentTime();

        if (!Number.isFinite(duration) || duration <= 0) {
            this.elements.progressElement.style.width = "0%";
            return;
        }

        const progressPercent = Math.min(
            Math.max((currentTime / duration) * 100, 0),
            100,
        );

        this.elements.progressElement.style.width = `${progressPercent}%`;
    }

    /** Runs and clears every stored event/listener cleanup callback. */
    private teardownUi() {
        for (const cleanup of this.cleanups) {
            cleanup();
        }
        this.cleanups = [];
    }

    /** Publishes lock-screen metadata for the currently active POI audio. */
    private updateMediaSessionMetadata(poi: POI) {
        if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") {
            return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: poi.title,
            artist: "YVML",
            album: "Interactive Map",
            artwork: getMediaSessionArtwork(poi.imageName),
        });
    }

    /** Clears lock-screen metadata so the previous POI does not linger. */
    private clearMediaSessionMetadata() {
        if (!("mediaSession" in navigator)) {
            return;
        }

        navigator.mediaSession.metadata = null;
    }
}
