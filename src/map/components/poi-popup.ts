type PopupConfiguration = {
    title: string;
};

/**
 * returns HTML for popup
 */
export const poiPopup = (config: PopupConfiguration): string =>
    `<div>
       <div class="poi-label">${config.title}</div>
    </div>`;
