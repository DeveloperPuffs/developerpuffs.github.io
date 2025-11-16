"use strict";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseURL = "https://sawnjidfgqwlcmbmvtpw.supabase.co"
const supabaseKey
        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd25qaWRmZ3F3bG"
        + "NtYm12dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODQyMzQsImV4cCI6MjA3ODQ2MDIzNH0.BnK1nTWOI"
        + "HXaMB1vXI3hgx8kCW_xrTnnsbz1Mqrd6ag";
const supabase = createClient(supabaseURL, supabaseKey);

let currentUser = null;

const listeners = new Set();
export function onAuthenticationStateChange(callback) {
        listeners.add(callback);
}

export function getCurrentUser() {
        return currentUser;
}

function setCurrentUser(user) {
        currentUser = user;
        for (const callback of listeners) {
                callback(user);
        }
}

export async function loadUser() {
        const userQueryResult = await supabase.auth.getUser();
        if (userQueryResult.error !== null) {
                console.error(`Authentication error ${userQueryResult.error.status}: ${userQueryResult.error.message}`);
                setCurrentUser(null);
                return;
        }

        setCurrentUser(userQueryResult.data.user);
}

export async function signIn(email, password) {
        const signInResult = await supabase.auth.signInWithPassword({
                email,
                password
        });

        if (signInResult.error !== null) {
                throw signInResult.error;
        }

        setCurrentUser(signInResult.data.user);
}

export async function signUp(email, password) {
        const signUpResult = await supabase.auth.signUp({
                email,
                password
        });

        if (signUpResult.error !== null) {
                throw signUpResult.error;
        }

        setCurrentUser(signUpResult.data.user);
}

export async function signOut() {
        await supabase.auth.signOut();
        setCurrentUser(null);
}