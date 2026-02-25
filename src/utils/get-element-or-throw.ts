/**
 * get element by ID or class
 *
 * @throws if not found
 */
export const getElementOrThrow = <T extends HTMLElement>(element: {
    id: string;
}): T => {
    const foundElement = document.getElementById(element.id);
    if (!foundElement) {
        throw Error("Element not found by id: " + element.id);
    }
    return foundElement as T;
};
