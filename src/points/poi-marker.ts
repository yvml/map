import { type DivIcon, divIcon } from "leaflet";
import type { POI } from "../types";

export const POI_TITLE_ZOOM_THRESHOLD = 21;

type IconConfiguration = {
    POI: Pick<POI, "id" | "title">;
    number: number;
};

export const markerIdForPOI = (poi: Pick<POI, "id">): string =>
    `poi-marker-${poi.id}`;

const markerLabelForZoom = (
    config: IconConfiguration,
    zoomLevel: number,
): string =>
    zoomLevel >= POI_TITLE_ZOOM_THRESHOLD
        ? config.POI.title
        : config.number.toString();

export const poiMarker = (config: IconConfiguration): DivIcon =>
    divIcon({
        className: "poi-marker-wrapper",
        html: `
            <div class="font-bold poi-marker poi-marker-number" id="${markerIdForPOI(config.POI)}">
              ${markerLabelForZoom(config, 0)}
            </div>
            `,
    });

export const updatePOIMarkerLabel = ({
    element,
    number,
    POI,
    zoomLevel,
}: {
    element: HTMLElement;
    number: number;
    POI: Pick<POI, "title">;
    zoomLevel: number;
}): void => {
    const showTitle = zoomLevel >= POI_TITLE_ZOOM_THRESHOLD;

    element.textContent = showTitle ? POI.title : number.toString();
    element.classList.toggle("poi-marker-title", showTitle);
    element.classList.toggle("poi-marker-number", !showTitle);
};
