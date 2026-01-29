/**
 * Year Range Store
 * Manages default year ranges for graphs when not specified in graphs.csv
 * and the present-day reference line year
 */

import { writable } from "svelte/store";

// Default year range settings
const DEFAULT_MIN_YEAR = 1980;
const DEFAULT_MAX_YEAR = 2060;
const DEFAULT_PRESENT_YEAR = 2025;

// Create stores for year range settings
export const defaultMinYear = writable(DEFAULT_MIN_YEAR);
export const defaultMaxYear = writable(DEFAULT_MAX_YEAR);
export const presentYear = writable(DEFAULT_PRESENT_YEAR);

// Load settings from localStorage if available
const loadSettings = () => {
  try {
    const stored = localStorage.getItem("yearRangeSettings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.minYear !== undefined) defaultMinYear.set(settings.minYear);
      if (settings.maxYear !== undefined) defaultMaxYear.set(settings.maxYear);
      if (settings.presentYear !== undefined) presentYear.set(settings.presentYear);
    }
  } catch (e) {
    console.warn("Failed to load year range settings from localStorage:", e);
  }
};

// Save settings to localStorage
const saveSettings = (minYear, maxYear, presentYr) => {
  try {
    const settings = {
      minYear,
      maxYear,
      presentYear: presentYr
    };
    localStorage.setItem("yearRangeSettings", JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save year range settings to localStorage:", e);
  }
};

// Subscribe to changes and save to localStorage
let currentMinYear = DEFAULT_MIN_YEAR;
let currentMaxYear = DEFAULT_MAX_YEAR;
let currentPresentYear = DEFAULT_PRESENT_YEAR;

defaultMinYear.subscribe(value => {
  currentMinYear = value;
  saveSettings(currentMinYear, currentMaxYear, currentPresentYear);
  // Update global window variable for backward compatibility
  window.defaultMinYear = value;
});

defaultMaxYear.subscribe(value => {
  currentMaxYear = value;
  saveSettings(currentMinYear, currentMaxYear, currentPresentYear);
  // Update global window variable for backward compatibility
  window.defaultMaxYear = value;
});

presentYear.subscribe(value => {
  currentPresentYear = value;
  saveSettings(currentMinYear, currentMaxYear, currentPresentYear);
  // Update global window variable for backward compatibility
  window.presentDayYear = value;
});

// Initialize settings on module load
loadSettings();

// Export utility function to reset to defaults
export const resetYearRangeSettings = () => {
  defaultMinYear.set(DEFAULT_MIN_YEAR);
  defaultMaxYear.set(DEFAULT_MAX_YEAR);
  presentYear.set(DEFAULT_PRESENT_YEAR);
};

// Export getters for current values
export const getYearRangeSettings = () => ({
  minYear: currentMinYear,
  maxYear: currentMaxYear,
  presentYear: currentPresentYear
});
