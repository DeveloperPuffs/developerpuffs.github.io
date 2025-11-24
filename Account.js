"use strict";

import * as Backend from "./Backend.js";
import * as Router from "./Router.js";
import { DOM } from "./Elements.js";

function displaySection(section) {
        DOM.page.account.profile.section.hidden = true;
        DOM.page.account.profileSetup.section.hidden = true;
        DOM.page.account.profileError.section.hidden = true;
        DOM.page.account.signIn.section.hidden = true;
        DOM.page.account.signUp.section.hidden = true;
        section.hidden = false;
};

function populateProfileDetails() {
        const profile = Backend.getAccountProfile();
        DOM.page.account.profile.usernameField.textContent = profile.username;

        const avatarUrl = Backend.getAvatarUrl();
        if (avatarUrl !== null) {
                DOM.page.account.profile.profilePicture.src = avatarUrl;
        }
}

async function backendEventCallback(event) {
        switch (event) {
                case Backend.Event.SIGNED_IN: {
                        const profile = Backend.getAccountProfile();
                        if (profile === null) {
                                displaySection(DOM.page.account.profileSetup.section);
                                return;
                        }

                        if (profile === Backend.PROFILE_LOAD_ERROR) {
                                displaySection(DOM.page.account.profileError.section);
                                return;
                        }

                        displaySection(DOM.page.account.details.section);
                        populateProfileDetails();
                        return;
                }

                case Backend.Event.SIGNED_OUT: {
                        await Router.loadPage(Router.pages.home);
                        alert("You are now signed out.");
                        return;
                }

                case Backend.Event.PROFILE_LOADED:
                case Backend.Event.PROFILE_CREATED:
                case Backend.Event.PROFILE_UPDATED: {
                        displaySection(DOM.page.account.profile.section);
                        populateProfileDetails();
                        return;
                }
        }
}

function pageLoadedCallback(page) {
        if (page !== Router.pages.account) {
                Backend.removeCallback(backendEventCallback);
                return;
        }

        Backend.registerCallback(backendEventCallback);

        DOM.page.account.profile.profilePicture.addEventListener("click", () => {
                DOM.page.account.profile.profilePictureInput.click();
        });

        DOM.page.account.profile.profilePictureInput.addEventListener("change", async event => {
                const selectedFiles = event.target.files;
                if (selectedFiles.length === 0) {
                        return;
                }

                const selectedFile = selectedFiles[0];
                // TODO: Make sure the selected file is under the max file soze
                if (!(await Backend.uploadAvatar(selectedFile))) {
                        // Show a message saying that the profile picture failed to upadte
                }
        });

        DOM.page.account.profile.signOutButton.addEventListener("click", async () => {
                await Backend.signOut();
        });

        DOM.page.account.profileSetup.createProfileButton.addEventListener("click", async () => {
                const username = DOM.page.account.profileSetup.usernameInput.value;
                const avatar = null; // get the avatar if the user uploaded one during the profile creation
                if (!(await Backend.createProfile(username))) {
                        // Show a message saying that the profile creation failed
                }

                if (avatar !== null) {
                        await Backend.uploadAvatar(avatar);
                }
        });

        DOM.page.account.profileError.retryLoadButton.addEventListener("click", async () => {
                await Router.loadPage(Router.pages.account);
        });

        DOM.page.account.signIn.signInButton.addEventListener("click", async () => {
                const email = DOM.page.account.signIn.emailInput.value;
                const password = DOM.page.account.signIn.passwordInput.value;
                if (!(await Backend.signIn(email, password))) {
                        // Show a messsage saying that the sign in failed 
                }
        });

        DOM.page.account.signIn.signUpLink.addEventListener("click", () => {
                displaySection(DOM.page.account.signUp.section);
        });

        DOM.page.account.signUp.signUpButton.addEventListener("click", async () => {
                const email = DOM.page.account.signUp.emailInput.value;
                const password = DOM.page.account.signUp.passwordInput.value;
                if (!(await Backend.signUp(email, password))) {
                        // Show a message saying that the sign up failed
                }
        });

        DOM.page.account.signUp.signInLink.addEventListener("click", () => {
                displaySection(DOM.page.account.signIn.section);
        });

        const account = Backend.getCurrentAccount();
        if (account === null) {
                displaySection(DOM.page.account.signIn.section);
                return;
        }

        const profile = Backend.getAccountProfile();
        if (profile === null) {
                displaySection(DOM.page.account.profileSetup.section);
                return;
        }

        if (profile === Backend.PROFILE_LOAD_ERROR) {
                displaySection(DOM.page.account.profileError.section);
                return;
        }

        displaySection(DOM.page.account.profile.section);
        populateProfileDetails();
}

export function setup() {
        Router.onPageLoad(pageLoadedCallback);
}