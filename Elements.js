"use strict";

import { deepFreeze } from "./Globals.js";

const missingElements = new Set();

function findElement(selector) {
        const element = document.querySelector(selector);
        if (element === null) {
                if (missingElements.has(selector)) {
                        return;
                }

                console.error(`Element not found: ${selector}`);
                missingElements.add(selector);
        }

        return element;
}

// This turns each property with a selector string into a getter function for dynamically
// get the element when the property is accessed. A functions is needed to support nested
// objects.
function applyElementGetters(object) {
        for (const [key, value] of Object.entries(object)) {
                if (typeof value === "string") {
                        Object.defineProperty(object, key, {
                                get() {
                                        return findElement(value);
                                }
                        });

                        continue;
                } 

                if (typeof value === "object" && value !== null) {
                        applyElementGetters(value);
                        continue;
                }
        }
}

export const DOM = {
        header: {
                defaultIcon: "#default-icon",
                accountIcon: "#account-icon"
        },
        home: {
                section: "#home-section",
        },
        void: {
                section: "#void-section",
                pathField: "#void-path",
                detailsField: "#void-details"
        },
        page: {
                section: "#page-section",
                account: {
                        details: {
                                section: "#account-details-section",
                                avatarImage: "#avatar-image",
                                usernameField: "#username-field",
                                emailField: "#email-field",
                                emailStatusField: "#email-status-field",
                                memberSinceField: "#member-since-field",
                                lastLoginField: "#last-login-field",
                                signOutButton: "#sign-out-button"
                        },
                        signIn: {
                                section: "#sign-in-section",
                                emailInput: "#sign-in-email",
                                passwordInput: "#sign-in-password",
                                signInButton: "#sign-in-button",
                                signUpLink: "#sign-up-link"
                        },
                        signUp: {
                                section: "#sign-up-section",
                                emailInput: "#sign-up-email",
                                passwordInput: "#sign-up-password",
                                signUpButton: "#sign-up-button",
                                signInLink: "#sign-in-link"
                        }
                }
        }
};

applyElementGetters(DOM);
deepFreeze(DOM);