import { getConfigStore } from "../config";
import { getElementOrThrow, logger, type LogLevel } from "../utils";

export class ConsoleTracker {
    constructor() {
        const configStore = getConfigStore();
        this.consoleElement = getElementOrThrow({ id: "console" });
        this.unsubscribeFn = undefined;

        this.handleVisibilityChange(configStore.getFeature("console").value);

        configStore.addListener((event) => {
            if (event.key !== "features") {
                return;
            }

            const { key, value: showConsole } = event.value;
            if (key !== "console") {
                return;
            }

            this.handleVisibilityChange(showConsole);
        });
    }

    private handleVisibilityChange = (show: boolean) => {
        this.consoleElement.classList.toggle("hidden", !show);

        if (show) {
            if (!this.unsubscribeFn) {
                this.unsubscribeFn = logger.subscribe(this.loggerSubscription);
            }
            return;
        }

        if (this.unsubscribeFn) {
            this.unsubscribeFn();
            this.unsubscribeFn = undefined;
        }
    };

    loggerSubscription = (level: LogLevel, messages: unknown[]) => {
        const line = document.createElement("div");
        line.className = `log-line log-line-level-${level}`;

        line.textContent = messages.map((e) => String(e)).join(" ");

        this.consoleElement.appendChild(line);

        // Auto-scroll to bottom
        this.consoleElement.scrollTop = this.consoleElement.scrollHeight;
    };

    private consoleElement: HTMLElement;
    private unsubscribeFn: (() => void) | undefined;
}
