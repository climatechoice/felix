/**
 * URL State Management
 * 
 * This module handles synchronization between model inputs and URL parameters,
 * allowing users to share configurations via URL.
 */

import { config as coreConfig } from "@core";
import { activeModel } from "../stores/model-store";

/**
 * Encode all non-default input values into URL parameters
 * @returns {string} URL search params string
 */
export function encodeInputsToURL() {
  const params = new URLSearchParams();
  const modelInstance = activeModel.get();
  
  if (!modelInstance) {
    console.warn('No active model instance');
    return '';
  }

  // Iterate through all inputs
  coreConfig.inputs.forEach((spec) => {
    // Skip hidden external driver variables (controlled by SSP scenarios)
    if (spec.secondaryType === "hidden") {
      return;
    }
    
    const input = modelInstance.getInputForId(spec.id);
    if (!input) return;
    
    const currentValue = input.get();
    const defaultValue = spec.defaultValue;
    
    // Only include values that differ from default
    if (currentValue !== defaultValue) {
      // Use input ID as the parameter key
      params.set(spec.id, currentValue);
    }
  });

  return params.toString();
}

/**
 * Decode URL parameters and apply them to the model inputs
 * @param {string} searchString - URL search params string (e.g., window.location.search)
 * @returns {number} Number of inputs successfully applied
 */
export function decodeURLToInputs(searchString = window.location.search) {
  const params = new URLSearchParams(searchString);
  const modelInstance = activeModel.get();
  
  if (!modelInstance) {
    console.warn('No active model instance');
    return 0;
  }

  let appliedCount = 0;
  
  // Iterate through URL parameters
  params.forEach((value, key) => {
    const spec = coreConfig.inputs.get(key);
    if (!spec) {
      console.warn(`Unknown input ID in URL: ${key}`);
      return;
    }
    
    const input = modelInstance.getInputForId(spec.id);
    if (!input) {
      console.warn(`Input not found for ID: ${key}`);
      return;
    }
    
    try {
      // Parse and coerce the value based on input type
      const coercedValue = coerceValueForSpec(value, spec);
      input.set(coercedValue);
      appliedCount++;
    } catch (error) {
      console.error(`Failed to apply URL param ${key}=${value}:`, error);
    }
  });

  console.log(`Applied ${appliedCount} inputs from URL`);
  return appliedCount;
}

/**
 * Update the browser URL with current input state (without page reload)
 * @param {boolean} replaceState - If true, replaces current history entry; if false, pushes new entry
 */
export function syncInputsToURL(replaceState = true) {
  const params = encodeInputsToURL();
  const newURL = params ? `${window.location.pathname}?${params}` : window.location.pathname;
  
  if (replaceState) {
    window.history.replaceState({}, '', newURL);
  } else {
    window.history.pushState({}, '', newURL);
  }
}

/**
 * Get a shareable URL with current configuration
 * @returns {string} Full URL with encoded inputs
 */
export function getShareableURL() {
  const params = encodeInputsToURL();
  const baseURL = window.location.origin + window.location.pathname;
  return params ? `${baseURL}?${params}` : baseURL;
}

/**
 * Helper function to coerce value based on spec type
 * Adapted from ImportExport.js
 */
function coerceValueForSpec(rawValue, spec) {
  if (typeof rawValue === "number") return rawValue;
  const str = String(rawValue).trim();
  if (str === "") return null;

  if (spec.inputType === "switch") {
    const lower = str.toLowerCase();
    if (lower === "true" || lower === "1" || lower === spec.enabledValue)
      return spec.enabledValue;
    if (lower === "false" || lower === "0" || lower === spec.disabledValue)
      return spec.disabledValue;
    return spec.disabledValue;
  }

  const num = Number(str);
  if (Number.isNaN(num))
    throw new Error(`Cannot parse "${str}" as a number for input ${spec.id}`);
  return num;
}

/**
 * Copy shareable URL to clipboard
 * @returns {Promise<boolean>} True if successful
 */
export async function copyShareableURLToClipboard() {
  try {
    const url = getShareableURL();
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy URL:', error);
    return false;
  }
}
