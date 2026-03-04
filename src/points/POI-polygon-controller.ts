import type { POI } from "../types";
import L from "leaflet";
import { debug, warn } from "../utils";
import { getFeatureFlagProviderOrThrow } from "../feature-flags";
import type { POITracker } from "./POI-tracker";

type POIPolygonControllerParams = {
    POIs: POI[];
    poiTracker: POITracker;
};

// TODO: font
const svgLabel = () =>
    `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 100 100"
     preserveAspectRatio="none">

  <text id="label-text"
    x="50"
    y="50"
    transform="rotate(180 50 50)"
    font-weight="900"
    font-family="Futura"
    textLength="100"
    text-anchor="middle"
    lengthAdjust="spacingAndGlyphs"
    dominant-baseline="middle"
    fill="black">
  </text>
</svg>
`;

export const poiToLabel = (poi: POI) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgLabel(), "image/svg+xml");

    const svgElement = svgDoc.documentElement as unknown as SVGElement;

    const labelText = svgElement.querySelector("#label-text") as
        | SVGTextElement
        | undefined;

    if (!labelText) {
        debug("no element");
    } else {
        labelText.innerHTML = "";

        const lines = poi.title.split(" ");
        const lineCount = lines.length;

        const lineHeightMultiplier = 1.1;

        // Fit entire text block inside 100 viewBox units
        const fontSize = 100 / (lineCount * lineHeightMultiplier);

        const lineHeight = fontSize * lineHeightMultiplier;
        const totalHeight = lineHeight * (lineCount - 1);
        const startOffset = -totalHeight / 2;

        labelText.setAttribute("font-size", fontSize.toString());

        lines.forEach((line, i) => {
            const tspan = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "tspan",
            );

            tspan.setAttribute("x", "50");
            tspan.setAttribute(
                "dy",
                i === 0 ? `${startOffset}` : `${lineHeight}`,
            );

            // Stretch each line independently across full width
            tspan.setAttribute("textLength", "100");
            tspan.setAttribute("lengthAdjust", "spacingAndGlyphs");

            tspan.textContent = line;
            labelText.appendChild(tspan);
        });
    }

    return svgElement;
};

const poiToLayers = (poi: POI, poiTracker: POITracker) => {
    const polygon = L.polygon(poi.polygon.path, {
        ...poi.polygon.options,
        color: "#7a7a7a",
        weight: 5,
        dashArray: "12 12",
        fillColor: "#bdbdbd",
        fillOpacity: 0.15,
        lineJoin: "round",
    });

    //const label = L.svgOverlay(poiToLabel(poi), polygon.getBounds(), {
    //    interactive: false,
    //});

    polygon.on("click", () => {
        debug("[poiToLayers] clicked");
        poiTracker.select(poi);
    });
    return [polygon /* label */];
};

export class POIPolygonController {
    constructor({ POIs, poiTracker }: POIPolygonControllerParams) {
        // TODO: attach listener

        getFeatureFlagProviderOrThrow().addListener(({ key, value }) => {
            debug(`[POIPolygonController] got an udate ${key}, ${value}`);
            if (key !== "polygons") {
                return;
            }
            if (value === true) {
                debug(`[POIPolygonController] showing layer`);
                if (this.layer.getLayers().length === 1) {
                    warn(
                        `[POIPolygonController] returning early, layer already present`,
                    );
                    return;
                }
                POIs.flatMap((poi) => poiToLayers(poi, poiTracker)).forEach(
                    (layer) => {
                        this.layer.addLayer(layer);
                    },
                );
            } else {
                this.layer.clearLayers();
                debug(`[POIPolygonController] removing layer`);
            }
        });

        const showPolygons =
            getFeatureFlagProviderOrThrow().get("polygons").value;

        this.layer = L.layerGroup(
            showPolygons
                ? POIs.flatMap((poi) => poiToLayers(poi, poiTracker))
                : [],
        );
    }

    public layer: L.LayerGroup;
}
