"use strict";

import * as Authentication from "./Authentication.js";
import * as Router from "./Router.js";
import { DOM } from "./Elements.js";

let accountPageActive = false;

function displaySection(section) {
        DOM.page.account.details.section.hidden = true;
        DOM.page.account.signIn.section.hidden = true;
        DOM.page.account.signUp.section.hidden = true;
        section.hidden = false;
};

function populateAccountDetails(user) {
        DOM.page.account.details.usernameField.textContent =
                user.user_metadata.username || "[No Username]";
        DOM.page.account.details.emailField.textContent = user.email;
        DOM.page.account.details.emailStatusField.textContent =
                user.email_confirmed_at ? "Verified" : "Pending";
        DOM.page.account.details.memberSinceField.textContent =
                new Date(user.created_at).toLocaleString();
        DOM.page.account.details.lastLoginField.textContent =
                new Date(user.last_sign_in_at).toLocaleString();
}

export function setup() {
        Authentication.onAuthenticationStateChange(async user => {
                if (!accountPageActive) {
                        return;
                }

                if (user === null) {
                        await Router.loadPage(Router.pages.home);
                        alert("You are now signed out.");
                        return;
                }

                displaySection(DOM.page.account.details.section);
                populateAccountDetails(user);
        });

        Router.onPageLoad(page => {
                if (page !== Router.pages.account) {
                        accountPageActive = false;
                        return;
                }

                accountPageActive = true;

                DOM.page.account.details.signOutButton.addEventListener("click", async () => {
                        await Authentication.signOut();
                });

                DOM.page.account.signIn.signInButton.addEventListener("click", async () => {
                        try {
                                await Authentication.signIn(
                                        DOM.page.account.signIn.emailInput.value,
                                        DOM.page.account.signIn.passwordInput.value
                                );
                        } catch (error) {
                                alert(`Authentication error ${error.status}: ${error.message}`);
                        }
                });

                DOM.page.account.signIn.signUpLink.addEventListener("click", () => {
                        displaySection(DOM.page.account.signUp.section);
                });

                DOM.page.account.signUp.signUpButton.addEventListener("click", async () => {
                        try {
                                await Authentication.signUp(
                                        DOM.page.account.signUp.emailInput.value,
                                        DOM.page.account.signUp.passwordInput.value
                                );
                        } catch (error) {
                                alert(`Authentication error ${error.status}: ${error.message}`);
                        }
                });

                DOM.page.account.signUp.signInLink.addEventListener("click", () => {
                        displaySection(DOM.page.account.signIn.section);
                });

                const currentUser = Authentication.getCurrentUser();
                if (currentUser === null) {
                        displaySection(DOM.page.account.signIn.section);
                        return;
                }

                displaySection(DOM.page.account.details.section);
                populateAccountDetails(currentUser);
        });
}