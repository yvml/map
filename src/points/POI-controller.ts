import { markerIdForPOI } from "../map/components/poi-marker";
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
    display(poi: POI) {
        if (this.active?.poi && poi.id !== this.active.poi?.id) {
            info(
                `[POIController] switching from ${this.active.poi?.id} to ${poi.id}`,
            );

            if (this.active.pauseEventListener) {
                AudioElement.teardown({
                    element: this.elements.audio,
                    entry: this.active.poi,
                    pauseListener: this.active.pauseEventListener,
                });
            }
        }

        this.active = { poi: poi };

        // --------- configure marker

        const poiMarker = getElementOrThrow({ id: markerIdForPOI(poi) });
        poiMarker.style.opacity = "0.7";

        // --------- configure popup

        this.elements.title.textContent = poi.title;

        if (poi.imageName) {
            this.elements.image.src = `${import.meta.env.BASE_URL}images/${poi.imageName}`;
            this.elements.image.alt = poi.title;
        }

        this.elements.image.hidden = !poi.imageName;

        if (poi.audioName) {
            this.active.pauseEventListener = AudioElement.setup({
                entry: poi,
                element: this.elements.audio,
                pauseCallback: () => {
                    // TODO: pause and play callbacks for decorating the POI
                    debug("[POIController] pauseCallback");
                },
            });
        }

        this.elements.audio.hidden = !poi.audioName;

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
                entry: this.active.poi,
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
        poi: POI;
        pauseEventListener?: () => void;

        /**
         * TODO: listeners: { pause, play }
         *
         * on play, we set the outline of the POI
         *
         * on pause, we remove that outline or change it's color
         */
    };
}
