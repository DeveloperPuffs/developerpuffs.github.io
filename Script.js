"use strict";

import * as Router from "./Router.js";
import * as Backend from "./Backend.js";
import * as Account from "./Account.js";
import { DOM } from "./Elements.js";

await Router.setup();

Account.setup();

Backend.registerCallback(event => {
        switch (event) {
                case Backend.Event.PROFILE_LOADED:
                case Backend.Event.PROFILE_CREATED:
                case Backend.Event.PROFILE_UPDATED:
                case Backend.Event.SIGNED_OUT: {
                        // Set profile picture icon
                        return;
                }
        }
});

await Backend.loadAccount();

DOM.void.retryButton.addEventListener("click", async () => {
        await Router.loadPath();
});