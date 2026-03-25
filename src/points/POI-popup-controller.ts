import type { POITracker } from "./POI-tracker";
import type { POI } from "../types";
import { debug, getElementOrThrow, info } from "../utils";
import { AudioController } from "./audio-controller";

/**
 * Owns the popup UI for the active POI.
 *
 * Responsibilities:
 * - show and hide popup content for the active POI
 * - populate popup title and image state
 * - coordinate popup audio setup and teardown
 *
 * Provenance:
 * - the current custom POI audio player integration was AI-generated
 * - review behavior carefully when changing popup/audio interactions
 */
export class POIPopupController {
    constructor({ poiTracker }: { poiTracker: POITracker }) {
        getElementOrThrow({ id: "poi-popup-close" }).addEventListener(
            "click",
            () => {
                // when the user hits close, they're deselecting the active
                poiTracker.deselectActive();
            },
        );

        getElementOrThrow({ id: "poi-popup-image" }).addEventListener(
            "load",
            () => {
                this.elements.image.classList.remove("poi-popup-image-loading");
            },
        );
        getElementOrThrow({ id: "poi-popup-image" }).addEventListener(
            "error",
            () => {
                this.elements.image.classList.add("poi-popup-image-loading");
                this.elements.image.removeAttribute("src");
            },
        );

        this.elements = {
            container: getElementOrThrow({ id: "poi-popup" }),
            image: getElementOrThrow({ id: "poi-popup-image" }),
            title: getElementOrThrow({ id: "poi-popup-title" }),
        };
        this.audioController = new AudioController();

        poiTracker.addListener((activePOI) => {
            debug(
                `[POIPopupController] listener for poiTrackerInstance fired: ${activePOI}`,
            );
            if (activePOI) {
                this.display(activePOI);
            } else {
                this.close();
            }
        });
    }

    /** Called when POITracker selects or switches to a POI. */
    display(poi: POI) {
        if (this.active?.poi && poi.id !== this.active.poi?.id) {
            info(
                `[POIPopupController] switching from ${this.active.poi?.id} to ${poi.id}`,
            );

            this.audioController.teardown();
        }

        this.active = { poi: poi };

        this.elements.title.textContent = poi.title;

        // TODO: non optional
        if (poi.imageName) {
            this.elements.image.classList.add("poi-popup-image-loading");
            this.elements.image.removeAttribute("src");
            this.elements.image.src = `${import.meta.env.BASE_URL}images/sites/${poi.imageName}`;
            this.elements.image.alt = poi.title;
            this.elements.image.hidden = false;
        } else {
            this.elements.image.removeAttribute("src");
            this.elements.image.alt = "";
            this.elements.image.classList.remove("poi-popup-image-loading");
            this.elements.image.hidden = true;
        }

        if (poi.audioName) {
            this.audioController.setup({ poi });
        } else {
            this.audioController.teardown();
        }

        this.elements.container.classList.remove("hidden");
        this.hidden = false;
    }

    close() {
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
