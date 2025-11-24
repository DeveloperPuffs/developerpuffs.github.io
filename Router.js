"use strict";

import { deepFreeze } from "./Globals.js";
import { DOM } from "./Elements.js";

function displayError(path, details = null) {
        DOM.void.pathField.textContent = path;
        DOM.void.detailsField.textContent = details ?? "Unknown error.";
}

function displaySection(section) {
        DOM.home.section.hidden = true;
        DOM.page.section.hidden = true;
        DOM.void.section.hidden = true;
        section.hidden = false;
};

export const pages = {
        home: {
                path: "/",
                file: null
        },
        account: {
                path: "/account",
                file: "Account.html"
        },
        sokobee: {
                path: "/sokobee",
                file: "Sokobee.html"
        }
};

deepFreeze(pages);

const listeners = new Set();
export function onPageLoad(callback) {
        listeners.add(callback);
}

export async function loadPage(page) {
        if (page === pages.home) {
                displaySection(DOM.home.section);
                return;
        }

        try {
                const response = await fetch(page.file);
                if (response.ok === false) {
                        displaySection(DOM.void.section);
                        displayError(page.path, `File fetch error ${response.status}: ${response.statusText}`);
                        return;
                }

                displaySection(DOM.page.section);
                DOM.page.section.innerHTML = await response.text();
        } catch (error) {
                displaySection(DOM.void.section);
                displayError(page.path, `Navigation error: ${error}`);
                return;
        }

        for (const callback of listeners) {
                callback(page);
        }
}

export async function loadPath(path = window.location.pathname) {
        // The path is "/Index.html" when running locally (during development) but I also need to
        // include "/" since static servers treat "/Index.html" as the default page (or "/") in a
        // directory.
        if (path === "/" || path.endsWith("/Index.html")) {
                await loadPage(pages.home);
                return;
        }

        for (const page of Object.values(pages)) {
                if (page.path === path) {
                        await loadPage(page);
                        return;
                }
        }

        displaySection(DOM.void.section);
        displayError(path, "Path is not recognized or does not correspond to any existing page.");
}

export async function setup() {
        // When a navigation link is clicked, the behavior is overriden to correctly use the browser's
        // history API to change the page.
        document.addEventListener("click", async event => {
                const link = event.target.closest("[data-navigation-link]");
                if (link === null) {
                        return;
                }

                event.preventDefault();

                const path = link.getAttribute("href");
                console.log("Clicked link href:", path);
                history.pushState({}, "", path);
                await loadPath(path);
        });

        // Update the state of the page for when the forward or back buttons are pressed.
        window.addEventListener("popstate", async () => {
                await loadPath();
        });

        // The 404 fallback script adds a query parameter before redirecting to this page to keep track of
        // the current page (when reloading on github pages). If the paramter contains a value, this will
        // set the state correctly with the history API.
        const searchParameters = new URLSearchParams(window.location.search);
        if (searchParameters.has("redirect")) {
                const redirectPath = searchParameters.get("redirect");
                history.replaceState({}, "", redirectPath);
        }

        // Load the home page initially to finish setting up
        await loadPage(pages.home);
}