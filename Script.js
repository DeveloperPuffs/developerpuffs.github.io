"use strict";

import * as Router from "./Router.js";
import * as Backend from "./Backend.js";
import * as Account from "./Account.js";
import { DOM } from "./Elements.js";

function animatePlasmapuffs(timestamp) {
        const scaleX = 1 + Math.cos(timestamp / 200) / 50;
        const scaleY = 1 + Math.sin(timestamp / 200) / 50;
        DOM.home.plasmapuffsIcon.style.transform = `scale(${scaleX}, ${scaleY})`;

        window.requestAnimationFrame(animatePlasmapuffs);
}

window.requestAnimationFrame(animatePlasmapuffs);

Account.setup();

// When the profile or authentication state gets updated, refresh the profile picture icon in the header
Backend.registerCallback(event => {
        switch (event) {
                case Backend.Event.PROFILE_LOADED:
                case Backend.Event.PROFILE_CREATED:
                case Backend.Event.PROFILE_UPDATED:
                case Backend.Event.SIGNED_OUT: {
                        const accountProfile = Backend.getAccountProfile();
                        if (accountProfile === null) {
                                DOM.header.profilePictureIcon.src = "Assets/Icons/ProfilePicture.png";
                                break;
                        }

                        DOM.header.profilePictureIcon.src = Backend.getAvatarUrl();
                        break;
                }
        }
});

await Router.setup();
await Backend.loadAccount();

DOM.void.retryButton.addEventListener("click", async () => {
        await Router.loadPath();
});