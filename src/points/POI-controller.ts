import { markerIdForPOI } from "../map/components/poi-marker";
import { POITracker } from "../points";
import type { POI } from "../types";
import { debug, getElementOrThrow, info } from "../utils";
import { AudioController } from "./audio-controller";

/**
 * Top-level coordinator for POI popup content.
 *
 * Audio stack breakdown:
 * - POIController shows and hides popup content for the active POI.
 * - AudioController owns the custom player UI inside the popup.
 * - AudioElement wraps the backing HTML audio node and handles media lifecycle.
 *
 * Provenance:
 * - the current custom POI audio player integration was AI-generated
 * - review behavior carefully when changing popup/audio interactions
 */
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
            container: getElementOrThrow({ id: "poi-popup" }),
            image: getElementOrThrow({ id: "poi-popup-image" }),
            title: getElementOrThrow({ id: "poi-popup-title" }),
        };
        this.audioController = new AudioController();

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

            this.audioController.teardown();
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
            this.audioController.setup({ poi });
        } else {
            this.audioController.teardown();
        }

        this.elements.container.classList.remove("hidden");
        this.hidden = false;
    }

    close() {
        // TODO: hidden check here?
        this.elements.container.classList.add("hidden");
        this.hidden = true;

        this.audioController.teardown();
    }

    public hidden: boolean = true;

    private elements: {
        container: HTMLElement;
        image: HTMLImageElement;
        title: HTMLElement;
    };

    private active?: {
        poi: POI;
    };

    private audioController: AudioController;
}
