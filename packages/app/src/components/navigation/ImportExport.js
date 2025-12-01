/**
 * ImportExport.js
 * Extracted from NavBar.js - handles clipboard-based import/export of scenario inputs
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { model, modelB, activeModel } from "../../stores/model-store.js";
import { isMultiScenarioMode } from "../../stores/scenario-mode-store.js";
import { initInputsUI } from "../InputsUI.js";

/**
 * Export the active model's inputs to clipboard (as URL params format)
 */
export async function exportInputsToCSV() {
  const activeModelInstance = activeModel.get();
  
  if (!activeModelInstance) {
    alert("No model loaded. Please refresh the page.");
    return;
  }

  const params = new URLSearchParams();

  coreConfig.inputs.forEach((spec) => {
    // Skip hidden external driver variables (controlled by SSP scenarios)
    if (spec.secondaryType === "hidden" || spec.maingraph === "HIDDEN") {
      return;
    }
    
    const input = activeModelInstance.getInputForId(spec.id);
    if (!input) return;

    const currentValue = input.get();
    const defaultValue = spec.defaultValue;
    
    // Only include values that differ from default
    if (currentValue !== defaultValue) {
      params.set(spec.id, currentValue);
    }
  });

  const paramsString = params.toString();
  
  try {
    await navigator.clipboard.writeText(paramsString);
    
    // Show success feedback
    showTemporaryMessage("✓ Copied to clipboard", "success");
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    alert("Failed to copy to clipboard. Please check browser permissions.");
  }
}

/**
 * Handle import button click - reads from clipboard
 */
export async function handleImportClick() {
  try {
    const clipboardText = await navigator.clipboard.readText();
    
    if (!clipboardText || clipboardText.trim() === '') {
      alert("Clipboard is empty.");
      return;
    }

    // If in multi-scenario mode, show popup to select which scenario to import into
    if (isMultiScenarioMode.get()) {
      showScenarioSelectionPopup(clipboardText);
    } else {
      // In single scenario mode, import directly into model 1
      processImportText(clipboardText, 1);
    }
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    alert("Failed to read from clipboard. Please check browser permissions.");
  }
}

/**
 * Show temporary success/error message
 */
function showTemporaryMessage(message, type = "success") {
  const color = type === "success" ? "#4caf50" : "#f44336";
  const $message = $(`
    <div style="
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    ">${message}</div>
  `);
  
  $("body").append($message);
  
  setTimeout(() => {
    $message.fadeOut(300, () => $message.remove());
  }, 2000);
}

/**
 * Show popup to select which scenario to import into (multi-scenario mode only)
 */
function showScenarioSelectionPopup(importText) {
  // Remove any existing popup
  $(".popup-overlay, .popup").remove();

  const popup = $('<div class="popup popup-middle" style="max-width: 400px;">');
  
  const content = $('<div style="padding: 20px; text-align: center;">').html(`
    <h2 style="margin-top: 0;">Import Scenario</h2>
    <p style="color: #666; margin-bottom: 30px;">Which scenario would you like to import into?</p>
    
    <div style="display: flex; gap: 15px; justify-content: center;">
      <button class="import-scenario-choice" data-model="1" style="
        padding: 15px 30px;
        background: #6a3d9a;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s;
      ">
        Scenario 1
      </button>
      <button class="import-scenario-choice" data-model="2" style="
        padding: 15px 30px;
        background: #e66100;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s;
      ">
        Scenario 2
      </button>
    </div>
    
    <button class="import-cancel-btn" style="
      margin-top: 20px;
      padding: 8px 20px;
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Cancel</button>
  `);

  const closeBtn = $(`
    <button class="popup-close">
      <span class="material-icons">close</span>
    </button>
  `);

  const overlay = $('<div class="popup-overlay">');
  
  const closePopup = () => {
    popup.remove();
    overlay.remove();
  };

  closeBtn.on("click", closePopup);
  content.find('.import-cancel-btn').on('click', closePopup);
  
  // Handle scenario selection
  content.find('.import-scenario-choice').on('click', function() {
    const modelNumber = parseInt($(this).data('model'));
    closePopup();
    processImportText(importText, modelNumber);
  });

  // Hover effects
  content.find('.import-scenario-choice').on('mouseenter', function() {
    const model = $(this).data('model');
    $(this).css('background', model === 1 ? '#552f7a' : '#cc5500');
  }).on('mouseleave', function() {
    const model = $(this).data('model');
    $(this).css('background', model === 1 ? '#6a3d9a' : '#e66100');
  });

  popup.append(closeBtn, content);
  overlay.append(popup);
  overlay.on("click", (e) => {
    if (e.target === overlay[0]) closePopup();
  });
  
  $("body").append(overlay);
}

/**
 * Process and import text from clipboard into the specified model
 */
export function processImportText(text, modelNumber = 1) {
  const params = new URLSearchParams(text);
  const targetModelInstance = modelNumber === 2 ? modelB.get() : model.get();
  const targetModelLabel = `Scenario ${modelNumber}`;
  
  if (!targetModelInstance) {
    console.error(`${targetModelLabel} instance not available`);
    alert(`Error: ${targetModelLabel} not loaded. Please refresh the page.`);
    return;
  }

  let applied = 0;
  let warnings = 0;

  params.forEach((value, inputId) => {
    const spec = coreConfig.inputs.get(inputId);
    
    if (!spec) {
      console.warn(`Unknown input ID: ${inputId}`);
      warnings++;
      return;
    }
    
    const input = targetModelInstance.getInputForId(spec.id);
    
    if (!input) {
      console.warn(`Input id "${spec.id}" not present on ${targetModelLabel}`);
      warnings++;
      return;
    }

    try {
      const coerced = coerceValueForSpec(value, spec);
      input.set(coerced);
      applied++;
    } catch (err) {
      console.error(`Failed to set value for input "${inputId}" in ${targetModelLabel}:`, err);
      warnings++;
    }
  });

  // Refresh Inputs UI so changes are visible
  const selectedCategory = $(".input-category-selector-option.selected").data("value");
  initInputsUI(selectedCategory);

  console.log(`Import to ${targetModelLabel} finished. Applied: ${applied}. Warnings: ${warnings}.`);
  
  showTemporaryMessage(
    `✓ Imported ${applied} value(s) into ${targetModelLabel}`,
    "success"
  );
  
  if (warnings > 0) {
    console.warn(`${warnings} warning(s) during import - check console for details.`);
  }
}

// ============ Helper Functions ============

/**
 * Coerce value based on input spec type
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
