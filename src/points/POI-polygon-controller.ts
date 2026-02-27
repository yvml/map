import type { POI } from "../types";
import L from "leaflet";
import { debug } from "../utils";

type POIPolygonControllerParams = {
    POIs: POI[];
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

const poiToLabel = (poi: POI) => {
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

const poiToLayers = (poi: POI) => {
    const polygon = L.polygon(poi.polygon.path, poi.polygon.options);

    const label = L.svgOverlay(poiToLabel(poi), polygon.getBounds(), {
        interactive: false,
    });

    return [polygon, label];
};

export class POIPolygonController {
    constructor({ POIs }: POIPolygonControllerParams) {
        // TODO: attach listener

        this.layer = L.layerGroup(POIs.flatMap(poiToLayers));
    }

    public layer: L.LayerGroup;
}
