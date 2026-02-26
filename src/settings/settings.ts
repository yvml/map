import { LocalStorageProvider } from "../storage";
import { getElementOrThrow } from "../utils";

export class SettingsMenu {
    constructor() {
        const settingsButton = getElementOrThrow({ id: "navbar-settings" });
        const settingsPane = getElementOrThrow({ id: "settings-pane" });
        const closeButton = getElementOrThrow({ id: "settings-pane-close" });
        const clearLocalStorageButton = getElementOrThrow({
            id: "settings-pane-clear-local-storage",
        });

        settingsButton.addEventListener("click", () => {
            settingsPane.classList.toggle("hidden");
        });

        closeButton.addEventListener("click", () => {
            settingsPane.classList.add("hidden");
        });

        clearLocalStorageButton.addEventListener("click", () => {
            LocalStorageProvider.clear();
        });

        // TODO: read and write settings
    }
}
