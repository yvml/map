import { getElementOrThrow, logger, type LogLevel } from "../utils";

export class ConsoleTracker {
    constructor() {
        this.consoleElement = getElementOrThrow({ id: "console" });
        logger.subscribe(this.loggerSubscription);
    }

    loggerSubscription = (level: LogLevel, messages: unknown[]) => {
        const line = document.createElement("div");
        line.className = `log-line log-line-level-${level}`;

        line.textContent = messages.map((e) => String(e)).join(" ");

        this.consoleElement.appendChild(line);

        // Auto-scroll to bottom
        this.consoleElement.scrollTop = this.consoleElement.scrollHeight;
    };

    private consoleElement: HTMLElement;
}
