import { POITracker } from "../points";
import type { POI } from "../types";
import { debug, getElementOrThrow, info } from "../utils";
import { AudioElement } from "./audio-element";

export class POIController {
    constructor(params: { poiTracker: POITracker }) {
        getElementOrThrow({ id: "poi-popup-close" }).addEventListener(
            "click",
            () => {
                // when the user hits close, they're deselecting the active
                params.poiTracker.deselectActive();
            },
        );

        this.elements = {
            audio: getElementOrThrow({ id: "poi-popup-audio-element" }),
            container: getElementOrThrow({ id: "poi-popup" }),
            image: getElementOrThrow({ id: "poi-popup-image" }),
            title: getElementOrThrow({ id: "poi-popup-title" }),
        };

        params.poiTracker.addListener((activePOI) => {
            debug(
                `[POIController] listener for poiTrackerInstance fired: ${activePOI}`,
            );
            if (activePOI) {
                this.display(activePOI);
            } else {
                this.close();
            }
        });
    }

    /**
     * called whenever POITracker sees a switch
     */
    display(entry: POI) {
        if (this.active?.entry && entry.id !== this.active.entry?.id) {
            info(
                `[POIController] switching from ${this.active.entry?.id} to ${entry.id}`,
            );

            if (this.active.pauseEventListener) {
                debug("[POIController] tearing down old audio element");
                AudioElement.teardown({
                    element: this.elements.audio,
                    entry: this.active.entry,
                    pauseListener: this.active.pauseEventListener,
                });
            }
        }

        this.active = { entry };

        this.elements.title.textContent = entry.title;

        if (entry.imageName) {
            this.elements.image.src = `${import.meta.env.BASE_URL}images/${entry.imageName}`;
            this.elements.image.alt = entry.title;
        }

        this.elements.image.hidden = !entry.imageName;

        if (entry.audioName) {
            this.active.pauseEventListener = AudioElement.setup({
                entry,
                element: this.elements.audio,
            });
        }

        this.elements.audio.hidden = !entry.audioName;

        this.elements.container.classList.remove("hidden");
        this.hidden = false;
    }

    close() {
        // TODO: hidden check here?
        this.elements.container.classList.add("hidden");
        this.hidden = true;

        if (this.active?.pauseEventListener) {
            AudioElement.teardown({
                element: this.elements.audio,
                entry: this.active.entry,
                pauseListener: this.active.pauseEventListener,
            });
        } else {
            debug("no active listener, not tearing down audio");
        }
    }

    public hidden: boolean = true;

    private elements: {
        audio: HTMLAudioElement;
        container: HTMLElement;
        image: HTMLImageElement;
        title: HTMLElement;
    };

    private active?: {
        entry: POI;
        pauseEventListener?: () => void;
    };
}
