/**
 * URL State Management
 * 
 * This module handles synchronization between model inputs and URL parameters,
 * allowing users to share configurations via URL.
 * 
 * In multi-scenario mode, parameters are prefixed with s1_ or s2_
 * and a 'mode=multi' parameter is added.
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { model, modelB, activeModel } from "../stores/model-store";
import { isMultiScenarioMode } from "../stores/scenario-mode-store";

/**
 * Encode all non-default input values into URL parameters
 * @returns {string} URL search params string
 */
export function encodeInputsToURL() {
  const params = new URLSearchParams();
  const isMultiMode = isMultiScenarioMode.get();
  
  if (isMultiMode) {
    // Multi-scenario mode: encode both scenarios with prefixes
    params.set('mode', 'multi');
    
    // Encode Scenario 1 (model A)
    const modelA = model.get();
    if (modelA) {
      coreConfig.inputs.forEach((spec) => {
        if (spec.secondaryType === "hidden") return;
        
        const input = modelA.getInputForId(spec.id);
        if (!input) return;
        
        const currentValue = input.get();
        const defaultValue = spec.defaultValue;
        
        if (currentValue !== defaultValue) {
          params.set(`s1_${spec.id}`, currentValue);
        }
      });
    }
    
    // Encode Scenario 2 (model B)
    const modelBInstance = modelB.get();
    if (modelBInstance) {
      coreConfig.inputs.forEach((spec) => {
        if (spec.secondaryType === "hidden") return;
        
        const input = modelBInstance.getInputForId(spec.id);
        if (!input) return;
        
        const currentValue = input.get();
        const defaultValue = spec.defaultValue;
        
        if (currentValue !== defaultValue) {
          params.set(`s2_${spec.id}`, currentValue);
        }
      });
    }
  } else {
    // Single-scenario mode: encode only the active model
    const modelInstance = activeModel.get();
    
    if (!modelInstance) {
      console.warn('No active model instance');
      return '';
    }

    coreConfig.inputs.forEach((spec) => {
      if (spec.secondaryType === "hidden") return;
      
      const input = modelInstance.getInputForId(spec.id);
      if (!input) return;
      
      const currentValue = input.get();
      const defaultValue = spec.defaultValue;
      
      if (currentValue !== defaultValue) {
        params.set(spec.id, currentValue);
      }
    });
  }

  return params.toString();
}

/**
 * Decode URL parameters and apply them to the model inputs
 * @param {string} searchString - URL search params string (e.g., window.location.search)
 * @returns {number} Number of inputs successfully applied
 */
export function decodeURLToInputs(searchString = window.location.search) {
  const params = new URLSearchParams(searchString);
  
  // Check if URL specifies multi-scenario mode
  const urlMode = params.get('mode');
  const isMultiMode = urlMode === 'multi';
  
  // Set the mode based on URL and trigger the toggle button
  if (isMultiMode) {
    isMultiScenarioMode.set(true);
    
    // Trigger the toggle switch UI to reflect multi-scenario mode
    // Wait for DOM to be ready
    setTimeout(() => {
      const $toggleInput = $('.toggle-switch input[type="checkbox"]');
      if ($toggleInput.length > 0 && !$toggleInput.prop('checked')) {
        $toggleInput.prop('checked', true).trigger('change');
      }
    }, 100);
  }
  
  let appliedCount = 0;
  
  if (isMultiMode) {
    // Multi-scenario mode: decode both scenarios
    const modelA = model.get();
    const modelBInstance = modelB.get();
    
    if (!modelA || !modelBInstance) {
      console.warn('Models not fully initialized');
      return 0;
    }
    
    // Apply Scenario 1 parameters (s1_ prefix)
    params.forEach((value, key) => {
      if (key.startsWith('s1_')) {
        const inputId = key.substring(3); // Remove 's1_' prefix
        const spec = coreConfig.inputs.get(inputId);
        if (!spec) {
          console.warn(`Unknown input ID in URL: ${inputId}`);
          return;
        }
        
        const input = modelA.getInputForId(spec.id);
        if (!input) {
          console.warn(`Input not found for ID: ${inputId}`);
          return;
        }
        
        try {
          const coercedValue = coerceValueForSpec(value, spec);
          input.set(coercedValue);
          appliedCount++;
        } catch (error) {
          console.error(`Failed to apply URL param ${key}=${value}:`, error);
        }
      }
    });
    
    // Apply Scenario 2 parameters (s2_ prefix)
    params.forEach((value, key) => {
      if (key.startsWith('s2_')) {
        const inputId = key.substring(3); // Remove 's2_' prefix
        const spec = coreConfig.inputs.get(inputId);
        if (!spec) {
          console.warn(`Unknown input ID in URL: ${inputId}`);
          return;
        }
        
        const input = modelBInstance.getInputForId(spec.id);
        if (!input) {
          console.warn(`Input not found for ID: ${inputId}`);
          return;
        }
        
        try {
          const coercedValue = coerceValueForSpec(value, spec);
          input.set(coercedValue);
          appliedCount++;
        } catch (error) {
          console.error(`Failed to apply URL param ${key}=${value}:`, error);
        }
      }
    });
    
    console.log(`Applied ${appliedCount} inputs from URL (multi-scenario mode)`);
  } else {
    // Single-scenario mode: decode only active model
    const modelInstance = activeModel.get();
    
    if (!modelInstance) {
      console.warn('No active model instance');
      return 0;
    }
    
    params.forEach((value, key) => {
      // Skip the 'mode' parameter
      if (key === 'mode') return;
      
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
        const coercedValue = coerceValueForSpec(value, spec);
        input.set(coercedValue);
        appliedCount++;
      } catch (error) {
        console.error(`Failed to apply URL param ${key}=${value}:`, error);
      }
    });
    
    console.log(`Applied ${appliedCount} inputs from URL (single-scenario mode)`);
  }

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
