import { clearAppStorage } from "../cache";
import { getElementOrThrow } from "../utils";
import { getConfigStore, type FeatureKey } from "../config";

export class SettingsMenu {
    constructor() {
        const settingsButton = getElementOrThrow({ id: "navbar-settings" });
        const settingsPane = getElementOrThrow({ id: "settings-pane" });
        const closeButton = getElementOrThrow({ id: "settings-pane-close" });
        const clearLocalStorageButton = getElementOrThrow({
            id: "settings-pane-clear-local-storage",
        });

        const featureFlagsList = getElementOrThrow({
            id: "settings-feature-flags-list",
        });
        const assetCacheControls = getElementOrThrow({
            id: "settings-asset-cache-controls",
        });

        settingsButton.addEventListener("click", () => {
            settingsPane.classList.toggle("hidden");
        });

        closeButton.addEventListener("click", () => {
            settingsPane.classList.add("hidden");
        });

        clearLocalStorageButton.addEventListener("click", async () => {
            await clearAppStorage();
            window.location.reload();
        });

        const configStore = getConfigStore();

        // TODO: remove partial and use .map
        const checkboxByKey: Partial<Record<FeatureKey, HTMLInputElement>> = {};

        Object.entries(configStore.config.features).forEach(
            ([key, feature]) => {
                // TODO: dont like this cast
                const typedKey = key as FeatureKey;

                const row = document.createElement("div");
                row.className = "settings-feature-flag-row";

                // --- check box
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = feature.value;
                checkbox.setAttribute("data-feature-flag-key", typedKey);

                // --- text container
                const textContainer = document.createElement("div");
                textContainer.className = "settings-feature-flag-text-flex";

                // bold(FF Name)
                // regular(FF description)
                const nameElement = document.createElement("strong");
                nameElement.textContent = feature.name;
                textContainer.className = "settings-feature-flag-title-text";

                const descriptionElement = document.createElement("span");
                descriptionElement.textContent = feature.description;
                textContainer.className =
                    "settings-feature-flag-description-text";

                textContainer.appendChild(nameElement);
                textContainer.appendChild(descriptionElement);

                row.appendChild(checkbox);
                row.appendChild(textContainer);

                featureFlagsList.appendChild(row);

                checkboxByKey[typedKey] = checkbox;

                checkbox.addEventListener("change", () => {
                    configStore.setFeature(typedKey, checkbox.checked);
                });
            },
        );

        const ttlRow = document.createElement("label");
        ttlRow.className = "settings-feature-flag-row";

        const ttlInput = document.createElement("input");
        ttlInput.type = "number";
        ttlInput.min = "1";
        ttlInput.step = "1";
        ttlInput.value = String(configStore.getAssetCache().ttlHours);

        const ttlTextContainer = document.createElement("div");
        ttlTextContainer.className = "settings-feature-flag-text-flex";

        const ttlNameElement = document.createElement("strong");
        ttlNameElement.textContent = "Cache retention (hours)";

        const ttlDescriptionElement = document.createElement("span");
        ttlDescriptionElement.textContent =
            "Previously downloaded app audio, images, and hosted tiles stay cached for this many hours.";

        ttlTextContainer.appendChild(ttlNameElement);
        ttlTextContainer.appendChild(ttlDescriptionElement);

        ttlRow.appendChild(ttlInput);
        ttlRow.appendChild(ttlTextContainer);
        assetCacheControls.appendChild(ttlRow);

        ttlInput.addEventListener("change", () => {
            const ttlHours = Number(ttlInput.value);

            if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
                ttlInput.value = String(configStore.getAssetCache().ttlHours);
                return;
            }

            configStore.setAssetCache({ ttlHours });
        });

        configStore.addListener((event) => {
            if (event.key !== "features") {
                if (event.key === "assetCache") {
                    ttlInput.value = String(event.value.ttlHours);
                }

                return;
            }

            const { key, value } = event.value;
            const checkbox = checkboxByKey[key];
            if (checkbox) {
                checkbox.checked = value;
            }
        });
    }
}
