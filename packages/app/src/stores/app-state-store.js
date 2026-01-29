/**
 * App State Store
 * Manages whether to show the welcome screen or main app
 */

import { writable } from "svelte/store";

// Function to check if URL has any parameters
const hasURLParams = () => {
  return window.location.search.length > 0;
};

// Show welcome screen only if:
// - No URL parameters AND not ?app parameter
// If URL has ?app, skip welcome screen even though it's a parameter
const urlParams = new URLSearchParams(window.location.search);
const skipWelcome = urlParams.has('app') || (hasURLParams() && !urlParams.has('app'));
const shouldShowWelcome = !skipWelcome && !hasURLParams();

// Create store for app state - true = show main app, false = show welcome screen
export const showMainApp = writable(!shouldShowWelcome);

// Function to go to main app
export const enterMainApp = () => {
  showMainApp.set(true);
};

// Function to return to welcome screen
export const returnToWelcome = () => {
  showMainApp.set(false);
};
