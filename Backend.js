"use strict";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deepFreeze } from "./Globals.js";

const supabaseURL = "https://sawnjidfgqwlcmbmvtpw.supabase.co"
const supabaseKey
        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd25qaWRmZ3F3bG"
        + "NtYm12dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODQyMzQsImV4cCI6MjA3ODQ2MDIzNH0.BnK1nTWOI"
        + "HXaMB1vXI3hgx8kCW_xrTnnsbz1Mqrd6ag";
const supabase = createClient(supabaseURL, supabaseKey);

export const PROFILE_LOAD_ERROR = Symbol("BACKEND_PROFILE_LOAD_ERROR");

export const Event = {
        SIGNED_IN: Symbol("BACKEND_EVENT_SIGNED_IN"),
        SIGNED_OUT: Symbol("BACKEND_EVENT_SIGNED_OUT"),
        PROFILE_CREATED: Symbol("BACKEND_EVENT_PROFILE_CREATED"),
        PROFILE_LOADED: Symbol("BACKEND_EVENT_PROFILE_LOADED"),
        PROFILE_UPDATED: Symbol("BACKEND_EVENT_PROFILE_UPDATED")
};

deepFreeze(Event);

const callbacks = new Set();

export function registerCallback(callback) {
        callbacks.add(callback);
}

export function removeCallback(callback) {
        return callbacks.delete(callback);
}

function triggerEvent(event) {
        for (const callback of callbacks) {
                callback(event);
        }
}

let currentAccount = null;
let accountProfile = null;

export function getCurrentAccount() {
        return currentAccount;
}

export function getAccountProfile() {
        return accountProfile;
}

// Loads the user account on startup if there is a saved session
export async function loadAccount() {
        const accountQueryResult = await supabase.auth.getUser();
        if (accountQueryResult.error !== null) {
                console.error(`Authentication error ${accountQueryResult.error.status}: ${accountQueryResult.error.message}`);
                return;
        }

        currentAccount = accountQueryResult.data.user;
        triggerEvent(Event.SIGNED_IN);
}

export async function signIn(email, password) {
        const signInResult = await supabase.auth.signInWithPassword({ email, password });
        if (signInResult.error !== null) {
                console.error(`Authentication error ${signInResult.error.status}: ${signInResult.error.message}`);
                return false;
        }

        currentAccount = signInResult.data.user;
        triggerEvent(Event.SIGNED_IN);
        return true;
}

export async function signUp(email, password) {
        const signUpResult = await supabase.auth.signUp({ email, password });
        if (signUpResult.error !== null) {
                console.error(`Authentication error ${signUpResult.error.status}: ${signUpResult.error.message}`);
                return false;
        }

        currentAccount = signUpResult.data.user;
        triggerEvent(Event.SIGNED_IN);
        return true;
}

export async function signOut() {
        await supabase.auth.signOut();
        triggerEvent(Event.SIGNED_OUT);
}

export async function createProfile(username) {
        if (currentAccount === null) {
                throw new Error("Cannot create profile: User is not signed in to an account");
        }

        if (accountProfile !== null) {
                throw new Error("Cannot create profile: Account already has a profile");
        }

        const profile = {};
        profile.identifier = currentAccount.id;
        profile.username = username;

        const profileCreationResult = await supabase
                .from("profiles")
                .insert(profile)
                .select()
                .single();

        if (profileCreationResult.error !== null) {
                console.error(`Failed to create profile ${profileCreationResult.error.status}: ${profileCreationResult.error.message}`);
                return false;
        }

        accountProfile = profileCreationResult.data;
        triggerEvent(Event.PROFILE_CREATED);
        return true;
}

export function getAvatarUrl(profile = accountProfile) {
        if (profile === null) {
                throw new Error("Cannot get avatar URL: Profile is missing");
        }

        if (!profile.avatar) {
                return null;
        }

        const avatarUrlQuery = supabase.storage
                .from("avatars")
                .getPublicUrl(profile.identifier);

        // Bust the cache by using a timestamp to get the newest version of the image
        return `${avatarUrlQuery.data.publicUrl}?v=${Date.now()}`;
}

export async function uploadAvatar(image) {
        console.log("uploading avatar...");

        if (accountProfile === null || accountProfile === PROFILE_LOAD_ERROR) {
                throw new Error("Cannot upload avatar: Profile is missing or failed to load ");
        }

        const avatarUploadResult = await supabase.storage
                .from("avatars")
                .upload(accountProfile.identifier /* The file name of the image */, image, {
                        upsert: true,
                        cacheControl: "0",
                        contentType: image.type
                });

        if (avatarUploadResult.error !== null) {
                console.error(`Failed to upload avatar ${avatarUploadResult.error.status}: ${avatarUploadResult.error.message}`);
                return false;
        }

        if (!accountProfile.avatar) {
                const profileUpdate = {};
                profileUpdate.avatar = true;

                const profileUpdateResult = await supabase
                        .from("profiles")
                        .update(profileUpdate)
                        .eq("identifier", accountProfile.identifier);

                if (profileUpdateResult.error !== null) {
                        console.error(`Failed to update profile ${profileUpdateResult.error.status}: ${profileUpdateResult.error.message}`);

                        const avatarDeletionResult = await supabase
                                .storage
                                .from("avatars")
                                .remove([`${accountProfile.identifier}`]);

                        if (avatarDeletionResult.error !== null) {
                                console.error(`Failed to delete avatar ${avatarDeletionResult.error.status}: ${avatarDeletionResult.error.message}`);
                        }

                        return false;
                }
        }

        console.log("Avatar uploaded");
        triggerEvent(Event.PROFILE_UPDATED);
        return true;
}

// Automatically try to load the profile after the user signed into an account
registerCallback(async event => {
        if (event !== Event.SIGNED_IN) {
                return;
        }

        const profileQueryResult = await supabase
                .from("profiles")
                .select("*")
                .eq("identifier", currentAccount.id)
                .maybeSingle();

        if (profileQueryResult.error !== null) {
                console.error(`Failed to load profile ${profileQueryResult.error.status}: ${profileQueryResult.error.message}`);
                accountProfile = PROFILE_LOAD_ERROR;
                return;
        }

        accountProfile = profileQueryResult.data;
        triggerEvent(Event.PROFILE_LOADED);
});
